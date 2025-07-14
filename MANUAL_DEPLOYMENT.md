# Manual GitHub Pages Deployment

Since GitHub CLI isn't available, here's how to deploy manually:

## Step 1: Create GitHub Repository

1. Go to [GitHub.com](https://github.com)
2. Click the "+" icon → "New repository"
3. Name it: `scrub-shop-road-app`
4. Make it **Public** (required for GitHub Pages)
5. **Don't** initialize with README, .gitignore, or license
6. Click "Create repository"

## Step 2: Update Homepage URL

Edit `web/package.json` and replace the placeholder:
```json
"homepage": "https://YOUR_GITHUB_USERNAME.github.io/scrub-shop-road-app"
```

## Step 3: Run Deployment Script

After creating the repository, run:
```powershell
.\deploy.ps1 -GitHubUsername "YOUR_GITHUB_USERNAME" -RepositoryName "scrub-shop-road-app"
```

## Step 4: Configure GitHub Pages

1. Go to your repository on GitHub
2. **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. The deployment will start automatically

## Alternative: Manual Git Commands

If you prefer manual commands:

```powershell
# Update homepage URL in package.json first, then:

git add .
git commit -m "Update homepage URL for deployment"
git remote add origin https://github.com/YOUR_USERNAME/scrub-shop-road-app.git
git push -u origin master
```

## Your App URL

Once deployed, your app will be available at:
`https://YOUR_GITHUB_USERNAME.github.io/scrub-shop-road-app`

## Environment Variables

If your app uses Google Sheets API, add these secrets in GitHub:
1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add:
   - `VITE_GOOGLE_SHEETS_API_KEY`
   - `VITE_GOOGLE_SHEETS_CLIENT_ID`
   - `VITE_GOOGLE_SHEETS_CLIENT_SECRET`
   - `VITE_SPREADSHEET_ID` 