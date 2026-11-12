package database

import (
	"context"
	"fmt"
	"regexp"
	"strings"

	"google.golang.org/api/iterator"
)

// deleteStatementPattern matches: DELETE WHERE <conditions>
// The collection comes from the page the user is on. The WHERE clause is
// mandatory so a typo can never wipe a whole collection.
var deleteStatementPattern = regexp.MustCompile(`(?is)^\s*DELETE\s+WHERE\s+(.+?)\s*;?\s*$`)

func parseDeleteStatement(statement string) (string, error) {
	matches := deleteStatementPattern.FindStringSubmatch(statement)
	if matches == nil {
		return "", fmt.Errorf("invalid delete statement, expected: DELETE WHERE <field> == <value> [AND <field> == <value>]")
	}
	where := strings.TrimSpace(matches[1])

	// validate the WHERE clause up front so the preview fails fast
	if _, err := parseQuery(where); err != nil {
		return "", err
	}
	return where, nil
}

// PreviewDeleteQuery parses the statement and counts the documents in collection it would delete,
// without modifying anything.
func (c *Client) PreviewDeleteQuery(ctx context.Context, collection string, statement string) (DeletePreview, error) {
	if err := c.ensure(); err != nil {
		return DeletePreview{}, err
	}

	where, err := parseDeleteStatement(statement)
	if err != nil {
		return DeletePreview{}, err
	}

	collectionQuery := c.database.Collection(collection).Query
	query, err := applyQuery(collectionQuery, where)
	if err != nil {
		return DeletePreview{}, err
	}

	countRes, err := query.NewAggregationQuery().WithCount("count").Get(ctx)
	if err != nil {
		return DeletePreview{}, fmt.Errorf("PreviewDeleteQuery: %w", err)
	}

	totalRes, err := collectionQuery.NewAggregationQuery().WithCount("count").Get(ctx)
	if err != nil {
		return DeletePreview{}, fmt.Errorf("PreviewDeleteQuery: %w", err)
	}

	return DeletePreview{
		Collection: collection,
		Where:      where,
		Count:      extractCount(countRes),
		Total:      extractCount(totalRes),
	}, nil
}

// ExecuteDeleteQuery deletes every document matching the statement and
// returns how many were deleted.
func (c *Client) ExecuteDeleteQuery(ctx context.Context, collection string, statement string) (int64, error) {
	if err := c.ensure(); err != nil {
		return 0, err
	}

	where, err := parseDeleteStatement(statement)
	if err != nil {
		return 0, err
	}

	query, err := applyQuery(c.database.Collection(collection).Query, where)
	if err != nil {
		return 0, err
	}

	// Select() with no fields only fetches document references, not their data
	iter := query.Select().Documents(ctx)
	defer iter.Stop()

	var docIDs []string
	for {
		snap, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return 0, fmt.Errorf("ExecuteDeleteQuery: %w", err)
		}
		docIDs = append(docIDs, snap.Ref.ID)
	}

	if len(docIDs) == 0 {
		return 0, nil
	}

	if err := c.BulkDeleteDocuments(ctx, collection, docIDs); err != nil {
		return 0, err
	}
	return int64(len(docIDs)), nil
}
