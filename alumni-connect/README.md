# Alumni Connect

A location-based alumni networking app that helps users connect with nearby people from the same schools or companies through anonymous 1:1 conversations.

## 🎯 Core Features

- **Location-based Discovery**: Find alumni within 6km radius
- **Anonymous Chat**: Start conversations without revealing personal information
- **Common Affiliation Matching**: Connect based on shared schools/companies
- **Safety Features**: Block and report functionality
- **Age Verification**: 19+ only platform
- **Real-time Messaging**: Instant communication
- **Progressive Web App**: Mobile-optimized experience

## 🏗 Technology Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI
- **Backend**: Supabase (PostgreSQL + PostGIS, Auth, Realtime)
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **Location**: HTML5 Geolocation API
- **Authentication**: Supabase Auth

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

## 🚀 Getting Started

### 1. Clone and Install

```bash
cd alumni-connect
npm install
```

### 2. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. In your Supabase dashboard, go to SQL Editor
3. Run the schema from `supabase/schema.sql` to create all tables and functions
4. Enable PostGIS extension if not already enabled:
   ```sql
   create extension if not exists postgis;
   ```

### 3. Environment Configuration

Copy `.env.local.example` to `.env.local` and update with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📊 Database Schema

### Core Tables

- **app_user**: User profiles (age 19+ only)
- **affiliation**: School/company associations
- **user_location**: Geospatial user coordinates
- **chat_room**: 1:1 conversation rooms
- **message**: Chat messages with real-time support
- **user_block**: Blocking relationships
- **user_report**: User reporting for moderation
- **user_event**: Analytics tracking

### Key Functions

- **find_candidates()**: Geospatial query for nearby users with common affiliations
- **get_or_create_chat_room()**: Chat room management
- Row Level Security (RLS) policies for data protection

## 🔧 API Endpoints

### Candidates
- `GET /api/candidates?lat={lat}&lng={lng}` - Find nearby candidates

### Chat
- `POST /api/chat/rooms` - Create/get chat room
- `GET /api/chat/rooms` - List user's chat rooms
- `POST /api/chat/messages` - Send message
- `GET /api/chat/messages?roomId={id}` - Get messages

### Safety
- `POST /api/blocks` - Block user
- `DELETE /api/blocks?targetUserId={id}` - Unblock user
- `POST /api/reports` - Report user

## 🎨 UI Components

Built with shadcn/ui components:
- Button, Card, Input, Form
- Dialog, Dropdown Menu
- Responsive design with Tailwind CSS

## 🛡 Security Features

- **Row Level Security**: Database-level access control
- **Age Verification**: Must be 19+ to join
- **Location Privacy**: Exact coordinates not exposed to other users
- **Blocking System**: Mutual invisibility when blocked
- **Reporting System**: Content moderation support
- **Rate Limiting**: API endpoint protection

## 📱 PWA Features

- Mobile-responsive design
- Offline capability (planned)
- Push notifications (planned)
- App-like experience

## 🔄 State Management

Using Zustand for:
- User authentication state
- Location data
- Chat messages
- UI state (loading, errors)

## 📈 Analytics

Event tracking for key metrics:
- `app_open` - App usage
- `view_candidates` - Discovery engagement
- `start_chat` - Conversation initiation
- `send_message` - Message activity
- `block_user` / `report_user` - Safety actions

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 🧪 Testing Strategy

### MVP Testing Phases

1. **Alpha (Internal)**: 50 users, 2 districts in Seoul
2. **Beta (Limited)**: Seoul metropolitan area, 100 daily signups
3. **Launch**: Full rollout based on metrics

### Key Metrics

- **OMTM**: 24h first message conversion rate ≥ 30%
- **D1 Active**: Next-day return rate ≥ 35%
- **Safety**: Report rate ≤ 2%
- **Performance**: Message latency < 300ms

## 🔒 Privacy & Safety

- Anonymous nicknames only
- Location shown as distance only
- Real-time blocking/reporting
- Content moderation ready
- GDPR-compliant data handling

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For questions or issues:
- Create an issue in this repository
- Contact: [your-email@domain.com]

---

**Note**: This is an MVP focused on core functionality. Advanced features like group chats, events, and premium subscriptions are planned for future iterations.
