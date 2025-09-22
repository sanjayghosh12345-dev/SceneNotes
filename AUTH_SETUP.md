# Authentication Setup Guide

## 1. Create Environment Variables File

Create a `.env.local` file in your project root with the following content:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration (optional - for AI features)
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini-2024-07-18

# Budget Configuration
NEXT_PUBLIC_BUDGET_USD=5
```

## 2. Get Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and sign in
2. Create a new project or select an existing one
3. Go to Settings → API
4. Copy your Project URL and anon/public key
5. Paste them into your `.env.local` file

## 3. Set Up Supabase Database

Run this SQL in your Supabase SQL editor to create the projects table:

```sql
-- Create projects table
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled',
  content TEXT NOT NULL DEFAULT '',
  state JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to access only their own projects
CREATE POLICY "Users can access their own projects" ON projects
  FOR ALL USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## 4. Configure Supabase Auth

1. Go to Authentication → Settings in your Supabase dashboard
2. Under "Site URL", add your development URL: `http://localhost:3000`
3. Under "Redirect URLs", add: `http://localhost:3000?auth=callback`
4. Enable "Email" provider
5. Configure email templates if desired

## 5. Test the Setup

1. Run `npm run dev`
2. Open `http://localhost:3000`
3. Try signing in with your email
4. Check your email for the magic link
5. Click the link to complete authentication
6. Refresh the page - you should stay signed in!

## Troubleshooting

### Session Not Persisting
- Check browser console for errors
- Verify environment variables are correct
- Clear browser storage and try again
- Check Supabase dashboard for auth logs

### Email Not Received
- Check spam folder
- Verify email provider settings in Supabase
- Check Supabase logs for delivery errors

### Database Errors
- Verify RLS policies are set up correctly
- Check that the projects table exists
- Ensure user_id matches auth.users.id
