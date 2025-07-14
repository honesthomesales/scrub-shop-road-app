# Scrub Shop Road App - GitHub Pages Deployment Script
# Run this script after creating your GitHub repository

param(
    [Parameter(Mandatory=$true)]
    [string]$GitHubUsername,
    
    [Parameter(Mandatory=$true)]
    [string]$RepositoryName
)

Write-Host "🚀 Setting up GitHub Pages deployment..." -ForegroundColor Green

# Update homepage URL in package.json
$packageJsonPath = "web/package.json"
$packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
$packageJson.homepage = "https://$GitHubUsername.github.io/$RepositoryName"
$packageJson | ConvertTo-Json -Depth 10 | Set-Content $packageJsonPath

Write-Host "✅ Updated homepage URL to: $($packageJson.homepage)" -ForegroundColor Green

# Add GitHub remote
$remoteUrl = "https://github.com/$GitHubUsername/$RepositoryName.git"
git remote add origin $remoteUrl

Write-Host "✅ Added GitHub remote: $remoteUrl" -ForegroundColor Green

# Push to GitHub
Write-Host "📤 Pushing to GitHub..." -ForegroundColor Yellow
git push -u origin master

Write-Host "✅ Code pushed to GitHub!" -ForegroundColor Green

Write-Host "`n🎉 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Go to https://github.com/$GitHubUsername/$RepositoryName" -ForegroundColor White
Write-Host "2. Go to Settings > Pages" -ForegroundColor White
Write-Host "3. Under 'Source', select 'GitHub Actions'" -ForegroundColor White
Write-Host "4. Your app will be deployed automatically!" -ForegroundColor White
Write-Host "`n🌐 Your app will be available at: $($packageJson.homepage)" -ForegroundColor Cyan

Write-Host "`n📝 If you need to add environment variables:" -ForegroundColor Yellow
Write-Host "1. Go to Settings > Secrets and variables > Actions" -ForegroundColor White
Write-Host "2. Add your API keys as repository secrets" -ForegroundColor White 