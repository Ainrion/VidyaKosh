# Vidyakosh Setup Guide

This guide will help you set up the Vidyakosh LMS system from scratch.

## Prerequisites

Before you begin, ensure you have:
- Node.js 18 or later installed
- A Supabase account (free tier available)
- A code editor (VS Code recommended)

## Step 1: Environment Setup

1. **Clone the repository** (if using git):
   ```bash
   git clone <your-repository-url>
   cd vidyakosh
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

## Step 2: Supabase Setup

### Create a New Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Choose your organization
5. Enter project name (e.g., "vidyakosh-lms")
6. Enter a secure database password
7. Choose a region close to your users
8. Click "Create new project"

### Get Your API Keys

1. Go to your project dashboard
2. Click on "Settings" in the sidebar
3. Click on "API"
4. Copy the following values:
   - **Project URL** (`https://your-project.supabase.co`)
   - **Anon/Public Key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)
   - **Service Role Key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)

### Create Environment File

1. In your project root, copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and replace the placeholder values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

## Step 3: Database Setup

### Run the Database Schema

1. In your Supabase dashboard, go to "SQL Editor"
2. Click "New query"
3. Copy the entire contents of `database_schema.sql` from your project
4. Paste it into the SQL editor
5. Click "Run" to execute the schema

This will create all the necessary tables, relationships, and security policies.

### Verify the Setup

1. Go to "Table Editor" in your Supabase dashboard
2. You should see all the tables created:
   - schools
   - profiles
   - courses
   - lessons
   - assignments
   - messages
   - and more...

## Step 4: Run the Application

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Open your browser** and go to [http://localhost:3000](http://localhost:3000)

3. You should see the Vidyakosh landing page

## Step 5: Create Your First School

### Sign Up as Admin

1. Click "Get Started" or "Sign Up"
2. Fill in the form:
   - **Full Name**: Your name
   - **Email**: Your email address
   - **Password**: A secure password
   - **Role**: Select "School Admin"
   - **School Name**: Your school's name
3. Click "Sign up"

### Verify Your Account

1. Check your email for a verification link from Supabase
2. Click the verification link
3. You'll be redirected back to the application
4. You should now be logged in to your dashboard

## Step 6: Explore the Features

### Dashboard
- View school statistics
- Quick actions for common tasks
- Recent activity overview

### Course Management
- Create new courses
- Add lessons and content
- Manage assignments and quizzes

### User Management (Admin Only)
- Add teachers and students
- Manage user roles and permissions
- View user activity

### Messaging System
- Create school-wide channels
- Real-time messaging
- Course-specific discussions

### Settings
- Update school information
- Manage notification preferences
- Configure system settings

## Step 7: Add Users to Your School

### Method 1: Direct Signup (Recommended for Testing)

1. Share the signup link with teachers and students
2. They can sign up and select their role
3. You'll need to manually assign them to your school in the database initially

### Method 2: Admin Invitation (Future Feature)

The user invitation system is prepared but requires additional implementation for sending invitation emails.

## Troubleshooting

### Common Issues

1. **"Cannot connect to Supabase"**
   - Check your environment variables in `.env.local`
   - Ensure your Supabase project is active
   - Verify the URL and API keys are correct

2. **"Authentication errors"**
   - Make sure you've run the database schema
   - Check that RLS policies are enabled
   - Verify your user has the correct role

3. **"Permission denied" errors**
   - Check the Row Level Security policies
   - Ensure users are properly assigned to schools
   - Verify the user's role permissions

4. **Build errors**
   - Run `npm install` to ensure all dependencies are installed
   - Check for TypeScript errors
   - Verify all imports are correct

### Getting Help

1. Check the browser console for error messages
2. Look at the Supabase logs in your dashboard
3. Review the database schema and relationships
4. Check this documentation and README.md

## Development Tips

### Adding New Features

1. **Database Changes**: Update `database_schema.sql` first
2. **Type Safety**: Regenerate types with Supabase CLI if available
3. **UI Components**: Use existing Shadcn components for consistency
4. **Testing**: Test with different user roles

### Best Practices

1. Always test with multiple user roles
2. Follow the existing code structure and patterns
3. Use TypeScript for better error catching
4. Keep security in mind - validate data on both client and server

### Useful Commands

```bash
# Install new packages
npm install package-name

# Build for production
npm run build

# Run linting
npm run lint

# Start development server
npm run dev
```

## Production Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on git push

### Other Platforms

1. Build the application: `npm run build`
2. Deploy the `.next` folder
3. Set environment variables
4. Configure your domain

## Security Considerations

- Never commit `.env.local` to version control
- Use Row Level Security policies for data protection
- Validate all user inputs
- Keep dependencies updated
- Use HTTPS in production

## Next Steps

1. Customize the branding and styling
2. Add more features like file uploads
3. Implement email notifications
4. Add analytics and reporting
5. Scale your infrastructure as needed

---

🎉 **Congratulations!** You now have a fully functional LMS system. Start by creating courses and inviting users to experience the full power of Vidyakosh.
