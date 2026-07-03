package database

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"sort"
	"strings"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/iterator"
)

type cursor struct {
	OrderValue interface{} `json:"o"`
	DocID      string      `json:"id"`
}

func encodeCursor(c cursor) string {
	b, _ := json.Marshal(c)
	return base64.URLEncoding.EncodeToString(b)
}

func decodeCursor(s string) (cursor, error) {
	var c cursor
	b, err := base64.URLEncoding.DecodeString(s)
	if err != nil {
		return c, err
	}
	err = json.Unmarshal(b, &c)
	return c, err
}

func (c *Client) GetCollection(ctx context.Context, collectionPath string, params QueryParams) (QueryResult, error) {
	if err := c.ensure(); err != nil {
		return QueryResult{}, err
	}

	collectionRef := c.database.Collection(collectionPath)

	// 1. Total count via aggregation query (cheap, doesn't read docs)
	countRes, err := collectionRef.NewAggregationQuery().WithCount("all").Get(ctx)
	if err != nil {
		return QueryResult{}, fmt.Errorf("GetCollection: %w", err)
	}

	total := extractCount(countRes)

	query := c.database.Collection(collectionPath).Query

	if params.Query != "" {
		var err error
		query, err = applyQuery(query, params.Query)
		if err != nil {
			return QueryResult{}, fmt.Errorf("GetCollection: %w", err)
		}
	}
	// if we have a cursor, start after that document
	if params.Cursor != "" {
		cursorParams, err := decodeCursor(params.Cursor)
		if err != nil {
			return QueryResult{}, fmt.Errorf("GetCollection: %w", err)
		}
		switch params.Direction {
		case "next":
			query = query.StartAfter(cursorParams.DocID).Limit(params.Limit)
		case "prev":
			query = query.EndBefore(cursorParams.DocID).LimitToLast(params.Limit)
		default:
			query = query.Limit(params.Limit)
		}
	}

	docs, err := query.Documents(ctx).GetAll()
	if err != nil {
		return QueryResult{}, fmt.Errorf("GetCollection: %w", err)
	}

	var items []DocumentResult
	fields := make(map[string]FieldInfo)
	for _, d := range docs {
		data := d.Data()
		data["id"] = d.Ref.ID
		items = append(items, snapshotToResult(d))
		// append the fields from this document to the fields map
		for field := range data {
			fields[field] = FieldInfo{
				Name:  field,
				Type:  "string", // Placeholder, you might want to determine the actual type
				Count: fields[field].Count + 1,
			}
		}
	}

	fieldList := make([]FieldInfo, 0, len(fields))
	for _, fieldInfo := range fields {
		fieldList = append(fieldList, fieldInfo)
	}

	resp := QueryResult{
		Documents: items,
		Total:     total,
		Limit:     params.Limit,
		Fields:    fieldList,
	}

	if params.Limit > 0 {
		resp.TotalPages = int((total + int64(params.Limit) - 1) / int64(params.Limit))
	}

	if len(docs) > 0 {
		first := docs[0]
		last := docs[len(docs)-1]

		resp.PrevCursor = encodeCursor(cursor{
			// OrderValue: first.Data()[orderField],
			DocID: first.Ref.ID,
		})
		resp.NextCursor = encodeCursor(cursor{
			// OrderValue: last.Data()[orderField],
			DocID: last.Ref.ID,
		})
	}

	// hasNext/hasPrev: cheap heuristic — if we got a full page there's
	// likely a next page; refine with an extra existence check if needed.
	resp.HasNext = int64(len(docs)) == int64(params.Limit)
	resp.HasPrev = params.Cursor != "" // frontend tracks real prev state via its cursor stack

	return resp, nil
}

func (c *Client) GetDocument(ctx context.Context, docPath string) (DocumentResult, error) {
	if err := c.ensure(); err != nil {
		return DocumentResult{}, err
	}

	snap, err := c.database.Doc(docPath).Get(ctx)

	if err != nil {
		return DocumentResult{}, fmt.Errorf("GetDocument %q: %w", docPath, err)
	}
	return snapshotToResult(snap), nil
}

// QueryCollection runs a single where filter on a collection.
// operator examples: "==", ">", "<", ">=", "<=", "array-contains"
func (c *Client) QueryCollection(
	ctx context.Context,
	collectionPath string,
	field string,
	operator string,
	value interface{},
	params QueryParams,
) (QueryResult, error) {
	if err := c.ensure(); err != nil {
		return QueryResult{}, err
	}

	q := c.database.Collection(collectionPath).Where(field, operator, value)
	if params.Limit > 0 {
		q = q.Limit(params.Limit)
	}

	return c.runQuery(ctx, q, params.Limit, 0)
}

