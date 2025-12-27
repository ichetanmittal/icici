import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = supabaseServer;

    // Get pending invitations for exporters
    const { data: pendingInvitations, error: invitationsError } = await supabase
      .from('invitations')
      .select('*')
      .eq('status', 'pending')
      .eq('invited_role', 'exporter');

    if (invitationsError) {
      console.error('Error fetching invitations:', invitationsError);
    }

    // Get active exporters from user_profiles (only those banking with ICICI Gift IBU)
    const { data: activeExporters, error: exportersError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('role', 'exporter')
      .eq('bank_name', 'ICICI Gift IBU');

    if (exportersError) {
      console.error('Error fetching exporters:', exportersError);
    }

    // Get bank POCs (DBS Bank Makers) for inter-bank communication
    const { data: bankPOCs, error: banksError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('role', 'dbs_bank_maker');

    if (banksError) {
      console.error('Error fetching bank POCs:', banksError);
    }

    // Fetch emails from auth.users
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    let userEmails: { [key: string]: string } = {};
    if (authUsers?.users) {
      authUsers.users.forEach(user => {
        userEmails[user.id] = user.email || '';
      });
    }

    // Combine and format all network members
    const members = [];

    // Add pending invitations
    if (pendingInvitations) {
      for (const invitation of pendingInvitations) {
        members.push({
          id: invitation.id,
          name: invitation.entity_name,
          type: 'Exporter',
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

    // Add active exporters
    if (activeExporters) {
      for (const exporter of activeExporters) {
        members.push({
          id: exporter.id,
          name: exporter.company_name,
          type: 'Exporter',
          geography: exporter.geography || 'N/A',
          creditLimit: exporter.credit_limit,
          status: 'active',
          pocName: exporter.contact_person,
          pocEmail: userEmails[exporter.user_id] || 'N/A',
          pocPhone: exporter.phone_number,
          bankAccountNumber: exporter.bank_account_number,
          swiftCode: exporter.swift_code,
        });
      }
    }

    // Add bank POCs (DBS Bank Makers)
    if (bankPOCs) {
      for (const bank of bankPOCs) {
        members.push({
          id: bank.id,
          name: bank.company_name || 'DBS Bank',
          type: 'Bank',
          geography: bank.geography || 'Singapore',
          creditLimit: bank.credit_limit, // Credit limit for inter-bank transactions
          status: 'active',
          pocName: bank.contact_person,
          pocEmail: userEmails[bank.user_id] || 'N/A',
          pocPhone: bank.phone_number,
          bankAccountNumber: bank.bank_account_number,
          swiftCode: bank.swift_code,
        });
      }
    }

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Error in funder network API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch network members' },
      { status: 500 }
    );
  }
}
