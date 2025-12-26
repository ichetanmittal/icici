import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pttId, userId } = body;

    if (!pttId || !userId) {
      return NextResponse.json(
        { error: 'PTT ID and User ID are required' },
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

    // Validate user is the importer
    if (pttRequest.importer_id !== userId) {
      return NextResponse.json(
        { error: 'Only the importer can transfer this PTT' },
        { status: 403 }
      );
    }

    // Validate current status
    if (pttRequest.status !== 'issued') {
      return NextResponse.json(
        { error: 'Only issued PTTs can be transferred' },
        { status: 400 }
      );
    }

    // Validate exporter is specified
    if (!pttRequest.exporter_id) {
      return NextResponse.json(
        { error: 'PTT must have an exporter specified before transfer' },
        { status: 400 }
      );
    }

    // Update to transferred
    const { data: updatedPTT, error: updateError } = await supabase
      .from('ptt_requests')
      .update({
        status: 'transferred',
        transferred_by: userId,
        transferred_at: new Date().toISOString(),
      })
      .eq('id', pttId)
      .select()
      .single();

    if (updateError) {
      console.error('Error transferring PTT:', updateError);
      return NextResponse.json(
        { error: 'Failed to transfer PTT' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'PTT transferred successfully to exporter',
      pttRequest: updatedPTT,
    });
  } catch (error) {
    console.error('Error in PTT transfer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
