package database

import (
	"context"
	"fmt"
	"os"

	firestore "firebase.google.com/go/v4"
	"google.golang.org/api/option"
)

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
	return nil
}

// Disconnect closes the Firestore client if open
func (c *Client) Disconnect() {
	if c.database != nil {
		c.database.Close()
		c.database = nil
		c.config = ConnectionConfig{}
	}
}

// IsConnected returns true if a client is active
func (c *Client) IsConnected() bool {
	return c.database != nil
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
