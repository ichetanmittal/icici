import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { memberId, memberType, creditLimit } = await request.json();

    if (!memberId || !memberType || creditLimit === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = supabaseServer;

    // Update based on member type
    if (memberType === 'Exporter') {
      // Try updating user_profiles first (for active exporters)
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ credit_limit: creditLimit })
        .eq('id', memberId);

      if (profileError) {
        // If not in user_profiles, try invitations table (for pending invitations)
        const { error: invitationError } = await supabase
          .from('invitations')
          .update({ credit_limit: creditLimit })
          .eq('id', memberId);

        if (invitationError) {
          console.error('Error updating credit limit:', invitationError);
          return NextResponse.json(
            { error: 'Failed to update credit limit' },
            { status: 500 }
          );
        }
      }
    } else if (memberType === 'Bank') {
      // For bank POCs, update credit_limit in user_profiles
      const { error } = await supabase
        .from('user_profiles')
        .update({ credit_limit: creditLimit })
        .eq('id', memberId);

      if (error) {
        console.error('Error updating bank credit limit:', error);
        return NextResponse.json(
          { error: 'Failed to update bank credit limit' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in funder update-credit-limit API:', error);
    return NextResponse.json(
      { error: 'Failed to update credit limit' },
      { status: 500 }
    );
  }
}
