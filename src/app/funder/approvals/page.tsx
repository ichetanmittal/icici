'use client';

import { useEffect, useState } from 'react';
import { getCurrentUser, getUserProfile } from '@/lib/auth';
import { UserRole } from '@/types/user';

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
  const [pendingRequests, setPendingRequests] = useState<PTTRequest[]>([]);
  const [makerApprovedRequests, setMakerApprovedRequests] = useState<PTTRequest[]>([]);
  const [approving, setApproving] = useState<string | null>(null);

  const loadData = async () => {
    const { user } = await getCurrentUser();
    if (user) {
      setUserId(user.id);
      const { data } = await getUserProfile(user.id);
      setProfile(data);

      // Fetch pending approvals based on role
      try {
        // For makers, fetch both pending and maker_approved
        if (data?.role === UserRole.GIFT_IBU_MAKER) {
          const pendingResponse = await fetch(`/api/ptt-requests?status=pending&exporterBank=ICICI Gift IBU`);
          const pendingData = await pendingResponse.json();
          if (pendingData.requests) {
            setPendingRequests(pendingData.requests);
          }

          const makerApprovedResponse = await fetch(`/api/ptt-requests?status=maker_approved&exporterBank=ICICI Gift IBU`);
          const makerApprovedData = await makerApprovedResponse.json();
          if (makerApprovedData.requests) {
            setMakerApprovedRequests(makerApprovedData.requests);
          }
        }

        // For checkers, only fetch maker_approved
        if (data?.role === UserRole.GIFT_IBU_CHECKER) {
          const makerApprovedResponse = await fetch(`/api/ptt-requests?status=maker_approved&exporterBank=ICICI Gift IBU`);
          const makerApprovedData = await makerApprovedResponse.json();
          if (makerApprovedData.requests) {
            setPendingRequests(makerApprovedData.requests);
          }
        }
      } catch (error) {
        console.error('Error fetching PTT requests:', error);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (pttId: string) => {
    if (!userId) return;

    const action = profile?.role === UserRole.GIFT_IBU_MAKER ? 'maker_approve' : 'checker_approve';
    const confirmMessage = profile?.role === UserRole.GIFT_IBU_MAKER
      ? 'Are you sure you want to approve this PTT request as Maker?'
      : 'Are you sure you want to issue this PTT as Checker? This is the final approval.';

    if (!confirm(confirmMessage)) return;

    setApproving(pttId);

    try {
      const response = await fetch('/api/ptt-requests/approve', {
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
        throw new Error(data.error || 'Failed to approve PTT');
      }

      alert(data.message);
      // Reload data
      await loadData();
    } catch (error) {
      console.error('Error approving PTT:', error);
      alert(error instanceof Error ? error.message : 'Failed to approve PTT');
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

  const renderPTTTable = (requests: PTTRequest[], title: string, actionable: boolean, statusBadge?: string) => (
    <div className="rounded-lg bg-white p-8 shadow-md border border-gray-200 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{requests.length} request{requests.length !== 1 ? 's' : ''}</span>
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
            <p className="text-gray-500 mb-2">No requests</p>
            <p className="text-sm text-gray-400">
              {actionable ? 'Requests will appear here when they need your approval' : 'No requests in this status'}
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PTT Number
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Request Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Importer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Exporter
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Maturity
                </th>
                {actionable && (
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono font-bold text-orange-600">
                      {request.ptt_number}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(request.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {request.importer.company_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {request.importer.contact_person}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {request.exporter ? (
                      <>
                        <div className="text-sm font-medium text-gray-900">
                          {request.exporter.company_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.exporter.contact_person}
                        </div>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.maturity_days} days
                  </td>
                  {actionable && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleApprove(request.id)}
                        disabled={approving === request.id}
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${
                          isMaker
                            ? 'bg-orange-600 text-white hover:bg-orange-700 disabled:bg-gray-400'
                            : 'bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400'
                        } disabled:cursor-not-allowed`}
                      >
                        {approving === request.id ? 'Processing...' : (
                          isMaker ? 'Approve' : 'Issue PTT'
                        )}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
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
          {renderPTTTable(pendingRequests, 'Pending My Approval', true, 'Action Required')}
          {renderPTTTable(makerApprovedRequests, 'Awaiting Checker Approval', false, 'Checker Approval Pending')}
        </>
      )}

      {isChecker && (
        <>
          {renderPTTTable(pendingRequests, 'Pending My Approval', true, 'Final Approval Required')}
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
