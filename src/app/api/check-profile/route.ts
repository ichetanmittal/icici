import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'exporter';

    // Fetch all exporters
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('role', role);

    if (error) {
      console.error('Error fetching profiles:', error);
      return NextResponse.json(
        { error: 'Failed to fetch profiles', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      count: profiles?.length || 0,
      profiles: profiles,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
