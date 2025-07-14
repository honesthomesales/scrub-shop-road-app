# Quick Deployment Checklist

## ✅ What's Been Set Up

1. **Package.json Updated**
   - Added `homepage` field (needs your GitHub username)
   - Added `deploy` script
   - Added `gh-pages` dependency

2. **Vite Config Updated**
   - Added base path for GitHub Pages
   - Configured for production builds

3. **GitHub Actions Workflow Created**
   - Automatic deployment on push to main/master
   - Environment variables configured
   - Build and deploy process automated

## 🚀 Next Steps (You Need to Do)

### 1. Update Homepage URL
Edit `web/package.json` and replace the placeholder:
```json
"homepage": "https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPO_NAME"
```

### 2. Push to GitHub
```bash
git add .
git commit -m "Setup GitHub Pages deployment"
git push origin main
```

### 3. Configure GitHub Repository
1. Go to your GitHub repository
2. **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**

### 4. Add Environment Variables (If Needed)
If your app uses Google Sheets API or other services:
1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add these secrets:
   - `VITE_GOOGLE_SHEETS_API_KEY`
   - `VITE_GOOGLE_SHEETS_CLIENT_ID`
   - `VITE_GOOGLE_SHEETS_CLIENT_SECRET`
   - `VITE_SPREADSHEET_ID`

### 5. Monitor Deployment
1. Go to **Actions** tab in your repository
2. Watch the deployment workflow run
3. Your app will be available at: `https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPO_NAME`

## 🔧 Manual Deployment (Alternative)
If you prefer manual deployment:
```bash
cd web
npm run deploy
```

## 📝 Notes
- The app is configured to work with React Router and Vite
- All static assets will be properly served
- The build process is optimized for production
- Environment variables are handled securely through GitHub Secrets

## 🆘 Troubleshooting
- Check the **Actions** tab for build errors
- Ensure all environment variables are set if your app requires them
- Verify the repository name matches the base path in `vite.config.js` 