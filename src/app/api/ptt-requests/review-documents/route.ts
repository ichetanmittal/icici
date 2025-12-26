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

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "approve" or "reject"' },
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
        { error: 'Only the importer can review documents for this PTT' },
        { status: 403 }
      );
    }

    // Validate current status
    if (pttRequest.status !== 'documents_uploaded') {
      return NextResponse.json(
        { error: 'Only PTTs with uploaded documents can be reviewed' },
        { status: 400 }
      );
    }

    // Prepare update based on action
    let updateData: any = {};
    let message = '';

    if (action === 'approve') {
      updateData = {
        status: 'documents_approved',
        documents_approved_at: new Date().toISOString(),
      };
      message = 'Documents approved successfully';
    } else {
      // Reject - send back to transferred status
      updateData = {
        status: 'transferred',
        document_rejection_reason: rejectionReason || 'Documents rejected by importer',
        // Clear uploaded documents data
        document_names: null,
        document_urls: null,
        documents_uploaded_at: null,
      };
      message = 'Documents rejected';
    }

    // Update PTT
    const { data: updatedPTT, error: updateError } = await supabase
      .from('ptt_requests')
      .update(updateData)
      .eq('id', pttId)
      .select()
      .single();

    if (updateError) {
      console.error('Error reviewing documents:', updateError);
      return NextResponse.json(
        { error: 'Failed to review documents' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message,
      pttRequest: updatedPTT,
    });
  } catch (error) {
    console.error('Error in document review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
