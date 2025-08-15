# Alumni Connect - Development Setup Guide

This guide will help you set up the Alumni Connect project for local development.

## 🏁 Quick Start

### Prerequisites
- Node.js 18+ installed
- Git installed
- Supabase account (free tier works)

### 1. Project Setup
```bash
# Clone and install dependencies
cd alumni-connect
npm install
```

### 2. Supabase Configuration

#### Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Set project name: `alumni-connect-dev`
5. Set database password (save this!)
6. Choose region (Seoul for Korean users)
7. Click "Create new project"

#### Run Database Schema
1. Wait for project to be ready (~2 minutes)
2. Go to SQL Editor in Supabase dashboard
3. Copy the entire content from `supabase/schema.sql`
4. Paste and click "Run"
5. Verify tables are created in Database > Tables

#### Get API Keys
1. Go to Settings > API
2. Copy `Project URL` and `anon public` key
3. Copy `service_role secret` key (keep this private!)

### 3. Environment Setup
```bash
# Copy environment template
cp .env.local .env.local

# Edit .env.local with your Supabase credentials
```

Update `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app!

## 🔧 Development Workflow

### Project Structure
```
alumni-connect/
├── src/
│   ├── app/                 # Next.js 14 App Router
│   │   ├── api/            # API routes
│   │   │   ├── candidates/ # Find nearby users
│   │   │   ├── chat/       # Chat functionality
│   │   │   ├── blocks/     # User blocking
│   │   │   └── reports/    # User reporting
│   │   ├── page.tsx        # Landing page
│   │   └── layout.tsx      # Root layout
│   ├── components/         # React components
│   │   └── ui/            # shadcn/ui components
│   ├── lib/               # Utilities
│   │   ├── supabase/      # Supabase clients
│   │   └── utils.ts       # Helper functions
│   └── types/             # TypeScript definitions
├── supabase/
│   └── schema.sql         # Database schema
├── public/                # Static assets
└── package.json          # Dependencies
```

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript check
```

### Key Features to Test

#### 1. Landing Page
- Visit `http://localhost:3000`
- Should see Korean language homepage
- Test responsive design (mobile/desktop)

#### 2. API Endpoints
Test with curl or Postman:

```bash
# Test candidates API (requires auth)
curl -X GET "http://localhost:3000/api/candidates?lat=37.5665&lng=126.9780" \
  -H "Authorization: Bearer [token]"

# Test chat rooms (requires auth)
curl -X GET "http://localhost:3000/api/chat/rooms" \
  -H "Authorization: Bearer [token]"
```

#### 3. Database Functions
Test in Supabase SQL editor:

```sql
-- Test candidate finding function
SELECT * FROM find_candidates(
  'user-uuid-here'::uuid,
  37.5665,  -- Seoul latitude
  126.9780, -- Seoul longitude
  6000      -- 6km radius
);

-- Test chat room creation
SELECT get_or_create_chat_room(
  'user1-uuid'::uuid,
  'user2-uuid'::uuid
);
```

## 🧪 Testing & Debugging

### Browser DevTools
1. Open DevTools (F12)
2. Check Console for errors
3. Network tab to monitor API calls
4. Application tab to inspect localStorage

### Supabase Debugging
1. Go to Supabase Dashboard
2. Database > Logs to see query logs
3. Authentication > Users to manage test users
4. API > Logs to see API request logs

### Common Issues & Solutions

#### Issue: "PostGIS extension not found"
```sql
-- Run in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS postgis;
```

#### Issue: "Authentication required" 
- Check if `.env.local` has correct Supabase keys
- Verify Supabase RLS policies are set up
- Test with a valid user session

#### Issue: API routes return 404
- Ensure you're using Next.js 14 App Router structure
- Check file names match exactly: `route.ts` not `route.js`
- Verify TypeScript compilation is working

#### Issue: Location not working
- Test on HTTPS (localhost is ok for development)
- Check browser permissions for location access
- Test with mobile device for GPS accuracy

## 📱 Mobile Development

### Testing on Mobile
1. Find your computer's IP address
2. Update `NEXT_PUBLIC_APP_URL` to `http://[your-ip]:3000`
3. Access from mobile browser on same network
4. Test location permissions and PWA features

### PWA Testing
1. Serve over HTTPS (use ngrok for testing)
2. Open DevTools > Application > Manifest
3. Test "Add to Home Screen" functionality

## 🔒 Security Considerations

### Environment Variables
- Never commit `.env.local` to git
- Use different Supabase projects for dev/prod
- Rotate API keys regularly

### Database Security
- All tables use Row Level Security (RLS)
- Test policies with different user contexts
- Verify sensitive data is not exposed

### API Security
- All routes check authentication
- Input validation with Zod schemas
- Rate limiting implemented

## 📊 Monitoring & Analytics

### Development Monitoring
```bash
# Monitor database connections
# In Supabase Dashboard > Settings > Database

# Monitor API performance
# Check Next.js build output for bundle size
npm run build
```

### Event Tracking (Future)
```typescript
// Track user events for analytics
await supabase
  .from('user_event')
  .insert({
    user_id: user.id,
    event_name: 'view_candidates',
    event_data: { count: candidates.length }
  })
```

## 🚀 Deployment Preparation

### Pre-deployment Checklist
- [ ] All environment variables configured
- [ ] Database schema applied to production
- [ ] RLS policies tested
- [ ] API endpoints working
- [ ] Mobile responsive design tested
- [ ] PWA manifest configured
- [ ] Error handling implemented
- [ ] Performance optimized

### Production Environment
1. Create production Supabase project
2. Run schema on production database
3. Set up Vercel deployment
4. Configure production environment variables
5. Test with real users in limited beta

## 🆘 Getting Help

### Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Troubleshooting
1. Check browser console for errors
2. Verify environment variables are loaded
3. Test API endpoints individually
4. Check Supabase logs for database errors
5. Ensure all dependencies are installed

### Support
- Create GitHub issue for bugs
- Join project Discord/Slack for discussions
- Contact maintainers for urgent issues

---

Happy coding! 🎉