func (c *Client) runQuery(ctx context.Context, query firestore.Query, limit int, total int64) (QueryResult, error) {
	iter := query.Documents(ctx)
	defer iter.Stop()

	var docs []DocumentResult
	// var lastDocId string

	fields := make(map[string]FieldInfo)
	for {
		snap, err := iter.Next()
		if err == iterator.Done {
			break
		}

		if err != nil {
			return QueryResult{}, fmt.Errorf("runQuery: %w", err)
		}

		// append the fields from this document to the fields map
		for field := range snap.Data() {
			fields[field] = FieldInfo{
				Name:  field,
				Type:  "string", // Placeholder, you might want to determine the actual type
				Count: fields[field].Count + 1,
			}
		}

		// Append the document result to the docs slice
		docs = append(docs, snapshotToResult(snap))
		// Update the lastDocId to the current snapshot
		// lastDocId = snap.Ref.ID
	}

	fieldList := make([]FieldInfo, 0, len(fields))
	for _, fieldInfo := range fields {
		fieldList = append(fieldList, fieldInfo)
	}

	// Sort by field name, then by count
	sort.Slice(fieldList, func(i, j int) bool {
		if fieldList[i].Count == fieldList[j].Count {
			return fieldList[i].Name < fieldList[j].Name
		}
		return fieldList[i].Count > fieldList[j].Count

	})

	// nextPageToken := ""
	// if len(docs) == limit {
	// 	nextPageToken = lastDocId
	// }

	return QueryResult{
		Documents: docs,
		Total:     total,
		Fields:    fieldList,
	}, nil
}

func (c *Client) BulkDeleteDocuments(ctx context.Context, collectionName string, docIDs []string) error {
	fmt.Println("BulkDeleteDocuments called with paths:", docIDs) // Debugging line
	if err := c.ensure(); err != nil {
		return err
	}

	bw := c.database.BulkWriter(ctx)

	type deleteJob struct {
		docID string
		job   *firestore.BulkWriterJob
	}
	jobs := make([]deleteJob, 0, len(docIDs))

	for _, id := range docIDs {
		docRef := c.database.Collection(collectionName).Doc(id)

		job, err := bw.Delete(docRef)
		if err != nil {
			return fmt.Errorf("failed to enqueue delete for %s/%s: %w", collectionName, id, err)
		}
		jobs = append(jobs, deleteJob{docID: id, job: job})
	}

	bw.End() // flushes all queued writes

	var errs []error
	for _, j := range jobs {
		if _, err := j.job.Results(); err != nil {
			errs = append(errs, fmt.Errorf("delete failed for %s/%s: %w", collectionName, j.docID, err))
		}
	}

	if len(errs) > 0 {
		return fmt.Errorf("some deletes failed: %v", errs)
	}

	return nil
}

func (c *Client) GetCollectionFields(collectionName string) ([]string, error) {
	if c.database == nil {
		return nil, fmt.Errorf("not connected to a database")
	}
	if collectionName == "" {
		return nil, fmt.Errorf("collection name is required")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*1e9) // 10s
	defer cancel()

	const sampleSize = 20

	iter := c.database.Collection(collectionName).Limit(sampleSize).Documents(ctx)
	defer iter.Stop()

	fieldSet := make(map[string]struct{})

	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("iterating documents: %w", err)
		}

		for field := range doc.Data() {
			fieldSet[field] = struct{}{}
		}
	}

	fields := make([]string, 0, len(fieldSet))
	for field := range fieldSet {
		fields = append(fields, field)
	}
	sort.Strings(fields)

	return fields, nil
}
func applyQuery(query firestore.Query, queryStr string) (firestore.Query, error) {
	parsedParts, err := parseQuery(queryStr)
	if err != nil {
		return query, fmt.Errorf("applyQuery: %w", err)
	}

	for _, part := range parsedParts {
		query = query.Where(part.Field, part.Operator, part.Value)
	}

	return query, nil
}

func parseQuery(queryStr string) ([]ParsedQueryPart, error) {
	var parsedParts []ParsedQueryPart
	queryStrCombinations := strings.Split(queryStr, " AND ")
	for _, queryStr := range queryStrCombinations {
		parts := strings.Split(queryStr, " ")
		if len(parts) != 3 {
			return nil, fmt.Errorf("invalid query format: %q", queryStr)

		}

		parsedParts = append(parsedParts, ParsedQueryPart{
			Field:    parts[0],
			Operator: parts[1],
			Value:    parts[2],
		})
	}
	return parsedParts, nil
}

// snapshotToResult converts a Firestore DocumentSnapshot to a DocumentResult
func snapshotToResult(snap *firestore.DocumentSnapshot) DocumentResult {
	return DocumentResult{
		ID:     snap.Ref.ID,
		Path:   snap.Ref.Path,
		Fields: snap.Data(),
	}
}

func extractCount(res firestore.AggregationResult) int64 {
	v, ok := res["all"]
	if !ok {
		return 0
	}
	// firestorepb.Value under the hood; the Go SDK exposes it via GetIntegerValue()
	if pv, ok := v.(interface{ GetIntegerValue() int64 }); ok {
		return pv.GetIntegerValue()
	}
	fmt.Println("unexpected aggregation result type")
	return 0
}
