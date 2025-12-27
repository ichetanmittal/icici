import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = supabaseServer;

    // Check invitations table
    const { data: invitations, error: invError } = await supabase
      .from('invitations')
      .select('*')
      .eq('invited_role', 'importer');

    // Check user_profiles for importers
    const { data: importers, error: impError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('role', 'IMPORTER');

    // Check all user_profiles to see what's there
    const { data: allProfiles, error: allError } = await supabase
      .from('user_profiles')
      .select('id, role, company_name, bank_name, user_id');

    return NextResponse.json({
      invitations: invitations || [],
      invitationsError: invError?.message || null,
      importers: importers || [],
      importersError: impError?.message || null,
      allProfiles: allProfiles || [],
      allProfilesError: allError?.message || null,
      counts: {
        invitations: invitations?.length || 0,
        importers: importers?.length || 0,
        allProfiles: allProfiles?.length || 0,
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debug data', details: String(error) },
      { status: 500 }
    );
  }
}
