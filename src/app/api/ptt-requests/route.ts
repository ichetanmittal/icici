import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Generate unique PTT number
async function generatePTTNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `PTT-${year}${month}`;

  // Get count of PTTs created this month
  const { count } = await supabase
    .from('ptt_requests')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', `${year}-${month}-01`)
    .lt('created_at', `${year}-${String(parseInt(month) + 1).padStart(2, '0')}-01`);

  const sequence = String((count || 0) + 1).padStart(4, '0');
  return `${prefix}-${sequence}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency, exporterId, exporterBank, maturityDays, incoterms, userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!amount || !currency || !maturityDays || !incoterms) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    // Get user profile to determine importer bank
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('bank_name, role')
      .eq('user_id', userId)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Ensure user is an importer
    if (userProfile.role !== 'importer') {
      return NextResponse.json(
        { error: 'Only importers can request PTTs' },
        { status: 403 }
      );
    }

    // Generate PTT number
    const pttNumber = await generatePTTNumber();

    // Create PTT request
    const { data: pttRequest, error: insertError } = await supabase
      .from('ptt_requests')
      .insert({
        ptt_number: pttNumber,
        amount: parseFloat(amount),
        currency,
        maturity_days: parseInt(maturityDays),
        incoterms,
        importer_id: userId,
        exporter_id: exporterId || null,
        importer_bank: userProfile.bank_name || 'DBS Bank',
        exporter_bank: exporterBank || null,
        status: 'pending',
        requested_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating PTT request:', insertError);
      return NextResponse.json(
        { error: 'Failed to create PTT request' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'PTT request created successfully',
        pttRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in PTT request creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const importerBank = searchParams.get('importerBank');

    let query = supabase
      .from('ptt_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (importerBank) {
      query = query.eq('importer_bank', importerBank);
    }

    const { data: requests, error } = await query;

    if (error) {
      console.error('Error fetching PTT requests:', error);
      return NextResponse.json(
        { error: 'Failed to fetch PTT requests' },
        { status: 500 }
      );
    }

    // Fetch user profiles for importers and exporters
    if (requests && requests.length > 0) {
      const importerIds = requests.map(r => r.importer_id).filter(Boolean);
      const exporterIds = requests.map(r => r.exporter_id).filter(Boolean);
      const allUserIds = [...new Set([...importerIds, ...exporterIds])];

      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, company_name, contact_person, phone_number')
        .in('user_id', allUserIds);

      // Map profiles to requests
      const requestsWithProfiles = requests.map(request => ({
        ...request,
        importer: profiles?.find(p => p.user_id === request.importer_id) || null,
        exporter: profiles?.find(p => p.user_id === request.exporter_id) || null,
      }));

      return NextResponse.json({ requests: requestsWithProfiles });
    }

    return NextResponse.json({ requests: [] });
  } catch (error) {
    console.error('Error in GET PTT requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
