# Document Localizer

A monorepo for document localization using AI.

## Architecture

```
├── apps/
│   └── web/          # React web app (Vite)
├── packages/
│   └── core/         # Shared business logic
└── workspace/        # User files (future)
```

## Packages

### @doclocalizer/core
Core business logic for document localization:
- PDF to Markdown conversion
- Text chunking for LLM processing
- Ollama client for local LLM inference
- Diff generation for review

### @doclocalizer/web
React web app for:
- Drag & drop PDF upload
- Document list management
- Diff review interface
- Export workflow

## Scripts

```bash
pnpm install          # Install dependencies
pnpm dev              # Start web app
pnpm build            # Build core package
```

## Development

```bash
# Start web app
cd apps/web && pnpm dev

# Build core
cd packages/core && pnpm build
```
