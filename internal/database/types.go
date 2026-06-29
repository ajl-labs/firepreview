package database

import "cloud.google.com/go/firestore"

type ConnectionConfig struct {
	ProjectID       string `json:"projectId"`
	CredentialsPath string `json:"credentialsPath"`
	UseEmulator     bool   `json:"useEmulator"`
}

type DocumentResult struct {
	ID     string                 `json:"id"`
	Path   string                 `json:"path"`
	Fields map[string]interface{} `json:"fields"`
}

type FieldInfo struct {
	Name  string `json:"name"`
	Type  string `json:"type"`
	Count int    `json:"count"`
}

type QueryResult struct {
	Documents     []DocumentResult `json:"documents"`
	Total         int              `json:"total"`
	Fields        []FieldInfo      `json:"fields"`
	NextPageToken string           `json:"nextPageToken"` // empty if no more pages
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

type PaginationParams struct {
	Limit     int    `json:"limit"`
	PageToken string `json:"pageToken"` // last doc ID for cursor-based pagination
	Query     string `json:"query"`     // optional query string for filtering
}
