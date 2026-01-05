# Quick Start Guide

Get your Netherlands Job Board up and running in 15 minutes!

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Supabase account created
- [ ] Apify account created
- [ ] Git installed

## Step-by-Step Setup

### 1. Install Dependencies (2 min)

```bash
cd netherlands-job-board
npm install
```

### 2. Set Up Supabase Database (5 min)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for project to finish provisioning
3. Navigate to **SQL Editor** in left sidebar
4. Copy the entire contents of `DATABASE_SCHEMA.sql`
5. Paste into SQL Editor and click **Run**
6. Go to **Settings** > **API** and copy:
   - Project URL
   - `anon` `public` key

### 3. Configure Apify (3 min)

1. Go to [apify.com](https://apify.com) and create account
2. Navigate to **Settings** > **Integrations**
3. Copy your API token
4. Subscribe to these actors (you can start with free tier to test):
   - [Career Site Job Listing API](https://apify.com/fantastic-jobs/career-site-job-listing-api)
   - [Career Site Job Listing Feed](https://apify.com/fantastic-jobs/career-site-job-listing-feed)

### 4. Configure Environment Variables (2 min)

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
APIFY_API_TOKEN=apify_api_xxxxxxxxxxxxx
CRON_SECRET=any-random-string-you-want
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run Development Server (1 min)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

You should see the job board interface!

### 6. (Optional) Add Sample Data (2 min)

To test without running Apify jobs, add sample data in Supabase:

1. Go to Supabase **Table Editor**
2. Select `jobs` table
3. Click **Insert** > **Insert row**
4. Fill in:
   - external_id: `test-1`
   - title: `Software Engineer`
   - organization: `Test Company`
   - url: `https://example.com`
   - description_html: `<p>Great opportunity!</p>`
   - location: `Amsterdam`
   - source: `feed`
   - status: `active`

Refresh your local site - you should see the job!

## Next Steps

### Production Deployment

1. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/yourusername/netherlands-job-board.git
   git push -u origin main
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click **New Project**
   - Import your GitHub repo
   - Add all environment variables from `.env.local`
   - Click **Deploy**

3. **Run Initial Population**:
   - See `IMPLEMENTATION_GUIDE.md` for the initial population script
   - This will load all current jobs from Apify Feed (~$30 one-time cost)

4. **Set Up Cron Jobs**:
   - Vercel automatically reads `vercel.json` for cron configuration
   - Daily sync will run at 5am automatically

### Budget Planning

- **Month 1**: $230 (includes $30 initial population)
- **Month 2+**: $200/month (daily updates)

### Monitoring

Check these regularly:
- Vercel > Functions > Crons (see execution logs)
- Supabase > Table Editor > `apify_usage_logs` (track costs)
- Apify > Runs (see actor executions)

## Troubleshooting

### "Missing Supabase environment variables"
- Check `.env.local` exists
- Verify variables are correctly copied
- Restart dev server: `Ctrl+C` then `npm run dev`

### Jobs not showing
- Add sample data manually first (see step 6)
- Check browser console for errors (F12)
- Verify Supabase connection in Network tab

### Build errors
```bash
rm -rf .next node_modules package-lock.json
npm install
npm run dev
```

## Support

- 📖 Full docs: `README.md`
- 🚀 Implementation details: `IMPLEMENTATION_GUIDE.md`
- 💾 Database schema: `DATABASE_SCHEMA.sql`

Need help? Check the issues on GitHub or create a new one!

---

**You're all set!** 🎉

Start customizing the design, add more filters, or integrate the Apify automation!

