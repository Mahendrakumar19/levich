# Deployment Guide

## 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Live auction platform"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/live-auction.git
git push -u origin main
```

## 2. Deploy Backend to Render

1. Go to [render.com](https://render.com) and sign in
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. Render will auto-detect `render.yaml`
5. Click "Apply" to deploy
6. Copy your backend URL (e.g., `https://live-auction-server.onrender.com`)

## 3. Deploy Frontend to Vercel

1. Update `client/.env.production` with your Render backend URL:
   ```
   VITE_SERVER_URL=https://live-auction-server.onrender.com
   ```
2. Commit this change:
   ```bash
   git add client/.env.production
   git commit -m "Add production backend URL"
   git push
   ```
3. Go to [vercel.com](https://vercel.com) and sign in
4. Click "New Project"
5. Import your GitHub repo
6. Vercel will auto-detect settings from `vercel.json`
7. Click "Deploy"

## 4. Test

Open your Vercel URL in two browser windows and test simultaneous bidding!

## Environment Variables (if needed)

**Render (Backend):**
- `PORT` - auto-set by Render (usually 10000)
- `NODE_ENV` - set to `production`

**Vercel (Frontend):**
- `VITE_SERVER_URL` - set in `.env.production` or Vercel dashboard

## Notes

- Free tier Render services sleep after inactivity - first request may take 30s
- Update CORS in `server/index.js` if needed for your Vercel domain
