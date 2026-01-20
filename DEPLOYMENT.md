# Deployment Guide for DigitalOcean App Platform

This guide will help you deploy the AluQuote AI frontend to DigitalOcean App Platform.

## Prerequisites

1. A DigitalOcean account (if you don't have one, sign up at [digitalocean.com](https://www.digitalocean.com))
2. Your code pushed to a GitHub repository
3. Your backend API URL (if applicable)

## Deployment Steps

### Step 1: Push Your Code to GitHub

Make sure your code is pushed to a GitHub repository:

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 2: Create App in DigitalOcean App Platform

1. Log in to your DigitalOcean account
2. Navigate to **Apps** in the left sidebar
3. Click **Create App**
4. Select **GitHub** as your source
5. Authenticate with GitHub if prompted
6. Select your repository and branch (usually `main`)
7. DigitalOcean will auto-detect it's a static site

### Step 3: Configure Build Settings

In the App Platform interface:

1. **Build Command**: `npm ci && npm run build`
   - Or if using pnpm: `pnpm install && pnpm run build`

2. **Output Directory**: `dist`
   - This is where Vite outputs the built files

3. **Run Command**: Leave empty (static sites don't need a run command)

### Step 4: Configure Environment Variables

If your app needs environment variables (like `VITE_API_URL`):

1. In the App Platform interface, go to **Settings** → **App-Level Environment Variables**
2. Add any environment variables your app needs:
   - `VITE_API_URL`: Your backend API URL (if applicable)
   - Prefix variables with `VITE_` for them to be accessible in your React app

### Step 5: Deploy

1. Review your configuration
2. Click **Create Resources** or **Deploy**
3. Wait for the deployment to complete (usually 2-5 minutes)

### Step 6: Access Your App

Once deployed, DigitalOcean will provide you with a URL like:
`https://your-app-name.ondigitalocean.app`

## Configuration File

The `.do/app.yaml` file in this repository contains the App Platform specification. You can:

1. Use it directly if deploying via CLI (see below)
2. Reference it when configuring manually in the web interface

## Alternative: Deploy via CLI

If you prefer using the command line:

1. Install the DigitalOcean CLI (`doctl`):
   ```bash
   brew install doctl  # macOS
   # or visit: https://docs.digitalocean.com/reference/doctl/how-to/install/
   ```

2. Authenticate:
   ```bash
   doctl auth init
   ```

3. Deploy:
   ```bash
   doctl apps create --spec .do/app.yaml
   ```

## Important Notes

- **Free Tier**: DigitalOcean App Platform offers a free tier with limited resources
- **Custom Domain**: You can add a custom domain in the App Platform settings
- **Environment Variables**: Remember to set production environment variables in the App Platform interface
- **Build Time**: The first deployment may take a few minutes
- **Auto-Deploy**: By default, App Platform will auto-deploy on every push to your main branch

## Troubleshooting

### Build Fails
- Check that `package.json` has the correct build script
- Verify Node.js version compatibility
- Check build logs in the App Platform dashboard

### Environment Variables Not Working
- Make sure variables are prefixed with `VITE_` for Vite apps
- Variables are injected at build time, not runtime
- Restart the app after adding new environment variables

### API Calls Not Working
- Verify your `VITE_API_URL` is set correctly
- Check CORS settings on your backend API
- Ensure the API URL is accessible from the internet

## Cost Estimation

- Static sites on App Platform are typically free for basic usage
- Additional resources (domains, databases, etc.) may incur costs
- Check DigitalOcean pricing for current rates
