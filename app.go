package main

import (
	"context"
	"firepreview/internal/database"
	"fmt"

	"github.com/joho/godotenv"
)

// App struct
type App struct {
	ctx context.Context
	db  *database.Client
}

// NewApp creates a new App application struct
func NewApp() *App {
	err := godotenv.Load()
	if err != nil {
		fmt.Println("Error loading .env file")
	}
	return &App{
		db: database.New(),
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	persistedConfig := database.LoadConnectionConfig()
	if persistedConfig != nil {
		if err := a.db.Connect(ctx, *persistedConfig); err != nil {
			fmt.Printf("auto-reconnect failed: %v\n", err)
			database.ClearConnection() // delete invalid config
		}
	}
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

func (a *App) shutdown(ctx context.Context) {
	a.db.Disconnect()
}

func (a *App) ConnectToDatabase(config database.ConnectionConfig) error {
	a.db.Disconnect() // Disconnect if already connected
	return a.db.Connect(a.ctx, config)
}

func (a *App) IsDatabaseConnected() bool {
	return a.db.IsConnected()
}

func (a *App) GetDatabaseConnectionStatus() (database.ConnectionStatus, error) {
	return a.db.GetConnectionStatus(a.ctx)
}
func (a *App) DisconnectFirestore() {
	a.db.Disconnect()
}

func (a *App) ListCollections() ([]database.CollectionInfo, error) {
	return a.db.ListCollections(a.ctx)
}

func (a *App) GetCollection(collectionPath string, params database.QueryParams) (database.QueryResult, error) {
	return a.db.GetCollection(a.ctx, collectionPath, params)
}

func (a *App) GetDocument(docPath string) (database.DocumentResult, error) {
	return a.db.GetDocument(a.ctx, docPath)
}

func (a *App) BulkDeleteDocuments(collectionPath string, docIDs []string) error {
	return a.db.BulkDeleteDocuments(a.ctx, collectionPath, docIDs)
}
