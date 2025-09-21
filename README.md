# Vidyakosh - School Learning Management System

A comprehensive, modern Learning Management System built with Next.js, Supabase, and Shadcn UI. Designed for multi-school deployment with role-based access control.

## Features

### 🎓 Core LMS Features
- **Multi-tenant Architecture**: Each school operates independently
- **Role-based Access**: Admin, Teacher, and Student roles with appropriate permissions
- **Course Management**: Create, manage, and deliver courses with lessons, assignments, and quizzes
- **Real-time Messaging**: School-wide communication with channels and direct messaging
- **Interactive Blackboard**: Collaborative whiteboard for real-time teaching
- **Assignment System**: Create, submit, and grade assignments
- **Quiz Engine**: Create quizzes with multiple question types
- **File Management**: Upload and manage course materials and submissions

### 📊 Analytics & Reporting
- **Dashboard Analytics**: Key metrics and insights for each role
- **Student Progress Tracking**: Monitor individual and class performance
- **Engagement Analytics**: Track user activity and participation
- **Attendance Management**: Digital attendance tracking

### 🛡️ Security & Performance
- **Row Level Security (RLS)**: Database-level security for multi-tenancy
- **Authentication**: Supabase Auth with email/password
- **Real-time Updates**: Live messaging and notifications
- **Responsive Design**: Works on desktop, tablet, and mobile

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Shadcn UI
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React

## Quick Setup

### Prerequisites
- Node.js 18+ 
- A Supabase account

### 1. Clone and Install

```bash
git clone <your-repo>
cd vidyakosh
npm install
```

### 2. Environment Setup

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

1. Create a new Supabase project
2. Go to SQL Editor in your Supabase dashboard
3. Copy and paste the contents of `database_schema.sql`
4. Run the SQL script

### 4. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000`

## Project Structure

```
src/
├── app/                    # Next.js app directory │   ├── dashboard/         # Dashboard page │   ├── courses/           # Course management │   ├── messages/          # Messaging system
│   ├── login/             # Authentication
│   └── signup/            # User registration
├── components/            # React components
│   ├── ui/               # Shadcn UI components
│   ├── navigation.tsx    # Main navigation
│   └── dashboard-layout.tsx
├── hooks/                 # Custom React hooks
│   └── useAuth.tsx       # Authentication context
├── lib/                  # Utility libraries
│   ├── supabase/         # Supabase client setup
│   ├── database.types.ts # TypeScript database types
│   └── utils.ts          # Utility functions
└── middleware.ts         # Next.js middleware for auth
```

## User Roles & Permissions

### 👑 School Admin
- Create and manage courses
- Add/remove teachers and students
- View all analytics and reports
- Manage school settings
- Access to all messaging channels

### 👨‍🏫 Teacher
- Create and manage assigned courses
- Create lessons, assignments, and quizzes
- Grade student submissions
- View student progress and analytics
- Access course-specific messaging

### 👨‍🎓 Student
- Enroll in courses
- View lessons and course materials
- Submit assignments and take quizzes
- View grades and progress
- Participate in course discussions

## Key Features Walkthrough

### Authentication & Onboarding
1. Users sign up with email/password
2. Admins create schools during signup
3. Teachers/Students join existing schools
4. Role-based dashboard access

### Course Management
1. Admins/Teachers create courses
2. Add lessons with content and media
3. Create assignments with due dates
4. Build quizzes with multiple question types
5. Enroll students in courses

### Messaging System
1. School-wide channels for announcements
2. Course-specific channels for discussions
3. Real-time message delivery
4. File attachments support

### Dashboard Analytics
1. Role-specific metrics display
2. Recent activity tracking
3. Quick action buttons
4. Progress visualization

## Database Schema

The system uses a multi-tenant PostgreSQL schema with the following key tables:

- **schools**: Multi-tenant root entity
- **profiles**: User profiles linked to Supabase Auth
- **courses**: Course information and metadata
- **lessons**: Course content and materials
- **assignments**: Assignment specifications
- **messages**: Real-time messaging
- **enrollments**: Student-course relationships

Full schema available in `database_schema.sql`

## Development

### Adding New Features

1. **Database Changes**: Update `database_schema.sql` and `database.types.ts`
2. **UI Components**: Add new Shadcn UI components to `components/ui/`
3. **Pages**: Create new pages in the `app/` directory
4. **API Logic**: Use Supabase client for data operations

### Common Development Tasks

```bash
# Install new dependencies
npm install <package-name>

# Type checking
npm run build

# Linting
npm run lint

# Database types generation (if using Supabase CLI)
supabase gen types typescript --project-id <project-id> > src/lib/database.types.ts
```

## Deployment

### Vercel Deployment (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on git push

### Manual Deployment

1. Build the application:
   ```bash
   npm run build
   ```
2. Deploy the `.next` folder to your hosting provider

## Security Considerations

- **Row Level Security**: All tables have RLS policies
- **Authentication**: Handled by Supabase Auth
- **API Security**: Server-side validation on all operations
- **Input Validation**: Zod schemas for form validation
- **CORS**: Configured through Supabase dashboard

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the database schema

## License

This project is licensed under the MIT License.

---

Built with ❤️ for modern education
