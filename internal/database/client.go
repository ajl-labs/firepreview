package database

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	firestore "firebase.google.com/go/v4"
	"google.golang.org/api/option"
)

func connectionFilePath() (string, error) {
	dir, err := os.UserConfigDir()
	if err != nil {
		return "", fmt.Errorf("UserConfigDir: %w", err)
	}
	appDir := filepath.Join(dir, "firepreview")

	// Ensure the directory exists and can be read/written to.
	if err := os.MkdirAll(appDir, 0700); err != nil {
		return "", fmt.Errorf("MkdirAll: %w", err)
	}

	return filepath.Join(appDir, "connection.json"), nil
}

func saveConnectionConfig(config ConnectionConfig) error {
	path, err := connectionFilePath()
	if err != nil {
		return fmt.Errorf("connectionFilePath: %w", err)
	}

	data, err := json.Marshal(ConnectionConfig{
		ProjectID:       config.ProjectID,
		UseEmulator:     config.UseEmulator,
		EmulatorHost:    config.EmulatorHost,
		CredentialsPath: config.CredentialsPath,
	})

	if err != nil {
		return fmt.Errorf("json.Marshal: %w", err)
	}

	// write file with full read and write access
	return os.WriteFile(path, data, 0600)
}

func LoadConnectionConfig() *ConnectionConfig {
	path, err := connectionFilePath()
	if err != nil {
		return nil
	}

	data, err := os.ReadFile(path)

	if err != nil {
		if os.IsNotExist(err) {
			return nil // no config file yet
		}
		return nil
	}
	var config ConnectionConfig
	if err := json.Unmarshal(data, &config); err != nil {
		return nil
	}
	return &config
}

func ClearConnection() error {
	path, err := connectionFilePath()
	if err != nil {
		return err
	}
	err = os.Remove(path)
	if err != nil && !os.IsNotExist(err) {
		return err
	}
	return nil
}

// New return a new firestore client
func New() *Client {
	return &Client{}
}

func (c *Client) Connect(ctx context.Context, config ConnectionConfig) error {
	if config.ProjectID == "" {
		return fmt.Errorf("project ID is required")
	}

	var app *firestore.App
	var err error

	if config.UseEmulator {
		os.Setenv("FIRESTORE_EMULATOR_HOST", config.EmulatorHost)
		app, err = firestore.NewApp(ctx, &firestore.Config{
			ProjectID: config.ProjectID,
		}, option.WithoutAuthentication())
	} else {

		if config.CredentialsPath == "" {
			return fmt.Errorf("credentialsPath is required for remote connection")
		}
		opt := option.WithAuthCredentialsFile(option.ServiceAccount, config.CredentialsPath)
		app, err = firestore.NewApp(ctx, &firestore.Config{
			ProjectID: config.ProjectID,
		}, opt)
	}

	if err != nil {
		return fmt.Errorf("firebase.NewApp: %w", err)
	}

	fs, err := app.Firestore(ctx)

	if err != nil {
		return fmt.Errorf("app.Firestore: %w", err)
	}
	c.database = fs
	c.config = config

	if err := saveConnectionConfig(config); err != nil {
		// non-fatal — connection still works this session, just won't survive restart
		fmt.Printf("warning: failed to persist connection: %v", err)
	}
	return nil
}

// Disconnect closes the Firestore client if open
func (c *Client) Disconnect() error {
	if c.database != nil {
		if err := c.database.Close(); err != nil {
			return fmt.Errorf("Disconnect: %w", err)
		}
	}
	c.database = nil
	c.config = ConnectionConfig{}
	return ClearConnection()
}

// IsConnected returns true if a client is active
func (c *Client) IsConnected() bool {
	return c.database != nil
}

func (c *Client) GetConnectionStatus(ctx context.Context) (ConnectionConfig, bool) {
	return c.config, c.database != nil
}

// ProjectID returns the project ID of the connected client
func (c *Client) ProjectID() string {
	return c.config.ProjectID
}

// Ensure return an error if not connected -- call this at the top of
// every query method

func (c *Client) ensure() error {
	if !c.IsConnected() {
		return fmt.Errorf("not connected to firestore")
	}
	return nil
}
