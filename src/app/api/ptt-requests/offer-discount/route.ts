import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pttId, userId, discountPercentage } = body;

    if (!pttId || !userId || discountPercentage === undefined) {
      return NextResponse.json(
        { error: 'PTT ID, User ID, and discount percentage are required' },
        { status: 400 }
      );
    }

    // Validate discount percentage
    const discount = parseFloat(discountPercentage);
    if (isNaN(discount) || discount <= 0 || discount > 100) {
      return NextResponse.json(
        { error: 'Discount percentage must be between 0 and 100' },
        { status: 400 }
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

    // Validate user is the exporter
    if (pttRequest.exporter_id !== userId) {
      return NextResponse.json(
        { error: 'Only the exporter can offer this PTT for discount' },
        { status: 403 }
      );
    }

    // Validate current status
    if (pttRequest.status !== 'documents_approved') {
      return NextResponse.json(
        { error: 'Only PTTs with approved documents can be offered for discount' },
        { status: 400 }
      );
    }

    // Update PTT with discount offer
    const { data: updatedPTT, error: updateError } = await supabase
      .from('ptt_requests')
      .update({
        status: 'offered_for_discount',
        discount_percentage: discount,
        offered_for_discount_at: new Date().toISOString(),
      })
      .eq('id', pttId)
      .select()
      .single();

    if (updateError) {
      console.error('Error offering PTT for discount:', updateError);
      return NextResponse.json(
        { error: 'Failed to offer PTT for discount' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'PTT offered for discount successfully',
      pttRequest: updatedPTT,
    });
  } catch (error) {
    console.error('Error in discount offer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
