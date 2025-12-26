'use client';

import { useEffect, useState } from 'react';
import { getCurrentUser, getUserProfile } from '@/lib/auth';
import StatCard from '@/components/StatCard';

interface PTTRequest {
  id: string;
  ptt_number: string;
  amount: number;
  currency: string;
  maturity_days: number;
  incoterms: string;
  status: string;
  created_at: string;
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

export default function BankDashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [userId, setUserId] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');
  const [pttRequests, setPttRequests] = useState<PTTRequest[]>([]);
  const [issuedPTTs, setIssuedPTTs] = useState<PTTRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);

  const loadData = async () => {
    const { user } = await getCurrentUser();
    if (user) {
      setUserId(user.id);
      const { data: profileData } = await getUserProfile(user.id);
      setProfile(profileData);
      setUserRole(profileData?.role || '');

      // Fetch PTT requests based on user role
      try {
        let statusFilter = 'pending';
        // If checker, show maker-approved PTTs
        if (profileData?.role === 'dbs_bank_checker') {
          statusFilter = 'maker_approved';
        }

        const response = await fetch(`/api/ptt-requests?status=${statusFilter}&importerBank=DBS Bank`);
        const data = await response.json();
        if (data.requests) {
          setPttRequests(data.requests);
        }

        // Fetch issued PTTs for stats
        const issuedResponse = await fetch(`/api/ptt-requests?status=issued&importerBank=DBS Bank`);
        const issuedData = await issuedResponse.json();
        if (issuedData.requests) {
          setIssuedPTTs(issuedData.requests);
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

    const action = userRole === 'dbs_bank_maker' ? 'maker_approve' : 'checker_approve';
    const confirmMessage = userRole === 'dbs_bank_maker'
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  const treasuryBalance = profile?.current_balance || 0;
  const pendingRequests = pttRequests.length;
  const issuedPTTsCount = issuedPTTs.length;
  const totalExposure = issuedPTTs.reduce((sum, ptt) => sum + parseFloat(ptt.amount.toString()), 0);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isMaker = userRole === 'dbs_bank_maker';
  const isChecker = userRole === 'dbs_bank_checker';

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard
          title="Treasury Balance"
          value={`$${treasuryBalance.toLocaleString()}`}
          subtitle="Available funds"
          color="green"
        />
        <StatCard
          title={isMaker ? "Pending Approvals" : isChecker ? "Ready for Issue" : "Pending Requests"}
          value={pendingRequests}
          color="orange"
        />
        <StatCard
          title="Issued PTTs"
          value={issuedPTTsCount}
          color="purple"
        />
        <StatCard
          title="Total Exposure"
          value={`$${totalExposure.toLocaleString()}`}
          color="blue"
        />
        <StatCard
          title="Pending Settlements"
          value={issuedPTTsCount}
          subtitle="Awaiting maturity"
          color="orange"
        />
      </div>

      <div className="rounded-lg bg-white p-8 shadow-md border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {isMaker && "PTT Requests for Maker Approval"}
            {isChecker && "PTT Requests for Checker Approval"}
            {!isMaker && !isChecker && "Pending PTT Requests"}
          </h2>
          {isMaker && (
            <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
              Maker Review
            </span>
          )}
          {isChecker && (
            <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
              Checker Final Approval
            </span>
          )}
        </div>

        {pttRequests.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <p className="text-gray-500 mb-2">
                {isMaker && "No pending requests for maker approval"}
                {isChecker && "No PTTs waiting for checker approval"}
                {!isMaker && !isChecker && "No pending requests"}
              </p>
              <p className="text-sm text-gray-400">
                {isMaker && "Requests will appear here once importers submit them"}
                {isChecker && "PTTs will appear here after maker approval"}
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
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Incoterms
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pttRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono font-bold text-blue-600">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.incoterms}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {(isMaker || isChecker) && (
                        <button
                          onClick={() => handleApprove(request.id)}
                          disabled={approving === request.id}
                          className={`px-4 py-2 rounded-md font-medium transition-colors ${
                            isMaker
                              ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400'
                              : 'bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400'
                          } disabled:cursor-not-allowed`}
                        >
                          {approving === request.id ? 'Processing...' : (
                            isMaker ? 'Approve' : 'Issue PTT'
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
