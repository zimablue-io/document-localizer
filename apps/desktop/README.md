# @doclocalizer/desktop

Electron desktop application for document localization.

## Overview

Cross-platform desktop app that localizes documents between American and British English using local AI models. All processing happens locally - documents never leave your machine.

## Features

- **File Support**: PDF and Markdown files
- **AI Localization**: Uses local LLMs via OpenAI-compatible API (Ollama, LM Studio, llama.cpp)
- **Review System**: Side-by-side diff view with paragraph-level editing
- **Export**: Save localized documents as Markdown or PDF
- **Three-Tab System**:
  - **Uploaded**: Source library (permanent files, never modified)
  - **Tasks**: Active processing (parsing, localizing, review)
  - **Processed**: Completed outputs (approved, rejected, exported)

## Tech Stack

- Electron 33
- React 18 + TypeScript
- Vite
- Tailwind CSS v4
- pdfjs-dist (PDF parsing in renderer)
- @doclocalizer/core (shared business logic)
- @doclocalizer/ui (shared UI components)

## Development

```bash
# Start desktop app (requires core and ui packages built first)
pnpm dev

# Build for production
pnpm build

# Electron-specific build
pnpm electron:build
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Build packages + start Electron dev mode |
| `pnpm dev:web` | Start Vite dev server only (port 1420) |
| `pnpm build` | Build packages + Vite + Electron |
| `pnpm electron:build` | Build Electron app (after Vite build) |
| `pnpm preview` | Preview production build |

## Architecture

```
apps/desktop/
├── src/
│   ├── App.tsx              # Main app (orchestration only)
│   ├── main.tsx             # React entry point
│   ├── components/
│   │   ├── Header.tsx       # Top bar with model selector
│   │   ├── DocumentList.tsx  # Three-tab document list
│   │   ├── DiffView.tsx      # Side-by-side diff with editing
│   │   ├── SettingsModal.tsx # API, model, locale settings
│   │   ├── HistoryPanel.tsx  # Processing history
│   │   ├── ExportDialog.tsx  # Export format selection
│   │   ├── EmptyState.tsx    # Initial upload prompt
│   │   └── document-helpers.tsx  # Status icons, locale selects
│   ├── lib/
│   │   ├── export.ts         # PDF generation (jsPDF)
│   │   └── utils.ts          # Error formatting, helpers
│   └── types/
│       └── electron.d.ts     # TypeScript declarations
├── electron/
│   ├── main.ts              # Main process (IPC handlers)
│   └── preload.ts           # Context bridge
└── dist-electron/          # Compiled Electron (auto-generated)
```

## Electron IPC

Main process exposes these handlers (accessed via `window.electron.*`):

| Handler | Description |
|---------|-------------|
| `openFile` | Open native file dialog (multiple files) |
| `saveFile` | Save dialog for export |
| `readFile` | Read file as base64 |
| `writeTextFile` | Write text content |
| `writeBase64File` | Write binary content |
| `loadSettings` / `saveSettings` | Persist settings |
| `loadUploaded` / `saveUploaded` | Source library |
| `loadTasks` / `saveTasks` | Active processing |
| `loadProcessed` / `saveProcessed` | Completed outputs |
| `getHistory` / `addHistory` / `updateHistory` / `clearHistory` | History |
| `generateAI` | Call AI API via net.fetch |

## Settings Storage

Stored in `~/Library/Application Support/document-localizer/`:
- `settings.json` - API URL, models, chunk size, locales
- `uploaded.json` - Source file library
- `tasks.json` - Active processing tasks
- `processed.json` - Completed outputs
- `history.json` - Processing history

## Port

Vite dev server runs on **http://localhost:1420**

## Notes

- App.tsx is the orchestrator - all UI is in components/
- PDF parsing happens in renderer via pdfjs-dist
- All AI calls use Chromium's built-in net.fetch
- No direct filesystem access in renderer - all via IPC
