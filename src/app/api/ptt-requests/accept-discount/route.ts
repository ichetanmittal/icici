import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pttId, userId, action, rejectionReason } = body;

    if (!pttId || !userId || !action) {
      return NextResponse.json(
        { error: 'PTT ID, User ID, and action are required' },
        { status: 400 }
      );
    }

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "accept" or "reject"' },
        { status: 400 }
      );
    }

    // Get user profile to check role
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Validate user is ICICI Gift IBU maker
    if (userProfile.role !== 'gift_ibu_maker') {
      return NextResponse.json(
        { error: 'Only ICICI Gift IBU makers can accept/reject discount offers' },
        { status: 403 }
      );
    }

    // Get PTT request
    const { data: pttRequest, error: pttError } = await supabase
      .from('ptt_requests')
      .select('*')
      .eq('id', pttId)
      .single();

    if (pttError || !pttRequest) {
      return NextResponse.json(
        { error: 'PTT request not found' },
        { status: 404 }
      );
    }

    // Validate current status
    if (pttRequest.status !== 'offered_for_discount') {
      return NextResponse.json(
        { error: 'Only offered PTTs can be accepted or rejected' },
        { status: 400 }
      );
    }

    // Prepare update based on action
    let updateData: any = {};
    let message = '';

    if (action === 'accept') {
      updateData = {
        status: 'discounted',
        discounted_at: new Date().toISOString(),
        discounted_by: userId,
      };
      message = 'Discount offer accepted successfully';
    } else {
      // Reject - send back to documents_approved status
      updateData = {
        status: 'documents_approved',
        discount_rejection_reason: rejectionReason || 'Offer rejected by ICICI Gift IBU',
        // Clear discount data
        discount_percentage: null,
        offered_for_discount_at: null,
      };
      message = 'Discount offer rejected';
    }

    // Update PTT
    const { data: updatedPTT, error: updateError } = await supabase
      .from('ptt_requests')
      .update(updateData)
      .eq('id', pttId)
      .select()
      .single();

    if (updateError) {
      console.error('Error processing discount offer:', updateError);
      return NextResponse.json(
        { error: 'Failed to process discount offer' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message,
      pttRequest: updatedPTT,
    });
  } catch (error) {
    console.error('Error in discount offer processing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
