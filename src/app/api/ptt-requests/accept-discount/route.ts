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

    if (!['maker_approve', 'checker_approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be "maker_approve", "checker_approve", or "reject"' },
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

    // Handle maker approval
    if (action === 'maker_approve') {
      // Validate user is a maker
      if (userProfile.role !== 'gift_ibu_maker') {
        return NextResponse.json(
          { error: 'Only ICICI Gift IBU makers can perform this action' },
          { status: 403 }
        );
      }

      // Validate current status
      if (pttRequest.status !== 'offered_for_discount') {
        return NextResponse.json(
          { error: 'PTT must be offered for discount' },
          { status: 400 }
        );
      }

      // Update to discount_maker_approved
      const { data: updatedPTT, error: updateError } = await supabase
        .from('ptt_requests')
        .update({
          status: 'discount_maker_approved',
          discount_maker_approved_by: userId,
          discount_maker_approved_at: new Date().toISOString(),
        })
        .eq('id', pttId)
        .select()
        .single();

      if (updateError) {
        console.error('Error approving discount offer:', updateError);
        return NextResponse.json(
          { error: 'Failed to approve discount offer' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Discount offer approved by maker. Awaiting checker approval.',
        pttRequest: updatedPTT,
      });
    }

    // Handle checker approval
    if (action === 'checker_approve') {
      // Validate user is a checker
      if (userProfile.role !== 'gift_ibu_checker') {
        return NextResponse.json(
          { error: 'Only ICICI Gift IBU checkers can perform this action' },
          { status: 403 }
        );
      }

      // Validate current status
      if (pttRequest.status !== 'discount_maker_approved') {
        return NextResponse.json(
          { error: 'PTT must be approved by maker first' },
          { status: 400 }
        );
      }

      // Update to discounted (final status)
      const { data: updatedPTT, error: updateError } = await supabase
        .from('ptt_requests')
        .update({
          status: 'discounted',
          discount_checker_approved_by: userId,
          discount_checker_approved_at: new Date().toISOString(),
          discounted_at: new Date().toISOString(),
          discounted_by: userId,
        })
        .eq('id', pttId)
        .select()
        .single();

      if (updateError) {
        console.error('Error finalizing discount purchase:', updateError);
        return NextResponse.json(
          { error: 'Failed to finalize discount purchase' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Discount purchase finalized by checker',
        pttRequest: updatedPTT,
      });
    }

    // Handle rejection
    if (action === 'reject') {
      // Allow both maker and checker to reject
      if (userProfile.role !== 'gift_ibu_maker' && userProfile.role !== 'gift_ibu_checker') {
        return NextResponse.json(
          { error: 'Only ICICI Gift IBU users can reject offers' },
          { status: 403 }
        );
      }

      // Can reject from either offered_for_discount or discount_maker_approved status
      if (pttRequest.status !== 'offered_for_discount' && pttRequest.status !== 'discount_maker_approved') {
        return NextResponse.json(
          { error: 'Can only reject offered or maker-approved discount offers' },
          { status: 400 }
        );
      }

      // Reject - send back to documents_approved status
      const { data: updatedPTT, error: updateError } = await supabase
        .from('ptt_requests')
        .update({
          status: 'documents_approved',
          discount_rejection_reason: rejectionReason || 'Offer rejected by ICICI Gift IBU',
          // Clear discount maker approval if it existed
          discount_maker_approved_by: null,
          discount_maker_approved_at: null,
          // Clear discount data
          discount_percentage: null,
          offered_for_discount_at: null,
        })
        .eq('id', pttId)
        .select()
        .single();

      if (updateError) {
        console.error('Error rejecting discount offer:', updateError);
        return NextResponse.json(
          { error: 'Failed to reject discount offer' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Discount offer rejected',
        pttRequest: updatedPTT,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in discount offer processing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
