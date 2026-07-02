package database

import (
	"context"
	"fmt"
	"sort"
	"strings"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/iterator"
)

func (c *Client) GetCollection(ctx context.Context, collectionPath string, params QueryParams) (QueryResult, error) {
	if err := c.ensure(); err != nil {
		return QueryResult{}, err
	}

	query := c.database.Collection(collectionPath).Query

	if params.Query != "" {
		var err error
		query, err = applyQuery(query, params.Query)
		if err != nil {
			return QueryResult{}, fmt.Errorf("GetCollection: %w", err)
		}
	}
	// if we have a cursor, start after that document
	if params.PageToken != "" {
		lastDocSnap, err := c.database.Collection(collectionPath).Doc(params.PageToken).Get(ctx)
		if err != nil {
			return QueryResult{}, fmt.Errorf("GetCollection: %w", err)
		}
		query = query.StartAfter(lastDocSnap)
	}

	if params.Limit > 0 {
		query = query.Limit(params.Limit)
	}
	return c.runQuery(ctx, query, params.Limit)
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

	return c.runQuery(ctx, q, params.Limit)
}

func (c *Client) runQuery(ctx context.Context, query firestore.Query, limit int) (QueryResult, error) {
	iter := query.Documents(ctx)
	defer iter.Stop()

	var docs []DocumentResult
	var lastDocId string

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
		lastDocId = snap.Ref.ID
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

	nextPageToken := ""
	if len(docs) == limit {
		nextPageToken = lastDocId
	}

	return QueryResult{
		Documents:     docs,
		Total:         len(docs),
		Fields:        fieldList,
		NextPageToken: nextPageToken,
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
