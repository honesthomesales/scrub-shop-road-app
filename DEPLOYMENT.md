# GitHub Pages Deployment Guide

This guide will help you deploy the Scrub Shop Road App to GitHub Pages.

## Prerequisites

1. Make sure your project is pushed to a GitHub repository
2. Ensure you have the necessary permissions to enable GitHub Pages

## Setup Steps

### 1. Update Repository Settings

1. Go to your GitHub repository
2. Navigate to **Settings** > **Pages**
3. Under **Source**, select **GitHub Actions**
4. This will allow the workflow to automatically deploy your app

### 2. Update Homepage URL

Before deploying, update the homepage URL in `web/package.json`:

```json
"homepage": "https://[your-github-username].github.io/[your-repo-name]"
```

Replace `[your-github-username]` with your actual GitHub username and `[your-repo-name]` with your repository name.

### 3. Environment Variables

If your app uses environment variables (like Supabase configuration), you'll need to add them to your GitHub repository:

1. Go to **Settings** > **Secrets and variables** > **Actions**
2. Add your environment variables as repository secrets
3. Update the GitHub Actions workflow to use these secrets

### 4. Deploy

#### Option A: Automatic Deployment (Recommended)
The GitHub Actions workflow will automatically deploy your app when you push to the main branch.

#### Option B: Manual Deployment
If you prefer manual deployment:

```bash
cd web
npm run deploy
```

## Accessing Your App

Once deployed, your app will be available at:
`https://[your-github-username].github.io/[your-repo-name]`

## Troubleshooting

### Common Issues

1. **404 Errors**: Make sure the base path in `vite.config.js` matches your repository name
2. **Build Failures**: Check the GitHub Actions logs for build errors
3. **Environment Variables**: Ensure all required environment variables are set in GitHub Secrets

### Checking Deployment Status

1. Go to your repository on GitHub
2. Click on the **Actions** tab
3. Check the status of the latest workflow run

## Custom Domain (Optional)

If you have a custom domain:

1. Add your domain to the `cname` field in the GitHub Actions workflow
2. Configure your DNS settings to point to your GitHub Pages URL
3. Enable HTTPS in your repository settings

## Support

For more information about GitHub Pages deployment, visit:
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html) 