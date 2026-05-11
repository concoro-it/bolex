# Bolex

Open-source AI legal workspace for Turkish legal workflows.

Bolex is based on Mike by Will Chen and is licensed under AGPL-3.0-only.

## Contents

- `frontend/` - Next.js application
- `backend/` - Express API, Supabase access, document processing, and migrations
- `backend/migrations/000_one_shot_schema.sql` - one-shot Supabase schema for fresh databases

## Setup

Install dependencies:

```bash
npm install --prefix backend
npm install --prefix frontend
```

Create local env files with the required Supabase, storage, model provider, and API URL values.

For Turkish legal research MCP routing, the backend defaults to the public endpoints but can be overridden with:

```bash
MCP_SERVER_URL=https://yargimcp.surucu.dev/mcp
MEVZUAT_MCP_SERVER_URL=https://mevzuat.surucu.dev/mcp
```

Run `backend/migrations/000_one_shot_schema.sql` in the Supabase SQL editor for a fresh database.

Start the backend:

```bash
npm run dev --prefix backend
```

Start the frontend:

```bash
npm run dev --prefix frontend
```

Open `http://localhost:3000`.

## Required Services

- Supabase Auth and Postgres
- S3-compatible object storage, such as Cloudflare R2
- At least one supported model provider key, depending on which models you enable
- LibreOffice for DOC/DOCX to PDF conversion

## Checks

```bash
npm run build --prefix backend
npm run build --prefix frontend
npm run lint --prefix frontend
```

## License

AGPL-3.0-only. See `LICENSE`.
