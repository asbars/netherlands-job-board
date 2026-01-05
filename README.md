# Netherlands Job Board

A modern job board web application for expats in the Netherlands, featuring daily updates from verified company career sites via Apify's Career Site Job Listing API.

## 🚀 Features

- **Daily Job Updates** - Fresh jobs from 140k+ company career sites via Apify API
- **Advanced Filtering** - Filter by title, company, location, job type, experience level, remote work
- **Direct Applications** - Jobs come directly from ATS systems (Workday, Greenhouse, Ashby, etc.)
- **Company Enrichment** - LinkedIn company data including size, industry, and location
- **Automated Expiration Tracking** - Keep job listings up-to-date automatically
- **Responsive Design** - Works seamlessly on desktop and mobile
- **Real-time Search** - Instant client-side filtering for fast results

## 📊 Data Sources

This application uses the **Hybrid Apify Approach**:

1. **Initial Population**: Career Site Job Listing Feed (~15k active jobs, $30 one-time)
2. **Daily Updates**: Career Site Job Listing API (~500 new jobs/day, $180/month)
3. **Expiration Tracking**: Expired Jobs Actor (fixed $20/month)

**Total Monthly Cost**: ~$200

Data comes from 41 ATS platforms including:
- Workday
- Greenhouse  
- Ashby
- Lever
- iCIMS
- BambooHR
- And 35+ more

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Data Source**: Apify Career Site APIs
- **Deployment**: Vercel (recommended)
- **Automation**: Vercel Cron Jobs

## 📋 Prerequisites

- Node.js 18+ installed
- A Supabase account and project
- An Apify account with API access
- A Vercel account (for deployment)

## 🚦 Getting Started

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd netherlands-job-board
npm install
```

### 2. Set Up Supabase Database

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the entire `DATABASE_SCHEMA.sql` file
3. Get your project credentials from Settings > API

### 3. Set Up Apify

1. Sign up at [apify.com](https://apify.com)
2. Get your API token from Settings > Integrations
3. Subscribe to:
   - [Career Site Job Listing API](https://apify.com/fantastic-jobs/career-site-job-listing-api)
   - [Career Site Job Listing Feed](https://apify.com/fantastic-jobs/career-site-job-listing-feed)
   - Expired Jobs Actor

### 4. Configure Environment Variables

Create a `.env.local` file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Apify
APIFY_API_TOKEN=your-apify-token

# Cron Secret
CRON_SECRET=generate-a-random-string

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
netherlands-job-board/
├── app/
│   ├── layout.tsx           # Root layout with metadata
│   ├── page.tsx             # Main page with filters and listings
│   ├── globals.css          # Global styles
│   └── api/
│       └── cron/
│           ├── daily-sync/  # Daily job sync endpoint
│           └── cleanup/     # Monthly cleanup endpoint
├── components/
│   ├── FilterPanel.tsx      # Advanced filter sidebar
│   ├── JobCard.tsx          # Individual job card with details
│   └── JobList.tsx          # Job list with loading states
├── lib/
│   ├── supabase.ts          # Supabase client and queries
│   └── apify.ts             # Apify API integration
├── types/
│   └── job.ts               # TypeScript interfaces
├── DATABASE_SCHEMA.sql      # Complete database schema
└── README.md                # This file
```

## 🔄 Automated Job Sync

### Daily Job Updates (5am)

Create `/app/api/cron/daily-sync/route.ts`:

```typescript
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // 1. Fetch new jobs from Apify API (24 hours)
  // 2. Check for expired jobs
  // 3. Update database
  // 4. Send notifications
  
  return Response.json({ success: true });
}
```

### Configure Vercel Cron

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-sync",
      "schedule": "0 5 * * *"
    }
  ]
}
```

## 🎨 Customization

### Adding New Filters

1. Update `FilterState` in `types/job.ts`
2. Add input in `components/FilterPanel.tsx`
3. Update filtering logic in `components/JobList.tsx`

### Styling

The app uses Tailwind CSS. Customize in `tailwind.config.ts`:

```typescript
theme: {
  extend: {
    colors: {
      primary: '#your-color',
    },
  },
}
```

## 🚀 Deployment to Vercel

### Via Vercel Dashboard

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your repository
5. Add environment variables from `.env.example`
6. Deploy!

### Via Vercel CLI

```bash
npm install -g vercel
vercel
```

### Post-Deployment

1. Run initial population script to load existing jobs
2. Verify cron jobs are scheduled
3. Test the daily sync endpoint
4. Monitor Apify usage in dashboard

## 📊 Cost Monitoring

Track your Apify costs in the database:

```sql
SELECT 
  DATE_TRUNC('month', date) as month,
  actor,
  SUM(job_count) as total_jobs,
  SUM(cost) as total_cost
FROM apify_usage_logs
WHERE date >= NOW() - INTERVAL '6 months'
GROUP BY month, actor
ORDER BY month DESC;
```

## 🔧 Troubleshooting

### Jobs not loading

1. Check Supabase connection in browser console
2. Verify environment variables are set
3. Check database RLS policies
4. Review Supabase logs

### Apify API errors

1. Verify API token is valid
2. Check actor subscriptions are active
3. Review usage limits
4. Check Apify run logs

### Build errors

```bash
rm -rf .next node_modules
npm install
npm run build
```

## 📈 Future Enhancements

- [ ] User authentication and saved searches
- [ ] Email notification system for job alerts
- [ ] Job bookmarking functionality
- [ ] Advanced analytics dashboard
- [ ] Company profiles with all their jobs
- [ ] Salary insights and trends
- [ ] Application tracking
- [ ] Premium job listings for employers

## 💰 Monetization Ideas

- Featured job listings (€50-100/job)
- Premium user accounts (€5-10/month)
- Company profile pages
- Email newsletter sponsorships
- Recruitment agency partnerships

## 📄 License

MIT License - feel free to use this project for your own job board!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues and questions, please open an issue in the GitHub repository.

---

Built with ❤️ for expats in the Netherlands

