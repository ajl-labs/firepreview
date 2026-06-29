package database

import (
	"context"
	"fmt"

	"google.golang.org/api/iterator"
)

func (c *Client) ListCollections(ctx context.Context) ([]CollectionInfo, error) {

	if err := c.ensure(); err != nil {
		return nil, err
	}

	inter := c.database.Collections(ctx)
	var collections []CollectionInfo

	for {
		col, err := inter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("inter.Next: %w", err)
		}
		collections = append(collections, CollectionInfo{
			ID:   col.ID,
			Path: col.Path,
		})
	}
	return collections, nil
}
