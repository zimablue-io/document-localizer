# Document Localizer - Agent Guidelines

## Architecture

> **Electron + React desktop application** with Vite bundler

```
apps/
└── desktop/                    # Electron + React desktop app
    ├── src/                    # React frontend
    │   ├── App.tsx            # Main app (orchestration only)
    │   ├── components/        # UI components (DiffView, SettingsModal, etc.)
    │   ├── lib/               # Utilities (export, utils)
    │   ├── types/             # TypeScript declarations
    │   └── main.tsx           # React entry point
    ├── electron/              # Electron main process
    │   ├── main.ts            # Main process (IPC handlers, file dialogs)
    │   └── preload.ts          # Context bridge for renderer
    └── dist-electron/         # Compiled Electron (auto-generated)
    
packages/
└── core/                      # Shared business logic
    └── src/
        ├── services/
        │   ├── openai-client.ts   # OpenAI-compatible API client
        │   ├── file-processor.ts   # File processing (PDF/MD)
        │   └── localize.ts
        └── utils/chunk.ts
```

### Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS v4
- **Desktop**: Electron 33 (not Tauri!)
- **PDF Parsing**: `@doclocalizer/core` (pdfjs-dist based, runs in renderer)
- **Settings**: JSON file stored in `app.getPath('userData')` via Electron IPC

## Key Patterns

### Electron IPC Architecture

Main process exposes IPC handlers in `electron/main.ts`:
- `dialog:openFile` / `dialog:saveFile` - Native file dialogs
- `fs:readFile` / `fs:writeTextFile` - File system operations
- `settings:load` / `settings:save` - Settings persistence
- `history:get` / `history:add` - History persistence
- `ai:generate` - AI API calls via Chromium's `net.fetch`

Renderer accesses via `window.electron.*` (defined in `electron/preload.ts`)

### Settings Persistence

- Settings stored in: `~/Library/Application Support/document-localizer/settings.json`
- History stored in: `~/Library/Application Support/document-localizer/history.json`
- Documents stored in: `~/Library/Application Support/document-localizer/documents.json`
- MAX_HISTORY_ITEMS: 100

### Processing Flow

1. User selects files via native file dialog (PDF or .md)
2. For PDF: Base64 encoded data sent to frontend → `pdfjs-dist` parses in renderer
3. For .md: Files read directly via IPC
4. Frontend splits markdown into chunks with overlap
5. Each chunk sent to AI for localization (via `ai:generate` IPC)
6. Results combined and shown in diff view
7. User approves/rejects before export

## Running the App

```bash
# Development
cd apps/desktop && pnpm dev

# Production build
cd apps/desktop && pnpm run build
```

## File Naming Conventions

- TypeScript files: PascalCase for React components, camelCase for utilities
- Electron files: camelCase
- Settings keys: camelCase

## Configuration Defaults

- API URL: `http://localhost:8080/v1` (OpenAI-compatible)
- Model: `llama:3.2:3b-instruct`
- Chunk size: 1000 chars
- Overlap: 100 chars
- Target locale: `en-GB` (British English)

## Development Notes

- Settings and history use plain JSON files (no conf library)
- PDF parsing happens in renderer via `pdfjs-dist`
- AI calls use Electron's built-in `net.fetch` (Chromium networking)
- All file operations go through IPC (no direct fs access in renderer)
- Vite dev server runs on port 1420
