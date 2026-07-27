# ManuscriptReady

An AI-powered journal submission readiness checker for medical students and researchers.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec

## AI Provider Configuration

The AI backend is fully modular — swap providers with environment variables, no code changes needed.

| Variable | Description | Default |
|---|---|---|
| `AI_PROVIDER` | `openai-compatible` or `anthropic` | `openai-compatible` |
| `AI_API_KEY` | API key for the chosen provider | *(required)* |
| `AI_BASE_URL` | Base URL for OpenAI-compatible endpoints | OpenAI default |
| `AI_MODEL` | Model name | `llama-3.3-70b-versatile` |

### Free provider quick-start (Groq)

1. Sign up at https://console.groq.com (free, no credit card required)
2. Create an API key
3. Set these secrets/env vars:
   - `AI_API_KEY` = your Groq key
   - `AI_BASE_URL` = `https://api.groq.com/openai/v1`
   - `AI_MODEL` = `llama-3.3-70b-versatile`

### Other free/compatible providers

- **OpenRouter** (free models): `AI_BASE_URL=https://openrouter.ai/api/v1`, `AI_MODEL=meta-llama/llama-3.1-8b-instruct:free`
- **Ollama** (local): `AI_BASE_URL=http://localhost:11434/v1`, `AI_API_KEY=ollama`, `AI_MODEL=llama3.2`
- **Anthropic**: `AI_PROVIDER=anthropic`, `AI_API_KEY=<key>`, `AI_MODEL=claude-sonnet-4-6`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
