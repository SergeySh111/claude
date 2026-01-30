# Campaign Performance Analyzer

Full-stack campaign analytics dashboard with AI-powered insights.

## Features

- **CSV Upload & Processing**: Upload summary and daily cohort CSV files
- **Campaign Analytics**: ROAS, CPI, CPA metrics with cohort analysis
- **AI-Powered Insights**: Server-side AI analysis using OpenAI GPT-4o-mini
- **Interactive Dashboards**: Charts, tables, and cohort visualizations
- **User Authentication**: OAuth-based authentication with session management

## Tech Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Node.js, Express, tRPC, Drizzle ORM
- **Database**: MySQL (via Drizzle)
- **AI**: OpenAI GPT-4o-mini (server-side)
- **Build**: Vite + esbuild

## Prerequisites

- Node.js 18+ 
- pnpm 10+
- MySQL database (for production)
- OpenAI API key (for AI features)

## Local Development

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Set up environment variables** (create `.env` file):
   ```env
   # Database
   DATABASE_URL=mysql://user:password@localhost:3306/campaign_analyzer

   # OpenAI (required for AI features)
   OPENAI_API_KEY=sk-...

   # OAuth (optional, for authentication)
   OAUTH_SERVER_URL=https://your-oauth-server.com
   OWNER_OPEN_ID=your-openid
   JWT_SECRET=your-secret-key

   # Server
   PORT=3000
   NODE_ENV=development
   ```

3. **Run database migrations** (if using database):
   ```bash
   pnpm db:push
   ```

4. **Start development server**:
   ```bash
   pnpm dev
   ```

   Server runs on `http://localhost:3000`

## Building for Production

```bash
pnpm build
pnpm start
```

## Railway Deployment

### 1. Connect Repository

1. Go to [Railway](https://railway.app)
2. Create new project
3. Connect your GitHub repository

### 2. Configure Environment Variables

In Railway project settings, add these environment variables:

**Required:**
- `OPENAI_API_KEY` - Your OpenAI API key (starts with `sk-`)
- `NODE_ENV=production`

**Optional (for full features):**
- `DATABASE_URL` - MySQL connection string (if using database)
- `PORT` - Server port (Railway auto-assigns, but can override)
- `JWT_SECRET` - Secret for session cookies
- `OAUTH_SERVER_URL` - OAuth server URL (if using auth)
- `OWNER_OPEN_ID` - Owner's OpenID (if using auth)

### 3. Configure Build & Start Commands

Railway will auto-detect from `package.json`:
- **Build**: `pnpm build`
- **Start**: `pnpm start`

If needed, manually set in Railway:
- Build Command: `pnpm install && pnpm build`
- Start Command: `pnpm start`

### 4. Deploy

Railway will automatically deploy on git push to main branch.

### 5. Verify Deployment

1. Check Railway logs for startup messages
2. Visit your Railway-provided URL
3. Test CSV upload and AI features

## Project Structure

```
campaign-analyzer/
├── client/              # React frontend
│   └── src/
│       ├── components/  # UI components
│       ├── lib/        # Utilities & data processing
│       └── pages/      # Page components
├── server/             # Node.js backend
│   ├── _core/         # Core server utilities
│   ├── ai-routes.ts   # AI analysis endpoint
│   └── csv-routes.ts  # CSV processing endpoints
├── shared/            # Shared types & constants
├── drizzle/           # Database schema & migrations
└── backend/           # Python FastAPI (optional/legacy)
```

## API Endpoints

### CSV Processing
- `POST /api/process-summary` - Process campaign summary CSV
- `POST /api/process-daily` - Process daily cohort CSV

### AI Analysis
- `POST /api/ai/analyze` - AI-powered campaign analysis
  - Requires: `CanonicalAnalyticsSnapshot` in request body
  - Returns: `{ ok: true, answerMarkdown: string }` or `{ ok: false, error: string }`

### tRPC
- `/api/trpc/*` - tRPC endpoints for reports, auth, etc.

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key for AI features |
| `DATABASE_URL` | No | MySQL connection string |
| `PORT` | No | Server port (default: 3000) |
| `NODE_ENV` | No | `development` or `production` |
| `JWT_SECRET` | No | Secret for session cookies |
| `OAUTH_SERVER_URL` | No | OAuth server URL |
| `OWNER_OPEN_ID` | No | Owner's OpenID for admin role |

## Troubleshooting

### AI Features Not Working
- Verify `OPENAI_API_KEY` is set in Railway environment variables
- Check server logs for OpenAI API errors
- Ensure API key has credits/quota available

### Database Connection Issues
- Verify `DATABASE_URL` format: `mysql://user:password@host:port/database`
- Check database is accessible from Railway
- Run migrations: `pnpm db:push`

### Build Failures
- Ensure all dependencies are in `package.json`
- Check Node.js version compatibility (18+)
- Review Railway build logs for specific errors

## License

MIT
