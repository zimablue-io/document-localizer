# Document Localizer - Agent Guidelines

## Architecture Rules

> **IMPORTANT: This is a DESKTOP-ONLY application (Tauri + React)**
> - File picker uses `@tauri-apps/plugin-dialog` which requires native Tauri runtime
> - **ALWAYS** use `pnpm dev` to run the app (not Vite directly)
> - Do NOT add web-only fallback or configuration
> - Do NOT create separate web/desktop entry points

## Architecture

```
apps/
└── desktop/                    # Tauri + React desktop app (PRIMARY)
    ├── src/                    # React frontend
    │   ├── App.tsx            # Main app (orchestration only)
    │   ├── components/        # UI components (DiffView, SettingsPanel)
    │   └── stores/            # State management (settings)
    └── src-tauri/             # Rust backend
        ├── src/
        │   ├── lib.rs         # Tauri commands
        │   └── pdf.rs         # PDF parsing (lopdf + rayon)
        └── Cargo.toml         # Rust dependencies

packages/
└── core/                      # Shared business logic
    └── src/
        ├── services/
        │   ├── openai-client.ts   # OpenAI-compatible API client (supports Ollama, LM Studio, etc.)
        │   ├── file-processor.ts   # File processing (PDF/MD with caching)
        │   └── localize.ts
        └── utils/chunk.ts
```

## Key Patterns

### Desktop App (Tauri + React)

- **Frontend**: React + TypeScript with Tailwind CSS (UI orchestration only)
- **Backend**: Rust with lopdf for PDF parsing, rayon for parallelization
- **PDF Processing**: Parallel page extraction via Rust backend
- **Localization**: Chunk-by-chunk processing via OpenAI-compatible API

### Processing Flow

1. User selects files via native file dialog (PDF or .md)
2. For PDF: Rust backend parses PDFs in parallel, converts to markdown, saves .md file
3. For .md: Files read directly (no conversion needed)
4. Frontend splits markdown into chunks with overlap
5. Each chunk is sent to AI for localization
6. Results combined and shown in diff view
7. User approves/rejects before export

### File Caching

- Converted .md files are saved alongside source PDF for future use
- User can re-upload .md files to skip conversion step

### Configuration

- Stored in localStorage (persisted settings)
- API URL: `http://localhost:11434/v1` (OpenAI-compatible)
- Model: `qwen2.5:7b-instruct` (default)
- Chunk size: 1000 chars (default)
- Overlap: 100 chars (default)
- Target locale: `en-GB` (default)

### Supported Locales

- en-GB (British English)
- en-AU (Australian English)
- en-NZ (New Zealand English)
- en-CA (Canadian English)
- en-ZA (South African English)

## Running the App

```bash
# Development
cd apps/desktop && pnpm run dev

# Production build
cd apps/desktop && pnpm run build
```

## File Naming Conventions

- TypeScript files: kebab-case or PascalCase for components
- Rust files: snake_case
- Policies: `en-US-to-en-GB.md`

## Development Notes

- PDF parsing uses `lopdf` with `rayon` for parallel page extraction
- All files processed in parallel for maximum throughput
- Progress updates shown per-page during parsing, per-chunk during localization
- Settings persist in localStorage between sessions
- AI client supports both OpenAI-compatible APIs and Ollama native endpoints
