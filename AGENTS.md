# Document Localizer - Agent Guidelines

## Architecture

```
apps/
├── desktop/                    # Electron + React desktop app
│   ├── src/
│   │   ├── App.tsx            # Main app (orchestration only)
│   │   ├── components/        # UI components (DiffView, SettingsModal, etc.)
│   │   ├── lib/               # Utilities (export, utils)
│   │   ├── types/             # TypeScript declarations
│   │   └── main.tsx          # React entry point
│   ├── electron/              # Electron main process
│   │   ├── main.ts            # Main process (IPC handlers, file dialogs)
│   │   └── preload.ts         # Context bridge for renderer
│   └── dist-electron/          # Compiled Electron (auto-generated)
└── landing/                    # Marketing landing page (React + Vite)
    ├── src/
    │   ├── App.tsx            # Main app (orchestration only)
    │   ├── components/        # Hero, Features, StepViewer, SetupGuide, Navigation
    │   └── hooks/             # useActiveSection hook
    └── public/images/         # App screenshots for How It Works section

packages/
├── core/                       # Shared business logic
│   └── src/
│       ├── services/            # openai-client, file-processor, localize, diff
│       └── utils/              # chunk, change-detection, chunk-manager
└── ui/                         # Shared UI components
    └── src/components/ui/       # Button, Input, Dialog, etc.
```

### Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS v4
- **Desktop**: Electron 33 (not Tauri!)
- **Landing Page**: React 18 + Vite (port 1421)
- **PDF Parsing**: `@doclocalizer/core` (pdfjs-dist based, runs in renderer)
- **Settings**: JSON file stored in `app.getPath('userData')` via Electron IPC

## Apps

### Desktop App (`apps/desktop`)
The main Electron desktop application for document localization.

### Landing Page (`apps/landing`)
Marketing landing page at http://localhost:1421 with:
- Hero section with animated transformation demo
- Features section (5 cards: Private, AI-Powered, You Control, PDF & Markdown, Open Source)
- Interactive StepViewer with scroll-driven navigation and app screenshots
- SetupGuide with horizontal tabs for Ollama, LM Studio, and llama.cpp
- Floating Navigation sidebar with hover-expand labels

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
- Source documents (Uploaded) stored in: `~/Library/Application Support/document-localizer/uploaded.json`
- Active tasks stored in: `~/Library/Application Support/document-localizer/tasks.json`
- Processed outputs stored in: `~/Library/Application Support/document-localizer/processed.json`
- MAX_HISTORY_ITEMS: 100

### Three-Tab Architecture (Desktop)

The app uses three separate lists to track documents:

1. **Uploaded (Source Library)**: Permanent inventory of uploaded source files. These never change - user sets locale and clicks Process to create a new output.

2. **Tasks (Active Processing)**: Shows items currently being processed (parsing, localizing, paused) or awaiting review (review status). When processing completes, item moves here for user review.

3. **Processed (Completed Outputs)**: Shows approved/rejected/exported/error outputs. User can export approved items or retry errors.

### Processing Flow

1. User uploads files via native file dialog (PDF or .md) → files added to Uploaded tab
2. User selects source/target locales for each file
3. User clicks "Process" → creates NEW output entry in Tasks tab
4. For PDF: Base64 encoded data sent to frontend → `pdfjs-dist` parses in renderer
5. For .md: Files read directly via IPC
6. Frontend splits markdown into chunks
7. Each chunk sent to AI for localization (via `ai:generate` IPC)
8. Results combined and shown in diff view (accessible via "Review" button)
9. User approves/rejects → moves to Processed tab
10. User can export approved items, or retry errored items

## Running the Apps

```bash
# Development - Desktop
cd apps/desktop && pnpm dev

# Development - Landing Page
cd apps/landing && pnpm dev

# Production build - Landing Page
cd apps/landing && pnpm build
```

## File Naming Conventions

- TypeScript files: PascalCase for React components, camelCase for utilities
- Electron files: camelCase
- Settings keys: camelCase
- Landing page components: PascalCase (Hero.tsx, Features.tsx, etc.)

## Configuration Defaults (Desktop)

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
- Desktop Vite dev server runs on port 1420
- Landing Vite dev server runs on port 1421
