# Create google-play-iap-mcp repo on GitHub and push
# Requires: GITHUB_TOKEN env var (Settings > Developer settings > Personal access tokens)
# Or run: gh auth login (then use gh repo create)

$repo = "google-play-iap-mcp"
$user = "lytworkshift"

if ($env:GITHUB_TOKEN) {
    Write-Host "Creating repo via API..."
    $body = @{ name = $repo; private = $true } | ConvertTo-Json
    $headers = @{
        Authorization = "token $env:GITHUB_TOKEN"
        "Content-Type" = "application/json"
    }
    try {
        Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Method Post -Body $body -Headers $headers
        Write-Host "Repo created."
    } catch {
        if ($_.Exception.Response.StatusCode -eq 422) { Write-Host "Repo may already exist." }
        else { throw }
    }
} elseif (Get-Command gh -ErrorAction SilentlyContinue) {
    Write-Host "Creating repo via gh..."
    gh repo create $repo --private --source=. --push
    exit
} else {
    Write-Host "Create repo manually: https://github.com/new?name=$repo"
    Write-Host "Then run: git push -u origin main"
    exit 1
}

Set-Location $PSScriptRoot
git remote remove origin 2>$null
git remote add origin "https://github.com/$user/$repo.git"
git branch -M main
git push -u origin main
Write-Host "Done: https://github.com/$user/$repo"
