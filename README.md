# ICICI Trade Finance Platform

A modern trade finance platform built with Next.js 16, enabling seamless financial transactions between exporters, importers, and banking institutions through Programmable Trade Tokens (PTTs) with maker-checker workflow.

## Overview

The ICICI Trade Finance Platform facilitates trade finance operations using Programmable Trade Tokens (PTTs) - digitized trade instruments that enable instant liquidity and automated workflows. The platform features a comprehensive role-based access system for exporters, importers, and two funder entities (Gift IBU Funder and DBS Bank), with maker-checker controls for enhanced security and compliance.

## Entities & Roles

### Funder Organizations (Entities with Treasury)
- **Gift IBU Funder (ICICI Bank)** - Manages treasury and provides trade finance
- **DBS Bank** - Manages treasury and provides trade finance

### User Roles
1. **Exporter** - Companies exporting goods
2. **Importer** - Companies importing goods
3. **Gift IBU Maker (POC)** - Initiates transactions for Gift IBU Funder
4. **Gift IBU Checker** - Reviews and approves Gift IBU transactions
5. **DBS Bank Maker (POC)** - Initiates transactions for DBS Bank
6. **DBS Bank Checker** - Reviews and approves DBS Bank transactions

## Key Features

### Authentication System
- Email/password authentication via Supabase
- Role-based access control
- Automatic dashboard routing based on user role
- Profile dropdown with user information

### Bank Dashboards
- **DBS Bank Dashboard** (Orange theme)
  - Treasury balance tracking
  - PTT (Programmable Trade Token) management
  - Pending requests and approvals
  - Settlement tracking
  - Document management
  - Blacklist management

- **Gift IBU Funder Dashboard** (Blue theme)
  - Treasury balance monitoring
  - PTT issuance and tracking
  - Approval workflows
  - Settlement management
  - Document repository
  - Blacklist controls

### Dashboard Features
- Real-time treasury balance display
- Pending requests overview
- Issued PTTs tracking
- Total exposure monitoring
- Pending settlements management

## Tech Stack

- **Framework**: Next.js 16.1.1
- **React**: 19.2.3
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS 4
- **Font**: Lexend (Google Fonts)
- **Language**: TypeScript 5

## Getting Started

### Prerequisites
- Node.js 20+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd icici
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create `.env.local` file with:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Email Configuration (for invitations)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM=noreply@hazeltrade.com
```

4. Set up the database:
- Go to Supabase Dashboard → SQL Editor
- Run the SQL from `supabase-schema.sql`

5. Disable email confirmation in Supabase:
- Go to Authentication → Settings
- Disable "Email confirmations"

6. Start the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

## Database Schema

### user_profiles Table
```sql
- id: UUID (Primary Key)
- user_id: UUID (References auth.users)
- role: TEXT (User role)
- company_name: TEXT
- contact_person: TEXT (User's name)
- phone_number: TEXT
- treasury_balance: DECIMAL (For funders only)
- current_balance: DECIMAL (For funders only)
- address, city, state, postal_code, country: TEXT (Optional)
- created_at, updated_at: TIMESTAMP
```

## Project Structure

```
icici/
├── src/
│   ├── app/
│   │   ├── bank/              # DBS Bank dashboard
│   │   │   ├── layout.tsx     # Bank layout with sidebar
│   │   │   ├── dashboard/     # Main dashboard
│   │   │   ├── ptts/          # Outstanding PTTs
│   │   │   ├── settlements/   # Settlements
│   │   │   ├── approvals/     # Pending approvals
│   │   │   ├── documents/     # Documents
│   │   │   └── blacklist/     # Blacklist
│   │   ├── funder/            # Gift IBU Funder dashboard
│   │   │   └── (same structure as bank)
│   │   ├── login/             # Login page
│   │   ├── register/          # Registration page
│   │   ├── dashboard/         # General dashboard
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   └── components/
│       └── StatCard.tsx       # Stat card component
├── lib/
│   ├── auth.ts                # Authentication utilities
│   ├── supabase.ts            # Supabase client
│   └── supabase-server.ts     # Server-side Supabase
├── types/
│   └── user.ts                # User types and enums
└── supabase-schema.sql        # Database schema

```

## User Flows

### Registration Flow
1. User selects role (Exporter, Importer, or Funder)
2. Fills in company details and contact information
3. Funders (Gift IBU/DBS Bank) must provide initial treasury balance
4. Account created and automatically logged in
5. Redirected to role-specific dashboard

### Dashboard Routing
- **DBS Bank Users** → `/bank/dashboard`
- **Gift IBU Funder Users** → `/funder/dashboard`
- **Exporters/Importers** → `/dashboard`

## Features Coming Soon

- Email invitation system for exporters/importers
- PTT creation and management
- Maker-checker approval workflow
- Settlement processing
- Document upload and management
- Blacklist functionality
- Transaction history
- Reporting and analytics

## Development

### Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Security Features

- Row Level Security (RLS) enabled on all tables
- Maker-checker workflow for sensitive operations
- Email verification (can be toggled)
- Secure password authentication
- Protected API routes

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

Private and Confidential

## Support

For support, please contact the development team.

---

Built with ❤️ using Next.js and Supabase
