# FirePreview

## About

FirePreview is a desktop application built with Wails (Go) and React-TypeScript. It provides a modern interface for previewing and managing files with real-time updates and seamless integration between frontend and backend.

You can configure the project by editing `wails.json`. More information about the project settings can be found
here: https://wails.io/docs/reference/project-config

## Project Structure

```
firepreview/
├── frontend/                 # React-TypeScript UI
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── pages/           # Page components
│   │   ├── App.tsx          # Main App component
│   │   └── main.tsx         # Entry point
│   ├── index.html
│   └── package.json
├── backend/                  # Go backend
│   ├── main.go              # Application entry point
│   ├── app.go               # Application logic
│   └── handlers/            # Backend handlers
├── wails.json               # Wails configuration
├── README.md
└── go.mod

```

## Prerequisites

- Go 1.21 or higher
- Node.js 16+ and npm/yarn
- Wails CLI: `go install github.com/wailsapp/wails/v2/cmd/wails@latest`

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Live Development

To run in live development mode, run `wails dev` in the project directory. This will run a Vite development
server that will provide very fast hot reload of your frontend changes. If you want to develop in a browser
and have access to your Go methods, there is also a dev server that runs on http://localhost:34115. Connect
to this in your browser, and you can call your Go code from devtools.

## Building

To build a redistributable, production mode package, use `wails build`.

## Available Commands

- `wails dev` - Run in development mode with hot reload
- `wails build` - Build production executable
- `npm run dev` - Start Vite dev server
- `npm run build` - Build frontend assets
