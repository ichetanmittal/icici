import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');

    if (!type) {
      return NextResponse.json(
        { error: 'Entity type is required' },
        { status: 400 }
      );
    }

    const supabase = supabaseServer;
    let entities: Array<{ id: string; name: string; type: string }> = [];

    // Get already blacklisted entity IDs to exclude them
    const { data: blacklisted } = await supabase
      .from('blacklist')
      .select('entity_id');

    const blacklistedIds = blacklisted?.map(b => b.entity_id) || [];

    if (type === 'Exporter') {
      const { data: exporters, error } = await supabase
        .from('user_profiles')
        .select('id, company_name')
        .eq('role', 'exporter')
        .not('id', 'in', `(${blacklistedIds.join(',')})`);

      if (error) {
        console.error('Error fetching exporters:', error);
      } else if (exporters) {
        entities = exporters.map(e => ({
          id: e.id,
          name: e.company_name,
          type: 'Exporter',
        }));
      }
    } else if (type === 'Importer') {
      const { data: importers, error } = await supabase
        .from('user_profiles')
        .select('id, company_name')
        .eq('role', 'importer')
        .not('id', 'in', `(${blacklistedIds.join(',')})`);

      if (error) {
        console.error('Error fetching importers:', error);
      } else if (importers) {
        entities = importers.map(i => ({
          id: i.id,
          name: i.company_name,
          type: 'Importer',
        }));
      }
    } else if (type === 'Funder') {
      const { data: funders, error } = await supabase
        .from('user_profiles')
        .select('id, company_name')
        .in('role', ['gift_ibu_maker', 'gift_ibu_checker'])
        .not('id', 'in', `(${blacklistedIds.join(',')})`);

      if (error) {
        console.error('Error fetching funders:', error);
      } else if (funders) {
        entities = funders.map(f => ({
          id: f.id,
          name: f.company_name || 'ICICI Gift IBU',
          type: 'Funder',
        }));
      }
    }

    return NextResponse.json({ entities });
  } catch (error) {
    console.error('Error in available-entities API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entities' },
      { status: 500 }
    );
  }
}
