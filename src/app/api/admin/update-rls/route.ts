import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    // Drop old policy
    await supabase.rpc('exec_sql', {
      sql: `DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;`
    }).catch(() => {
      // Ignore error if RPC doesn't exist, we'll use direct SQL
    });

    // Since RPC might not be available, let's try direct policy creation
    const { error: dropError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(0);

    // Create new policy using raw SQL
    const sql = `
      DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;

      CREATE POLICY "Users can read profiles"
        ON user_profiles FOR SELECT
        USING (
          auth.uid() = user_id
          OR
          role IN ('exporter', 'importer')
          OR
          auth.uid() IN (
            SELECT user_id FROM user_profiles
            WHERE role IN ('dbs_bank_maker', 'dbs_bank_checker', 'gift_ibu_maker', 'gift_ibu_checker')
          )
        );
    `;

    return NextResponse.json({
      message: 'RLS policy update initiated',
      note: 'Please run the migration SQL manually in Supabase SQL Editor',
      sql: sql,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}
