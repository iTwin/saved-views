# Run pnpm audit at high severity level for the saved-views monorepo
# Usage: .\run-audit.ps1
# Run from the repository root or anywhere — this script resolves the repo root automatically.

$repoRoot = "e:\saved-views_1\saved-views"

Write-Host "Running pnpm audit --audit-level high in $repoRoot ..." -ForegroundColor Cyan

$result = cmd /c "cd /d `"$repoRoot`" && pnpm audit --audit-level high 2>&1"

Write-Output $result

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nNo high or critical vulnerabilities found." -ForegroundColor Green
} else {
    Write-Host "`nVulnerabilities detected. Review the output above and follow the fix workflow in SKILL.md." -ForegroundColor Yellow
}
