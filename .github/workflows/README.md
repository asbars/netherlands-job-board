# GitHub Actions Workflows

This directory contains GitHub Actions workflows for automated tasks.

## Setup Instructions

### 1. Add Repository Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

1. **CRON_SECRET**
   - Value: Your random secret string (same as in Railway environment variables)
   - Used to authenticate cron requests

2. **APP_URL**
   - Value: Your Railway app URL (e.g., `https://your-app.railway.app`)
   - Used to call your API endpoints

### 2. Enable GitHub Actions

1. Go to repository → Actions tab
2. Click "I understand my workflows, go ahead and enable them"

### 3. Test Manually

You can test the workflow manually:

1. Go to Actions tab
2. Select "Daily Job Sync Cron"
3. Click "Run workflow"
4. Select branch (main)
5. Click "Run workflow"

## Workflows

### daily-cron.yml

**Purpose**: Automates daily job synchronization

**Schedule**: 
- Daily at 5:00 AM UTC
- Can be triggered manually

**What it does**:
1. Calls `/api/cron/daily-sync` endpoint
2. Fetches new jobs from Apify API
3. Updates expired jobs
4. Logs usage metrics

**Cost**: FREE (GitHub Actions is free for public repos)

## Monitoring

### View Workflow Runs

1. Go to Actions tab
2. Click on "Daily Job Sync Cron"
3. See all past runs with status

### Notifications

GitHub will:
- ✅ Email you if workflow fails
- ✅ Show status badge
- ✅ Keep logs for 90 days

### Status Badge

Add to your README.md:

```markdown
![Daily Cron](https://github.com/yourusername/netherlands-job-board/actions/workflows/daily-cron.yml/badge.svg)
```

## Troubleshooting

### Workflow fails with 401

- Check that `CRON_SECRET` matches between GitHub and Railway
- Verify secret is set correctly in repository settings

### Workflow fails with 404

- Check that `APP_URL` is correct
- Ensure Railway app is deployed and running
- Verify API endpoint exists at `/api/cron/daily-sync`

### Workflow doesn't run

- Check that GitHub Actions is enabled
- Verify cron schedule syntax
- Check if repository has activity (GitHub may pause workflows)

## Alternative: cron-job.org

If you prefer not to use GitHub Actions:

1. Sign up at [cron-job.org](https://cron-job.org)
2. Create new cron job:
   - **URL**: `https://your-app.railway.app/api/cron/daily-sync`
   - **Schedule**: `0 5 * * *`
   - **Request Method**: GET
   - **Headers**: 
     - Name: `Authorization`
     - Value: `Bearer your-cron-secret`
3. Save and enable

## Monthly Cleanup

If you want monthly cleanup (optional):

Add this schedule to `daily-cron.yml`:

```yaml
on:
  schedule:
    - cron: '0 5 * * *'    # Daily
    - cron: '0 3 1 * *'    # Monthly (1st of month)
```

And create the cleanup endpoint.

## Security Notes

- ✅ Secrets are encrypted by GitHub
- ✅ Never log or expose CRON_SECRET
- ✅ Use HTTPS only
- ✅ Verify Authorization header in your API

## Support

For GitHub Actions help:
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Cron syntax reference](https://crontab.guru/)

