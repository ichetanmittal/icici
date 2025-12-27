import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

// GET - Fetch all blacklist entries
export async function GET() {
  try {
    const supabase = supabaseServer;

    const { data: blacklist, error } = await supabase
      .from('blacklist')
      .select('*')
      .order('added_at', { ascending: false });

    if (error) {
      console.error('Error fetching blacklist:', error);
      return NextResponse.json(
        { error: 'Failed to fetch blacklist' },
        { status: 500 }
      );
    }

    return NextResponse.json({ blacklist });
  } catch (error) {
    console.error('Error in blacklist GET API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blacklist' },
      { status: 500 }
    );
  }
}

// POST - Add entity to blacklist
export async function POST(request: NextRequest) {
  try {
    const { entityId, entityName, entityType, reason } = await request.json();

    if (!entityId || !entityName || !entityType || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = supabaseServer;

    // Check if entity is already blacklisted
    const { data: existing } = await supabase
      .from('blacklist')
      .select('id')
      .eq('entity_id', entityId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Entity is already blacklisted' },
        { status: 400 }
      );
    }

    // Add to blacklist
    const { error } = await supabase
      .from('blacklist')
      .insert({
        entity_id: entityId,
        entity_name: entityName,
        entity_type: entityType,
        reason: reason,
      });

    if (error) {
      console.error('Error adding to blacklist:', error);
      return NextResponse.json(
        { error: 'Failed to add to blacklist' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in blacklist POST API:', error);
    return NextResponse.json(
      { error: 'Failed to add to blacklist' },
      { status: 500 }
    );
  }
}

// DELETE - Remove entity from blacklist
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Missing blacklist entry ID' },
        { status: 400 }
      );
    }

    const supabase = supabaseServer;

    const { error } = await supabase
      .from('blacklist')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error removing from blacklist:', error);
      return NextResponse.json(
        { error: 'Failed to remove from blacklist' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in blacklist DELETE API:', error);
    return NextResponse.json(
      { error: 'Failed to remove from blacklist' },
      { status: 500 }
    );
  }
}
