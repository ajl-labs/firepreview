package database

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"sort"
	"strings"

	"cloud.google.com/go/firestore"
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

func buildCollectionFields(fields map[string]CollectionDocFieldInfo) []CollectionDocFieldInfo {
	fieldList := make([]CollectionDocFieldInfo, 0, len(fields))
	for _, fieldInfo := range fields {
		fieldList = append(fieldList, fieldInfo)
	}

	sort.Slice(fieldList, func(i, j int) bool {
		if fieldList[i].Count == fieldList[j].Count {
			return fieldList[i].Name < fieldList[j].Name
		}
		return fieldList[i].Count > fieldList[j].Count

	})
	return fieldList
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
		if len(parts) < 3 {
			return nil, fmt.Errorf("invalid query format: %q", queryStr)
		}

		// value can be string or array of strings
		var value any = strings.TrimSpace(strings.Join(parts[2:], " "))
		fmt.Println("search value", value)
		switch parts[1] {
		case "==", "!=", "<", "<=", ">", ">=", "array-contains":
			// For these operators, the value can be a string, number, or boolean.
			// We'll keep it as a string for now and let Firestore handle the type conversion.
			value = strings.Trim(value.(string), "\"") // Remove quotes if present
		case "in", "array-contains-any", "not-in":
			// For these operators, the value should be a JSON array.
			if !strings.HasPrefix(parts[2], "[") || !strings.HasSuffix(parts[2], "]") {
				return nil, fmt.Errorf("invalid value for operator %q: %q", parts[1], parts[2])
			}

			valueStr := strings.Trim(parts[2], "[]")
			valueParts := strings.Split(valueStr, ",")
			var valueArray []string
			for _, v := range valueParts {
				v = strings.TrimSpace(v)
				v = strings.Trim(v, "\"") // Remove quotes if present
				valueArray = append(valueArray, v)
			}
			value = valueArray
		default:
			return nil, fmt.Errorf("unsupported operator: %q", parts[1])
		}

		parsedParts = append(parsedParts, ParsedQueryPart{
			Field:    parts[0],
			Operator: parts[1],
			Value:    value,
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
	v, ok := res["count"]
	if !ok {
		return 0
	}
	// firestorepb.Value under the hood; the Go SDK exposes it via GetIntegerValue()
	if pv, ok := v.(interface{ GetIntegerValue() int64 }); ok {
		return pv.GetIntegerValue()
	}
	return 0
}

func (c *Client) GetCollection(ctx context.Context, collectionPath string, params QueryParams) (QueryResult, error) {
	if err := c.ensure(); err != nil {
		return QueryResult{}, err
	}

	// 1. start building the query, and apply any filters from params.Query
	query := c.database.Collection(collectionPath).Query
	if params.Query != "" {
		var err error
		query, err = applyQuery(query, params.Query)
		if err != nil {
			return QueryResult{}, err
		}
	}

	// 2. Total count via aggregation query (cheap, doesn't read docs)
	countRes, err := query.NewAggregationQuery().WithCount("count").Get(ctx)
	if err != nil {
		return QueryResult{}, fmt.Errorf("GetCollection: %w", err)
	}
	total := extractCount(countRes)

	// 3. always order by __name__ ascending — never Desc, never LimitToLast.
	// Firestore's document-ID-only index does not support descending/reverse
	// scans, which is what LimitToLast does internally under the hood. Instead,
	// "prev" is just another forward (StartAfter) query using the cursor for
	// the previous page, which the frontend already tracks in its cursor stack.
	query = query.OrderBy(firestore.DocumentID, firestore.Asc)

	// fetch one extra to check for next page
	plusOneLimit := params.Limit + 1

	// Both "next" and "prev" resolve to a forward StartAfter query — the only
	// difference is which cursor the caller sends. An empty cursor means "first
	// page". There is no direction-based branching here anymore.
	if params.Cursor != "" {
		cursorParams, err := decodeCursor(params.Cursor)
		if err != nil {
			return QueryResult{}, fmt.Errorf("GetCollection: %w", err)
		}
		query = query.StartAfter(cursorParams.DocID).Limit(plusOneLimit)
	} else {
		query = query.Limit(plusOneLimit)
	}

	docsWithExtra, err := query.Documents(ctx).GetAll()

	if err != nil {
		return QueryResult{}, fmt.Errorf("GetCollection: %w", err)
	}

	docs := docsWithExtra
	if len(docsWithExtra) > params.Limit {
		docs = docsWithExtra[:len(docsWithExtra)-1]
	} // exclude the extra doc used for hasNext/hasPrev check

	var items []DocumentResult
	fields := make(map[string]CollectionDocFieldInfo)
	for _, d := range docs { // exclude the extra doc used for hasNext/hasPrev check
		data := d.Data()
		data["id"] = d.Ref.ID
		items = append(items, snapshotToResult(d))
		// append the fields from this document to the fields map
		for field := range data {
			fields[field] = CollectionDocFieldInfo{
				Name:  field,
				Type:  "string", // Placeholder, you might want to determine the actual type
				Count: fields[field].Count + 1,
			}
		}
	}

	response := QueryResult{
		Documents: items,
		Total:     total,
		Limit:     params.Limit,
		Fields:    buildCollectionFields(fields),
	}

	if params.Limit > 0 {
		response.TotalPages = int((total + int64(params.Limit) - 1) / int64(params.Limit))
	}

	if len(docs) > 0 {
		first := docs[0]
		last := docs[len(docs)-1]

		response.PrevCursor = encodeCursor(cursor{
			// OrderValue: first.Data()[orderField],
			DocID: first.Ref.ID,
		})
		response.NextCursor = encodeCursor(cursor{
			// OrderValue: last.Data()[orderField],
			DocID: last.Ref.ID,
		})
	}

	// hasNext/hasPrev: cheap heuristic — if we got a full page there's
	// likely a next page; refine with an extra existence check if needed.
	response.HasNext = int64(len(docsWithExtra)) == int64(plusOneLimit)
	response.HasPrev = params.Cursor != "" // frontend tracks real prev state via its cursor stack

	return response, nil
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

func (c *Client) BulkDeleteDocuments(ctx context.Context, collectionName string, docIDs []string) error {
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
