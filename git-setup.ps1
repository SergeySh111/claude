# Git setup script for Campaign Analyzer (PowerShell)

Write-Host "Initializing Git repository..." -ForegroundColor Cyan

# Initialize Git if not already initialized
if (-not (Test-Path .git)) {
    git init
    Write-Host "✓ Git repository initialized" -ForegroundColor Green
} else {
    Write-Host "✓ Git repository already exists" -ForegroundColor Green
}

# Check if remote exists
try {
    $remoteUrl = git remote get-url origin 2>$null
    Write-Host "✓ Remote 'origin' already configured: $remoteUrl" -ForegroundColor Green
    git remote -v
} catch {
    Write-Host "⚠ No remote configured. After creating GitHub repo, run:" -ForegroundColor Yellow
    Write-Host "  git remote add origin https://github.com/your-username/campaign-analyzer.git" -ForegroundColor Yellow
}

# Add all files
Write-Host "`nAdding files to staging..." -ForegroundColor Cyan
git add .

# Check status
Write-Host "`nFiles to be committed:" -ForegroundColor Cyan
git status --short

# Create initial commit
Write-Host ""
$response = Read-Host "Create initial commit? (y/n)"
if ($response -eq 'y' -or $response -eq 'Y') {
    git commit -m "feat: Backend AI integration with OpenAI API

- Add POST /api/ai/analyze endpoint with Zod validation
- Implement server-side OpenAI integration
- Add week hallucination filtering
- Add rate limiting (30 req/min per IP)
- Update frontend to use new backend API
- Remove client-side API key dependency
- Add deployment documentation"
    Write-Host "✓ Commit created" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Create GitHub repository at https://github.com/new"
    Write-Host "2. Run: git remote add origin https://github.com/your-username/campaign-analyzer.git"
    Write-Host "3. Run: git push -u origin main"
} else {
    Write-Host "Commit skipped. Run 'git commit' manually when ready." -ForegroundColor Yellow
}
