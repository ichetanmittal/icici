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
  maturity_days: number;
  incoterms: string;
  status: string;
  created_at: string;
  maker_approved_at: string | null;
  discount_percentage: number | null;
  offered_for_discount_at: string | null;
  discount_maker_approved_at: string | null;
  importer: {
    company_name: string;
    contact_person: string;
    phone_number: string;
  };
  exporter: {
    company_name: string;
    contact_person: string;
  } | null;
}

export default function FunderApprovalsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Discount Offer Approvals (only relevant for funders)
  const [pendingDiscountOffers, setPendingDiscountOffers] = useState<PTTRequest[]>([]);
  const [makerApprovedDiscountOffers, setMakerApprovedDiscountOffers] = useState<PTTRequest[]>([]);

  const [approving, setApproving] = useState<string | null>(null);

  const loadData = async () => {
    const { user } = await getCurrentUser();
    if (user) {
      setUserId(user.id);
      const { data } = await getUserProfile(user.id);
      setProfile(data);

      const supabase = createClient();

      // Fetch discount offer approvals based on role
      try {
        // For makers, fetch both pending and maker_approved discount offers
        if (data?.role === UserRole.GIFT_IBU_MAKER) {
          // Discount Offers: offered_for_discount
          const { data: pendingOffers } = await supabase
            .from('ptt_requests')
            .select(`
              *,
              importer:user_profiles!ptt_requests_importer_id_fkey(company_name, contact_person, phone_number),
              exporter:user_profiles!ptt_requests_exporter_id_fkey(company_name, contact_person)
            `)
            .eq('status', 'offered_for_discount')
            .order('offered_for_discount_at', { ascending: false });

          if (pendingOffers) setPendingDiscountOffers(pendingOffers);

          // Discount Offers: discount_maker_approved (awaiting checker)
          const { data: makerApprovedOffers } = await supabase
            .from('ptt_requests')
            .select(`
              *,
              importer:user_profiles!ptt_requests_importer_id_fkey(company_name, contact_person, phone_number),
              exporter:user_profiles!ptt_requests_exporter_id_fkey(company_name, contact_person)
            `)
            .eq('status', 'discount_maker_approved')
            .order('discount_maker_approved_at', { ascending: false });

          if (makerApprovedOffers) setMakerApprovedDiscountOffers(makerApprovedOffers);
        }

        // For checkers, only fetch discount_maker_approved offers
        if (data?.role === UserRole.GIFT_IBU_CHECKER) {
          // Discount Offers: discount_maker_approved
          const { data: makerApprovedOffers } = await supabase
            .from('ptt_requests')
            .select(`
              *,
              importer:user_profiles!ptt_requests_importer_id_fkey(company_name, contact_person, phone_number),
              exporter:user_profiles!ptt_requests_exporter_id_fkey(company_name, contact_person)
            `)
            .eq('status', 'discount_maker_approved')
            .order('discount_maker_approved_at', { ascending: false });

          if (makerApprovedOffers) setPendingDiscountOffers(makerApprovedOffers);
        }
      } catch (error) {
        console.error('Error fetching approvals:', error);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveDiscountOffer = async (pttId: string) => {
    if (!userId) return;

    const action = profile?.role === UserRole.GIFT_IBU_MAKER ? 'maker_approve' : 'checker_approve';
    const confirmMessage = profile?.role === UserRole.GIFT_IBU_MAKER
      ? 'Are you sure you want to approve this discount offer as Maker?'
      : 'Are you sure you want to finalize this discount purchase as Checker?';

    if (!confirm(confirmMessage)) return;

    setApproving(pttId);

    try {
      const response = await fetch('/api/ptt-requests/accept-discount', {
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
        throw new Error(data.error || 'Failed to approve discount offer');
      }

      alert(data.message);
      await loadData();
    } catch (error) {
      console.error('Error approving discount offer:', error);
      alert(error instanceof Error ? error.message : 'Failed to approve discount offer');
    } finally {
      setApproving(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isMaker = profile?.role === UserRole.GIFT_IBU_MAKER;
  const isChecker = profile?.role === UserRole.GIFT_IBU_CHECKER;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-600">Loading approvals...</p>
        </div>
      </div>
    );
  }

  const renderDiscountOffersTable = (requests: PTTRequest[], title: string, actionable: boolean, statusBadge?: string) => (
    <div className="rounded-lg bg-white p-8 shadow-md border border-gray-200 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{requests.length} offer{requests.length !== 1 ? 's' : ''}</span>
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
            <p className="text-gray-500 mb-2">No discount offers</p>
            <p className="text-sm text-gray-400">
              {actionable ? 'Discount offers will appear here when they need your approval' : 'No offers in this status'}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount %</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchase Price</th>
                {actionable && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((request) => {
                const discountedAmount = request.amount * (1 - (request.discount_percentage || 0) / 100);
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
                      <div className="text-sm font-medium text-gray-900">
                        {request.currency} {request.amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-green-600">{request.discount_percentage}%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {request.currency} {discountedAmount.toLocaleString()}
                      </div>
                    </td>
                    {actionable && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleApproveDiscountOffer(request.id)}
                          disabled={approving === request.id}
                          className={`px-4 py-2 rounded-md font-medium transition-colors ${
                            isMaker
                              ? 'bg-orange-600 text-white hover:bg-orange-700 disabled:bg-gray-400'
                              : 'bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400'
                          } disabled:cursor-not-allowed`}
                        >
                          {approving === request.id ? 'Processing...' : (
                            isMaker ? 'Approve' : 'Accept & Purchase'
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
        <h1 className="text-3xl font-bold text-gray-900">Pending Approvals</h1>
        <span className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium">
          {isMaker ? 'Maker' : isChecker ? 'Checker' : 'View Only'}
        </span>
      </div>

      {isMaker && (
        <>
          {renderDiscountOffersTable(pendingDiscountOffers, 'Pending My Approval', true, 'Action Required')}
          {renderDiscountOffersTable(makerApprovedDiscountOffers, 'Awaiting Checker Approval', false, 'Checker Approval Pending')}
        </>
      )}

      {isChecker && (
        <>
          {renderDiscountOffersTable(pendingDiscountOffers, 'Pending My Approval', true, 'Final Approval Required')}
        </>
      )}

      {!isMaker && !isChecker && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
              i
            </div>
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Note:</span> You need Maker or Checker role to view pending approvals.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
