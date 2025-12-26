-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role TEXT NOT NULL,
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  geography TEXT,
  credit_limit DECIMAL(15, 2),
  account_balance DECIMAL(15, 2) DEFAULT 0,
  bank_name TEXT,
  bank_account_number TEXT,
  swift_code TEXT,
  treasury_balance DECIMAL(15, 2),
  current_balance DECIMAL(15, 2),
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add new columns if they don't exist (for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='geography') THEN
    ALTER TABLE user_profiles ADD COLUMN geography TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='credit_limit') THEN
    ALTER TABLE user_profiles ADD COLUMN credit_limit DECIMAL(15, 2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='account_balance') THEN
    ALTER TABLE user_profiles ADD COLUMN account_balance DECIMAL(15, 2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='bank_name') THEN
    ALTER TABLE user_profiles ADD COLUMN bank_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='bank_account_number') THEN
    ALTER TABLE user_profiles ADD COLUMN bank_account_number TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='swift_code') THEN
    ALTER TABLE user_profiles ADD COLUMN swift_code TEXT;
  END IF;
END $$;

-- Add check constraints for positive balances (drop first if exists)
ALTER TABLE user_profiles
DROP CONSTRAINT IF EXISTS positive_treasury_balance;

ALTER TABLE user_profiles
ADD CONSTRAINT positive_treasury_balance CHECK (treasury_balance >= 0);

ALTER TABLE user_profiles
DROP CONSTRAINT IF EXISTS positive_current_balance;

ALTER TABLE user_profiles
ADD CONSTRAINT positive_current_balance CHECK (current_balance >= 0);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS user_profiles_user_id_idx ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS user_profiles_role_idx ON user_profiles(role);

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  entity_name TEXT NOT NULL,
  geography TEXT NOT NULL,
  poc_name TEXT NOT NULL,
  poc_email TEXT NOT NULL,
  poc_phone TEXT NOT NULL,
  credit_limit DECIMAL(15, 2) NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Create policies for invitations
DROP POLICY IF EXISTS "Users can read invitations by token" ON invitations;
CREATE POLICY "Users can read invitations by token"
  ON invitations FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert invitations" ON invitations;
CREATE POLICY "Users can insert invitations"
  ON invitations FOR INSERT
  WITH CHECK (auth.uid() = invited_by);

DROP POLICY IF EXISTS "Users can update own invitations" ON invitations;
CREATE POLICY "Users can update own invitations"
  ON invitations FOR UPDATE
  USING (auth.uid() = invited_by);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS invitations_token_idx ON invitations(token);
CREATE INDEX IF NOT EXISTS invitations_email_idx ON invitations(poc_email);
CREATE INDEX IF NOT EXISTS invitations_status_idx ON invitations(status);
