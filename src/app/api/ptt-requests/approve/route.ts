import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pttId, userId, action } = body; // action: 'maker_approve' or 'checker_approve'

    if (!pttId || !userId || !action) {
      return NextResponse.json(
        { error: 'PTT ID, User ID, and action are required' },
        { status: 400 }
      );
    }

    // Get user profile to check role
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
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
      if (userProfile.role !== 'dbs_bank_maker' && userProfile.role !== 'gift_ibu_maker') {
        return NextResponse.json(
          { error: 'Only bank makers can perform this action' },
          { status: 403 }
        );
      }

      // Validate current status
      if (pttRequest.status !== 'pending') {
        return NextResponse.json(
          { error: 'PTT request must be in pending status' },
          { status: 400 }
        );
      }

      // Update to maker_approved
      const { data: updatedPTT, error: updateError } = await supabase
        .from('ptt_requests')
        .update({
          status: 'maker_approved',
          maker_approved_by: userId,
          maker_approved_at: new Date().toISOString(),
        })
        .eq('id', pttId)
        .select()
        .single();

      if (updateError) {
        console.error('Error approving PTT:', updateError);
        return NextResponse.json(
          { error: 'Failed to approve PTT request' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'PTT request approved by maker',
        pttRequest: updatedPTT,
      });
    }

    // Handle checker approval
    if (action === 'checker_approve') {
      // Validate user is a checker
      if (userProfile.role !== 'dbs_bank_checker' && userProfile.role !== 'gift_ibu_checker') {
        return NextResponse.json(
          { error: 'Only bank checkers can perform this action' },
          { status: 403 }
        );
      }

      // Validate current status
      if (pttRequest.status !== 'maker_approved') {
        return NextResponse.json(
          { error: 'PTT request must be approved by maker first' },
          { status: 400 }
        );
      }

      // Calculate maturity date
      const issueDate = new Date();
      const maturityDate = new Date(issueDate);
      maturityDate.setDate(maturityDate.getDate() + pttRequest.maturity_days);

      // Update to issued
      const { data: updatedPTT, error: updateError } = await supabase
        .from('ptt_requests')
        .update({
          status: 'issued',
          checker_approved_by: userId,
          checker_approved_at: new Date().toISOString(),
          issue_date: issueDate.toISOString(),
          maturity_date: maturityDate.toISOString(),
        })
        .eq('id', pttId)
        .select()
        .single();

      if (updateError) {
        console.error('Error issuing PTT:', updateError);
        return NextResponse.json(
          { error: 'Failed to issue PTT request' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'PTT request issued by checker',
        pttRequest: updatedPTT,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in PTT approval:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
