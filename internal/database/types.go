package database

import "cloud.google.com/go/firestore"

type ConnectionConfig struct {
	ProjectID       string `json:"projectId"`
	CredentialsPath string `json:"credentialsPath"`
	UseEmulator     bool   `json:"useEmulator"`
	EmulatorHost    string `json:"emulatorHost"`
}

type DocumentResult struct {
	ID     string                 `json:"id"`
	Path   string                 `json:"path"`
	Fields map[string]interface{} `json:"fields"`
}

type CollectionDocFieldInfo struct {
	Name  string `json:"name"`
	Type  string `json:"type"`
	Count int    `json:"count"`
}

type QueryResult struct {
	Documents  []DocumentResult         `json:"documents"`
	Total      int64                    `json:"total"`
	Fields     []CollectionDocFieldInfo `json:"fields"`
	Page       int                      `json:"page"`
	Limit      int                      `json:"pageSize"`
	TotalPages int                      `json:"totalPages"`
	NextCursor string                   `json:"nextCursor,omitempty"`
	PrevCursor string                   `json:"prevCursor,omitempty"`
	HasNext    bool                     `json:"hasNext"`
	HasPrev    bool                     `json:"hasPrev"`
}

type CollectionInfo struct {
	ID   string `json:"id"`
	Path string `json:"path"`
}

// Client wraps the Firestore client and config
type Client struct {
	database *firestore.Client
	config   ConnectionConfig
}

type QueryParams struct {
	Limit     int    `json:"limit"`
	Cursor    string `json:"docId"`     // last doc ID for cursor-based pagination
	Query     string `json:"query"`     // optional query string for filtering
	Direction string `json:"direction"` // "next" or "prev" for pagination direction
}

type ParsedQueryPart struct {
	Field    string
	Operator string
	Value    interface{}
}
