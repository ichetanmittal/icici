import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pttId, userId, documents } = body;

    if (!pttId || !userId || !documents || documents.length === 0) {
      return NextResponse.json(
        { error: 'PTT ID, User ID, and documents are required' },
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
        { error: 'Only the exporter can upload documents for this PTT' },
        { status: 403 }
      );
    }

    // Validate current status
    if (pttRequest.status !== 'transferred') {
      return NextResponse.json(
        { error: 'Documents can only be uploaded for transferred PTTs' },
        { status: 400 }
      );
    }

    // Extract document names and URLs from the documents array
    const documentNames = documents.map((doc: any) => doc.name);
    const documentUrls = documents.map((doc: any) => doc.url);

    // Update PTT with uploaded documents
    const { data: updatedPTT, error: updateError } = await supabase
      .from('ptt_requests')
      .update({
        status: 'documents_uploaded',
        document_names: documentNames,
        document_urls: documentUrls,
        documents_uploaded_at: new Date().toISOString(),
      })
      .eq('id', pttId)
      .select()
      .single();

    if (updateError) {
      console.error('Error uploading documents:', updateError);
      return NextResponse.json(
        { error: 'Failed to upload documents' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Documents uploaded successfully',
      pttRequest: updatedPTT,
    });
  } catch (error) {
    console.error('Error in document upload:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
