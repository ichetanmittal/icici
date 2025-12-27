import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pttId, userId, action } = body;

    if (!pttId || !userId || !action) {
      return NextResponse.json(
        { error: 'PTT ID, User ID, and action are required' },
        { status: 400 }
      );
    }

    if (!['maker_approve', 'checker_approve'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be "maker_approve" or "checker_approve"' },
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
      // Validate user is a DBS Bank maker
      if (userProfile.role !== 'dbs_bank_maker') {
        return NextResponse.json(
          { error: 'Only DBS Bank makers can perform this action' },
          { status: 403 }
        );
      }

      // Validate current status (must be discounted and past maturity)
      if (pttRequest.status !== 'discounted') {
        return NextResponse.json(
          { error: 'PTT must be in discounted status to settle' },
          { status: 400 }
        );
      }

      // Check if maturity date has passed
      const maturityDate = new Date(pttRequest.maturity_date);
      const today = new Date();
      if (maturityDate > today) {
        return NextResponse.json(
          { error: 'PTT has not reached maturity yet' },
          { status: 400 }
        );
      }

      // Update to settlement_maker_approved
      const { data: updatedPTT, error: updateError } = await supabase
        .from('ptt_requests')
        .update({
          status: 'settlement_maker_approved',
          settlement_maker_approved_by: userId,
          settlement_maker_approved_at: new Date().toISOString(),
        })
        .eq('id', pttId)
        .select()
        .single();

      if (updateError) {
        console.error('Error approving settlement:', updateError);
        return NextResponse.json(
          { error: 'Failed to approve settlement' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Settlement approved by maker. Awaiting checker approval.',
        pttRequest: updatedPTT,
      });
    }

    // Handle checker approval
    if (action === 'checker_approve') {
      // Validate user is a DBS Bank checker
      if (userProfile.role !== 'dbs_bank_checker') {
        return NextResponse.json(
          { error: 'Only DBS Bank checkers can perform this action' },
          { status: 403 }
        );
      }

      // Validate current status
      if (pttRequest.status !== 'settlement_maker_approved') {
        return NextResponse.json(
          { error: 'Settlement must be approved by maker first' },
          { status: 400 }
        );
      }

      // Update to settled (final status)
      const { data: updatedPTT, error: updateError } = await supabase
        .from('ptt_requests')
        .update({
          status: 'settled',
          settlement_checker_approved_by: userId,
          settlement_checker_approved_at: new Date().toISOString(),
          settled_at: new Date().toISOString(),
        })
        .eq('id', pttId)
        .select()
        .single();

      if (updateError) {
        console.error('Error finalizing settlement:', updateError);
        return NextResponse.json(
          { error: 'Failed to finalize settlement' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Settlement finalized by checker. PTT has been settled.',
        pttRequest: updatedPTT,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in settlement processing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
