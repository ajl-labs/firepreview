package database

import (
	"context"
	"fmt"
	"sort"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/iterator"
)

func (c *Client) GetCollection(ctx context.Context, collectionPath string, params PaginationParams) (QueryResult, error) {
	if err := c.ensure(); err != nil {
		return QueryResult{}, err
	}

	query := c.database.Collection(collectionPath).Query

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
	limit int,
) (QueryResult, error) {
	if err := c.ensure(); err != nil {
		return QueryResult{}, err
	}

	q := c.database.Collection(collectionPath).Where(field, operator, value)
	if limit > 0 {
		q = q.Limit(limit)
	}

	return c.runQuery(ctx, q, limit)
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

// snapshotToResult converts a Firestore DocumentSnapshot to a DocumentResult
func snapshotToResult(snap *firestore.DocumentSnapshot) DocumentResult {
	return DocumentResult{
		ID:     snap.Ref.ID,
		Path:   snap.Ref.Path,
		Fields: snap.Data(),
	}
}
