# Railway.app Deployment Guide

Complete guide for deploying the Netherlands Job Board to Railway.app.

## Why Railway?

- ✅ Simple deployment from GitHub
- ✅ Automatic HTTPS and custom domains
- ✅ Built-in PostgreSQL (though we use Supabase)
- ✅ Excellent Next.js support
- ✅ Pay-as-you-go pricing ($5/month minimum)
- ✅ Great developer experience
- ✅ Environment variable management
- ✅ Easy rollbacks and previews

## Prerequisites

- [ ] GitHub account with your repository
- [ ] Railway.app account (sign up at [railway.app](https://railway.app))
- [ ] Supabase project configured
- [ ] Apify account with API token

## Deployment Steps

### 1. Sign Up for Railway

1. Go to [railway.app](https://railway.app)
2. Click "Login" and sign in with GitHub
3. Authorize Railway to access your repositories

### 2. Create New Project

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `netherlands-job-board` repository
4. Railway will automatically detect it's a Next.js app

### 3. Configure Environment Variables

In Railway dashboard, go to your project → Variables tab and add:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Apify Configuration
APIFY_API_TOKEN=apify_api_xxxxxxxxxxxxx

# Cron Job Secret
CRON_SECRET=your-random-secret-string-here

# Application URL (will be provided by Railway)
NEXT_PUBLIC_APP_URL=${{RAILWAY_PUBLIC_DOMAIN}}

# Node Environment
NODE_ENV=production
```

**Note**: Railway provides `${{RAILWAY_PUBLIC_DOMAIN}}` variable automatically.

### 4. Deploy

1. Click "Deploy"
2. Railway will:
   - Install dependencies
   - Build your Next.js app
   - Start the production server
3. Wait for deployment to complete (~2-3 minutes)

### 5. Get Your Domain

Railway automatically provides a domain like:
```
https://netherlands-job-board-production.up.railway.app
```

You can also add a custom domain:
1. Go to Settings → Domains
2. Click "Generate Domain" or "Custom Domain"
3. Follow the instructions for DNS configuration

## Setting Up Cron Jobs

Railway doesn't have built-in cron jobs like Vercel. Here are your options:

### Option 1: External Cron Service (Recommended)

Use a free service like **cron-job.org**, **EasyCron**, or **GitHub Actions**:

#### Using cron-job.org (Free)

1. Go to [cron-job.org](https://cron-job.org)
2. Sign up for free account
3. Create new cron job:
   - **Title**: Daily Job Sync
   - **URL**: `https://your-app.railway.app/api/cron/daily-sync`
   - **Schedule**: `0 5 * * *` (5am daily)
   - **Request method**: GET
   - **Authentication**: Add header:
     - Name: `Authorization`
     - Value: `Bearer your-cron-secret`
4. Save and enable

Repeat for monthly cleanup if needed.

#### Using GitHub Actions (Free for public repos)

Create `.github/workflows/cron-jobs.yml`:

```yaml
name: Daily Job Sync

on:
  schedule:
    # Run at 5:00 AM UTC every day
    - cron: '0 5 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Call daily sync endpoint
        run: |
          curl -X GET \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://your-app.railway.app/api/cron/daily-sync

      - name: Check response
        run: echo "Sync completed"
```

Add `CRON_SECRET` to your GitHub repository secrets.

### Option 2: Railway Cron Service (Paid Add-on)

Railway offers a cron service add-on:

1. Go to your project
2. Click "New" → "Cron"
3. Configure schedule and command
4. Uses Railway's cron pricing

### Option 3: Self-hosted Scheduler

Run a separate service that calls your endpoints:

```typescript
// cron-scheduler/index.ts
import cron from 'node-cron';

const CRON_SECRET = process.env.CRON_SECRET;
const APP_URL = process.env.APP_URL;

// Daily at 5am
cron.schedule('0 5 * * *', async () => {
  console.log('Running daily job sync...');
  
  const response = await fetch(`${APP_URL}/api/cron/daily-sync`, {
    headers: {
      'Authorization': `Bearer ${CRON_SECRET}`
    }
  });
  
  console.log('Status:', response.status);
});

console.log('Cron scheduler started');
```

Deploy this as a separate Railway service (Worker, not Web).

## Database Setup

Since we're using Supabase (external), no Railway database needed:

1. ✅ Already configured via environment variables
2. ✅ Supabase provides PostgreSQL hosting
3. ✅ No additional Railway costs for database

## Monitoring & Logs

### View Logs

1. Go to your Railway project
2. Click on your service
3. Click "Deployments" tab
4. View real-time logs

### Monitoring

Railway provides:
- CPU usage
- Memory usage
- Network traffic
- Build and deploy logs

### Custom Monitoring

Add services like:
- **Sentry** for error tracking
- **LogTail** for log aggregation
- **Better Stack** (formerly Logtail) for monitoring

## Costs on Railway

Railway pricing (as of 2024):

### Hobby Plan (Developer)
- $5/month minimum usage
- $0.000231/GB-hour for memory
- $0.000463/vCPU-hour for CPU
- $0.10/GB for network egress

### Estimated Monthly Cost for This App

**Low Traffic** (~1000 users/month):
```
Compute: ~$8-12/month
Network: ~$2-3/month
Total: ~$10-15/month
```

**Medium Traffic** (~10,000 users/month):
```
Compute: ~$15-20/month
Network: ~$5-8/month
Total: ~$20-28/month
```

**Plus Apify costs**: $200/month (daily job updates)

**Total Budget**: ~$210-230/month

## Custom Domain Setup

### Add Custom Domain

1. In Railway dashboard, go to Settings → Domains
2. Click "Custom Domain"
3. Enter your domain: `jobs.yoursite.com`
4. Add CNAME record to your DNS:
   ```
   CNAME jobs yourapp.up.railway.app
   ```
5. Wait for DNS propagation (5-30 minutes)
6. Railway automatically provisions SSL certificate

### Update Environment Variable

```env
NEXT_PUBLIC_APP_URL=https://jobs.yoursite.com
```

## Scaling

Railway auto-scales based on demand:

### Vertical Scaling
- Memory and CPU automatically adjust
- You pay for what you use

### Horizontal Scaling
Railway supports:
1. Go to Settings → Scaling
2. Configure replica count
3. Enable auto-scaling

For this app:
- **Start**: 1 instance (sufficient for 10k users)
- **Scale to**: 2-3 instances if needed

## CI/CD Pipeline

Railway automatically:
1. ✅ Detects Git pushes
2. ✅ Builds your app
3. ✅ Runs tests (if configured)
4. ✅ Deploys on success
5. ✅ Provides preview deployments for PRs

### Configure Build Command

If you need custom build steps:

1. Go to Settings → Build
2. Set custom build command:
   ```bash
   npm run build
   ```
3. Set start command:
   ```bash
   npm run start
   ```

## Environment-Specific Deployments

### Production
- Automatically deploys from `main` branch
- Uses production environment variables

### Staging (Optional)
1. Create new Railway project for staging
2. Deploy from `develop` branch
3. Use separate Supabase database for testing

## Rollback

If deployment fails:

1. Go to Deployments tab
2. Find previous successful deployment
3. Click "Redeploy"
4. Instant rollback!

## Health Checks

Create a health check endpoint:

```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
  });
}
```

Use this for monitoring services.

## Troubleshooting

### Build Failures

**Problem**: Build fails with memory error
**Solution**: Increase memory in Settings → Resources

**Problem**: Dependencies fail to install
**Solution**: Clear build cache in Settings → Build

### Runtime Issues

**Problem**: App crashes on startup
**Solution**: Check logs for error messages

**Problem**: Database connection fails
**Solution**: Verify Supabase environment variables

### Performance Issues

**Problem**: Slow response times
**Solution**: 
1. Enable caching
2. Optimize database queries
3. Scale to multiple instances

## Useful Railway CLI Commands

Install Railway CLI:
```bash
npm install -g @railway/cli
```

### Common Commands

```bash
# Login
railway login

# Link to project
railway link

# View logs
railway logs

# Open dashboard
railway open

# Run locally with Railway env vars
railway run npm run dev

# Deploy manually
railway up

# View environment variables
railway variables
```

## Security Best Practices

### 1. Environment Variables
- ✅ Never commit secrets to Git
- ✅ Use Railway's variable management
- ✅ Rotate CRON_SECRET regularly

### 2. API Endpoints
- ✅ Always verify CRON_SECRET in cron endpoints
- ✅ Use HTTPS only (Railway provides this)
- ✅ Rate limit API endpoints

### 3. Database
- ✅ Use Supabase RLS policies
- ✅ Never expose database credentials
- ✅ Regular backups via Supabase

## Comparison: Railway vs Vercel

| Feature | Railway | Vercel |
|---------|---------|--------|
| **Next.js Support** | ✅ Excellent | ✅ Excellent |
| **Pricing Model** | Pay-as-you-go | Free tier + usage |
| **Built-in Cron** | ❌ (use external) | ✅ Native support |
| **PostgreSQL** | ✅ Built-in option | ❌ Not included |
| **Docker Support** | ✅ Full support | ⚠️ Limited |
| **WebSockets** | ✅ Full support | ⚠️ Limited |
| **Monorepo** | ✅ Good support | ✅ Excellent |
| **Custom Domains** | ✅ Free | ✅ Free |
| **SSL Certificates** | ✅ Automatic | ✅ Automatic |
| **Edge Functions** | ❌ | ✅ Yes |
| **CLI Quality** | ✅ Good | ✅ Excellent |

## Migration from Vercel

If you started with Vercel:

1. ✅ Code works identically (it's just Next.js)
2. ⚠️ Replace Vercel Cron with external cron service
3. ⚠️ Remove `vercel.json` (not needed)
4. ✅ Environment variables transfer directly
5. ✅ Custom domains can be re-pointed

## Support Resources

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Railway Discord**: [discord.gg/railway](https://discord.gg/railway)
- **Railway Status**: [status.railway.app](https://status.railway.app)
- **Railway Blog**: [blog.railway.app](https://blog.railway.app)

## Quick Start Checklist

- [ ] Sign up for Railway.app
- [ ] Connect GitHub repository
- [ ] Add environment variables
- [ ] Deploy application
- [ ] Get custom domain (optional)
- [ ] Set up external cron jobs
- [ ] Test daily sync endpoint
- [ ] Monitor logs and metrics
- [ ] Set up error tracking (Sentry)
- [ ] Configure backups

---

**You're ready to deploy on Railway!** 🚂

The app will be live in minutes, and you'll have a robust, scalable infrastructure for your Netherlands Job Board.

