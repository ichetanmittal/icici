'use client';

import { useEffect, useState } from 'react';
import { getCurrentUser, getUserProfile } from '@/lib/auth';
import { UserRole } from '@/types/user';
import { createClient } from '@/lib/supabase';

interface PTTRequest {
  id: string;
  ptt_number: string;
  amount: number;
  currency: string;
  maturity_date: string;
  discount_percentage: number;
  status: string;
  discounted_at: string;
  settlement_maker_approved_at: string | null;
  exporter: {
    company_name: string;
    contact_person: string;
  } | null;
  importer: {
    company_name: string;
    contact_person: string;
  } | null;
}

export default function SettlementsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Settlement Approvals
  const [pendingSettlements, setPendingSettlements] = useState<PTTRequest[]>([]);
  const [makerApprovedSettlements, setMakerApprovedSettlements] = useState<PTTRequest[]>([]);

  const [settling, setSettling] = useState<string | null>(null);

  const loadData = async () => {
    const { user } = await getCurrentUser();
    if (user) {
      setUserId(user.id);
      const { data } = await getUserProfile(user.id);
      setProfile(data);

      const supabase = createClient();

      try {
        // For makers, fetch both discounted (ready for settlement) and settlement_maker_approved PTTs
        if (data?.role === UserRole.DBS_BANK_MAKER) {
          // PTTs ready for settlement: discounted and past maturity
          const { data: maturedPTTs } = await supabase
            .from('ptt_requests')
            .select(`
              *,
              importer:user_profiles!ptt_requests_importer_id_fkey(company_name, contact_person),
              exporter:user_profiles!ptt_requests_exporter_id_fkey(company_name, contact_person)
            `)
            .eq('status', 'discounted')
            .lt('maturity_date', new Date().toISOString())
            .order('maturity_date', { ascending: true });

          if (maturedPTTs) setPendingSettlements(maturedPTTs);

          // PTTs awaiting checker approval
          const { data: makerApproved } = await supabase
            .from('ptt_requests')
            .select(`
              *,
              importer:user_profiles!ptt_requests_importer_id_fkey(company_name, contact_person),
              exporter:user_profiles!ptt_requests_exporter_id_fkey(company_name, contact_person)
            `)
            .eq('status', 'settlement_maker_approved')
            .order('settlement_maker_approved_at', { ascending: false });

          if (makerApproved) setMakerApprovedSettlements(makerApproved);
        }

        // For checkers, only fetch settlement_maker_approved PTTs
        if (data?.role === UserRole.DBS_BANK_CHECKER) {
          const { data: makerApproved } = await supabase
            .from('ptt_requests')
            .select(`
              *,
              importer:user_profiles!ptt_requests_importer_id_fkey(company_name, contact_person),
              exporter:user_profiles!ptt_requests_exporter_id_fkey(company_name, contact_person)
            `)
            .eq('status', 'settlement_maker_approved')
            .order('settlement_maker_approved_at', { ascending: false });

          if (makerApproved) setPendingSettlements(makerApproved);
        }
      } catch (error) {
        console.error('Error fetching settlements:', error);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveSettlement = async (pttId: string) => {
    if (!userId) return;

    const action = profile?.role === UserRole.DBS_BANK_MAKER ? 'maker_approve' : 'checker_approve';
    const confirmMessage = profile?.role === UserRole.DBS_BANK_MAKER
      ? 'Are you sure you want to approve this settlement as Maker?'
      : 'Are you sure you want to finalize this settlement as Checker? This will complete the PTT lifecycle.';

    if (!confirm(confirmMessage)) return;

    setSettling(pttId);

    try {
      const response = await fetch('/api/ptt-requests/settle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pttId,
          userId,
          action,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve settlement');
      }

      alert(data.message);
      await loadData();
    } catch (error) {
      console.error('Error approving settlement:', error);
      alert(error instanceof Error ? error.message : 'Failed to approve settlement');
    } finally {
      setSettling(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysPastMaturity = (maturityDate: string) => {
    const days = Math.floor((new Date().getTime() - new Date(maturityDate).getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const isMaker = profile?.role === UserRole.DBS_BANK_MAKER;
  const isChecker = profile?.role === UserRole.DBS_BANK_CHECKER;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-600">Loading settlements...</p>
        </div>
      </div>
    );
  }

  const renderSettlementsTable = (requests: PTTRequest[], title: string, actionable: boolean, statusBadge?: string) => (
    <div className="rounded-lg bg-white p-8 shadow-md border border-gray-200 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{requests.length} PTT{requests.length !== 1 ? 's' : ''}</span>
          {statusBadge && (
            <span className="text-sm bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-medium">
              {statusBadge}
            </span>
          )}
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <p className="text-gray-500 mb-2">No settlements pending</p>
            <p className="text-sm text-gray-400">
              {actionable ? 'Matured PTTs will appear here when they need settlement' : 'No settlements in this status'}
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PTT Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exporter</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Settlement Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Maturity Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Overdue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchase Price</th>
                {actionable && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((request) => {
                const purchasePrice = request.amount * (1 - request.discount_percentage / 100);
                const daysOverdue = getDaysPastMaturity(request.maturity_date);

                return (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono font-bold text-orange-600">{request.ptt_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {request.exporter ? (
                        <>
                          <div className="text-sm font-medium text-gray-900">{request.exporter.company_name}</div>
                          <div className="text-sm text-gray-500">{request.exporter.contact_person}</div>
                        </>
                      ) : (
                        <span className="text-sm text-gray-400">Not specified</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-green-600">
                        {request.currency} {request.amount.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">Full maturity value</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(request.maturity_date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {daysOverdue > 0 ? (
                        <span className="text-sm font-bold text-red-600">{daysOverdue} days</span>
                      ) : (
                        <span className="text-sm text-green-600">Due today</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {request.currency} {purchasePrice.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">{request.discount_percentage}% discount</div>
                    </td>
                    {actionable && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleApproveSettlement(request.id)}
                          disabled={settling === request.id}
                          className={`px-4 py-2 rounded-md font-medium transition-colors ${
                            isMaker
                              ? 'bg-orange-600 text-white hover:bg-orange-700 disabled:bg-gray-400'
                              : 'bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400'
                          } disabled:cursor-not-allowed`}
                        >
                          {settling === request.id ? 'Processing...' : (
                            isMaker ? 'Approve Settlement' : 'Finalize Settlement'
                          )}
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settlement Management</h1>
        <span className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium">
          {isMaker ? 'Maker' : isChecker ? 'Checker' : 'View Only'}
        </span>
      </div>

      {isMaker && (
        <>
          {renderSettlementsTable(pendingSettlements, 'PTTs Ready for Settlement', true, 'Action Required')}
          {renderSettlementsTable(makerApprovedSettlements, 'Awaiting Checker Approval', false, 'Checker Approval Pending')}
        </>
      )}

      {isChecker && (
        <>
          {renderSettlementsTable(pendingSettlements, 'Pending Final Settlement Approval', true, 'Final Approval Required')}
        </>
      )}

      {!isMaker && !isChecker && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
              i
            </div>
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Note:</span> You need DBS Bank Maker or Checker role to manage settlements.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
