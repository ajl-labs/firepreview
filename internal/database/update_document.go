package database

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"cloud.google.com/go/firestore"
)

// UpdateDocument writes only the changed top-level fields of a document and
// removes the fields listed in removedFields. Fields that are not mentioned are
// left untouched, so their Firestore types (timestamps, references, ...) survive.
//
// changesJSON is a JSON object of field -> new value. It is passed as a string
// so numbers can be decoded precisely (integers stay integers).
func (c *Client) UpdateDocument(ctx context.Context, collection string, docID string, changesJSON string, removedFields []string) (DocumentResult, error) {
	if err := c.ensure(); err != nil {
		return DocumentResult{}, err
	}

	changes, err := decodeChanges(changesJSON)
	if err != nil {
		return DocumentResult{}, err
	}
	if len(changes) == 0 && len(removedFields) == 0 {
		return DocumentResult{}, fmt.Errorf("no changes to save")
	}

	docRef := c.database.Collection(collection).Doc(docID)
	snap, err := docRef.Get(ctx)
	if err != nil {
		return DocumentResult{}, fmt.Errorf("UpdateDocument %q: %w", docRef.Path, err)
	}
	original := snap.Data()

	updates := make([]firestore.Update, 0, len(changes)+len(removedFields))
	for field, value := range changes {
		if strings.TrimSpace(field) == "" {
			return DocumentResult{}, fmt.Errorf("field names cannot be empty")
		}
		value, err := coerceToOriginalType(field, original[field], value)
		if err != nil {
			return DocumentResult{}, err
		}
		updates = append(updates, firestore.Update{FieldPath: firestore.FieldPath{field}, Value: value})
	}
	for _, field := range removedFields {
		updates = append(updates, firestore.Update{FieldPath: firestore.FieldPath{field}, Value: firestore.Delete})
	}

	// fail instead of overwriting if someone else changed the document since we read it
	if _, err := docRef.Update(ctx, updates, firestore.LastUpdateTime(snap.UpdateTime)); err != nil {
		return DocumentResult{}, fmt.Errorf("UpdateDocument %q: %w", docRef.Path, err)
	}

	updated, err := docRef.Get(ctx)
	if err != nil {
		return DocumentResult{}, fmt.Errorf("UpdateDocument %q: %w", docRef.Path, err)
	}
	return snapshotToResult(updated), nil
}

func decodeChanges(changesJSON string) (map[string]any, error) {
	decoder := json.NewDecoder(strings.NewReader(changesJSON))
	decoder.UseNumber()

	var changes map[string]any
	if err := decoder.Decode(&changes); err != nil {
		return nil, fmt.Errorf("invalid JSON: %w", err)
	}
	for field, value := range changes {
		changes[field] = normalizeNumbers(value)
	}
	return changes, nil
}

// normalizeNumbers turns json.Number into int64 when it is a whole number,
// otherwise float64, recursing into maps and arrays.
func normalizeNumbers(value any) any {
	switch v := value.(type) {
	case json.Number:
		if i, err := v.Int64(); err == nil {
			return i
		}
		f, _ := v.Float64()
		return f
	case map[string]any:
		for key, item := range v {
			v[key] = normalizeNumbers(item)
		}
		return v
	case []any:
		for i, item := range v {
			v[i] = normalizeNumbers(item)
		}
		return v
	default:
		return value
	}
}

// coerceToOriginalType keeps the field's existing Firestore type where JSON
// cannot express it: timestamps arrive as strings and doubles as whole numbers.
func coerceToOriginalType(field string, original any, value any) (any, error) {
	switch original.(type) {
	case time.Time:
		s, ok := value.(string)
		if !ok {
			return value, nil
		}
		t, err := time.Parse(time.RFC3339Nano, s)
		if err != nil {
			return nil, fmt.Errorf("field %q is a timestamp, expected a date like 2026-01-31T09:00:00Z", field)
		}
		return t, nil
	case float64:
		if i, ok := value.(int64); ok {
			return float64(i), nil
		}
	}
	return value, nil
}
