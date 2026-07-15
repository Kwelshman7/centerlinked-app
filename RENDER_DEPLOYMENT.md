# Render Deployment Guide for CenterLinked

Your code has been pushed to GitHub and is ready to deploy on Render!

## Quick Deploy

Click this button to deploy automatically:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Kwelshman7/centerlinked-app)

Or use the manual steps below.

## Manual Deployment Steps

### 1. Connect Your Repository

1. Go to [render.com](https://render.com) and log in
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account if you haven't already
4. Select the `Kwelshman7/centerlinked-app` repository

### 2. Configure the Service

Render will automatically detect the `render.yaml` Blueprint file. Review the configuration:

- **Name**: centerlinked
- **Runtime**: Node
- **Build Command**: `npm ci && npm run build`
- **Start Command**: `node server/app.mjs`
- **Plan**: Free

### 3. Set Environment Variables

You **must** configure these environment variables in the Render Dashboard:

#### Required Variables:

- `VITE_SUPABASE_URL` - Your Supabase project URL (e.g., `https://your-project-ref.supabase.co`)
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SITE_URL` - Your production URL (will be `https://centerlinked.onrender.com` initially, or your custom domain)

To add these:
1. Go to your service's **Environment** tab in the Render Dashboard
2. Add each variable with its value
3. Click **Save Changes**

#### Optional Variables (for admin features):

- `SUPABASE_SERVICE_ROLE` - Service role key (for facility image pipeline)
- `OPENAI_API_KEY` - OpenAI API key (for facility image verification)

### 4. Deploy

Once the environment variables are set, Render will automatically deploy your application.

The deployment process will:
1. Install dependencies with `npm ci`
2. Build the Vite application with `npm run build`
3. Start the Express server on port 10000
4. Make your app available at `https://centerlinked.onrender.com`

### 5. Configure Supabase Redirect URLs

After deployment, update your Supabase authentication settings:

1. Go to your Supabase project → **Authentication** → **URL Configuration**
2. Add these redirect URLs:
   - `https://centerlinked.onrender.com/auth/callback`
   - Any custom domain URLs you plan to use

## What Was Deployed

This deployment includes:

1. **Express Server** (`server/app.mjs`) - Serves the static React app and handles:
   - Static file serving from the `dist` folder
   - OG meta tag generation for social media previews (`/api/og`)
   - SPA routing fallback

2. **Vite React App** - Your full frontend application built and optimized for production

3. **Social Media Preview Bot Detection** - Automatically serves enhanced HTML with proper meta tags for social media previews

## Custom Domain Setup

To use a custom domain:

1. Go to your service's **Settings** tab
2. Click **"Add Custom Domain"**
3. Follow the instructions to configure your DNS records
4. Update the `SITE_URL` environment variable to match your custom domain

## Monitoring

- **Logs**: View real-time logs in the Render Dashboard under the **Logs** tab
- **Metrics**: Monitor performance under the **Metrics** tab
- **Events**: Track deployments and service events in the **Events** tab

## Troubleshooting

### Build fails
- Check that all dependencies are listed in `package.json`
- Review build logs for specific error messages

### App won't start
- Verify all required environment variables are set
- Check that the Express server is binding to `0.0.0.0:$PORT`
- Review application logs for startup errors

### Authentication issues
- Verify Supabase redirect URLs are configured correctly
- Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set correctly

## Automatic Deployments

Render will automatically deploy when you push to the `main` branch on GitHub. To disable this:

1. Go to your service's **Settings** tab
2. Find **"Auto-Deploy"**
3. Toggle it off

## Support

- Render Documentation: https://render.com/docs
- Render Community: https://community.render.com
