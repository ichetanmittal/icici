import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = supabaseServer;

    // Get pending invitations for importers (invited by DBS Bank)
    const { data: pendingInvitations, error: invitationsError } = await supabase
      .from('invitations')
      .select('*')
      .eq('status', 'pending')
      .eq('invited_role', 'importer');

    if (invitationsError) {
      console.error('Error fetching invitations:', invitationsError);
    }

    // Get active importers from user_profiles (only those banking with DBS Bank)
    const { data: activeImporters, error: importersError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('role', 'importer')
      .eq('bank_name', 'DBS Bank');

    if (importersError) {
      console.error('Error fetching importers:', importersError);
    }

    // Fetch emails for active importers from auth.users
    let importerEmails: { [key: string]: string } = {};
    if (activeImporters && activeImporters.length > 0) {
      const userIds = activeImporters.map(i => i.user_id);
      const { data: authUsers } = await supabase.auth.admin.listUsers();

      if (authUsers?.users) {
        authUsers.users.forEach(user => {
          importerEmails[user.id] = user.email || '';
        });
      }
    }

    // Get funder banks (Gift IBU Maker and Checker)
    const { data: funderBanks, error: fundersError } = await supabase
      .from('user_profiles')
      .select('*')
      .in('role', ['gift_ibu_maker', 'gift_ibu_checker']);

    if (fundersError) {
      console.error('Error fetching funder banks:', fundersError);
    }

    // Fetch emails for funders from auth.users
    let funderEmails: { [key: string]: string } = {};
    if (funderBanks && funderBanks.length > 0) {
      const { data: authUsers } = await supabase.auth.admin.listUsers();

      if (authUsers?.users) {
        authUsers.users.forEach(user => {
          funderEmails[user.id] = user.email || '';
        });
      }
    }

    // Combine and format all network members
    const members = [];

    // Add pending invitations
    if (pendingInvitations) {
      for (const invitation of pendingInvitations) {
        members.push({
          id: invitation.id,
          name: invitation.entity_name,
          type: 'Importer',
          geography: invitation.geography || 'N/A',
          creditLimit: invitation.credit_limit,
          status: 'pending',
          pocName: invitation.poc_name,
          pocEmail: invitation.poc_email,
          pocPhone: invitation.poc_phone,
          bankAccountNumber: invitation.bank_account_number,
          swiftCode: invitation.swift_code,
        });
      }
    }

    // Add active importers
    if (activeImporters) {
      for (const importer of activeImporters) {
        members.push({
          id: importer.id,
          name: importer.company_name,
          type: 'Importer',
          geography: importer.geography || 'N/A',
          creditLimit: importer.credit_limit,
          status: 'active',
          pocName: importer.contact_person,
          pocEmail: importerEmails[importer.user_id] || 'N/A',
          pocPhone: importer.phone_number,
          bankAccountNumber: importer.bank_account_number,
          swiftCode: importer.swift_code,
        });
      }
    }

    // Add funder banks
    if (funderBanks) {
      for (const funder of funderBanks) {
        members.push({
          id: funder.id,
          name: funder.company_name,
          type: 'Funder Bank',
          geography: funder.geography || 'Global',
          creditLimit: funder.treasury_balance, // Using treasury balance as their fund capacity
          status: 'active',
          pocName: funder.contact_person,
          pocEmail: funderEmails[funder.user_id] || 'N/A',
          pocPhone: funder.phone_number,
          bankAccountNumber: funder.bank_account_number,
          swiftCode: funder.swift_code,
        });
      }
    }

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Error in network API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch network members' },
      { status: 500 }
    );
  }
}
