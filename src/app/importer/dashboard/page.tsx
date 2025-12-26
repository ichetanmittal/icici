'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

interface CreditStatus {
  creditLimit: number;
  tokensIssued: number;
  availableCredit: number;
  utilization: number;
}

interface DashboardStats {
  activePTTs: number;
  pendingApprovals: number;
  totalValue: number;
  settled: number;
}

export default function ImporterDashboard() {
  const router = useRouter();
  const [creditStatus, setCreditStatus] = useState<CreditStatus>({
    creditLimit: 0,
    tokensIssued: 0,
    availableCredit: 0,
    utilization: 0,
  });
  const [stats, setStats] = useState<DashboardStats>({
    activePTTs: 0,
    pendingApprovals: 0,
    totalValue: 0,
    settled: 0,
  });

  const [pttRequests, setPttRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Fetch user profile to get credit limit
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('credit_limit, account_balance')
        .eq('user_id', user.id)
        .single();

      // Fetch PTT requests for this importer
      const { data: requests } = await supabase
        .from('ptt_requests')
        .select('*')
        .eq('importer_id', user.id)
        .order('created_at', { ascending: false });

      setPttRequests(requests || []);

      // Calculate stats from actual PTT requests
      const activePTTs = requests?.filter(r =>
        r.status === 'maker_approved' ||
        r.status === 'issued' ||
        r.status === 'transferred' ||
        r.status === 'documents_uploaded' ||
        r.status === 'documents_approved' ||
        r.status === 'offered_for_discount' ||
        r.status === 'discounted'
      ).length || 0;
      const pendingApprovals = requests?.filter(r => r.status === 'pending' || r.status === 'maker_approved').length || 0;
      const totalValue = requests?.reduce((sum, r) => sum + parseFloat(r.amount.toString()), 0) || 0;
      const settled = requests?.filter(r => r.status === 'settled').length || 0;
      const tokensIssued = requests?.filter(r =>
        r.status === 'issued' ||
        r.status === 'transferred' ||
        r.status === 'documents_uploaded' ||
        r.status === 'documents_approved' ||
        r.status === 'offered_for_discount' ||
        r.status === 'discounted'
      ).reduce((sum, r) => sum + parseFloat(r.amount.toString()), 0) || 0;

      const creditLimit = profileData?.credit_limit || 0;
      const availableCredit = creditLimit - tokensIssued;
      const utilization = creditLimit > 0 ? (tokensIssued / creditLimit) * 100 : 0;

      setCreditStatus({
        creditLimit,
        tokensIssued,
        availableCredit,
        utilization,
      });

      setStats({
        activePTTs,
        pendingApprovals,
        totalValue,
        settled,
      });

      setLoading(false);
    };

    loadDashboardData();
  }, [router]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <button
          onClick={() => router.push('/importer/request-ptt')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Request PTT
        </button>
      </div>

      {/* Credit Status */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Credit Status</h2>
        <p className="text-sm text-gray-600 mb-6">Your approved credit facility</p>

        <div className="grid grid-cols-4 gap-8">
          <div>
            <h3 className="text-sm text-gray-600 mb-2">Credit Limit</h3>
            <p className="text-2xl font-bold text-gray-900">
              ${creditStatus.creditLimit.toLocaleString()}
            </p>
          </div>
          <div>
            <h3 className="text-sm text-gray-600 mb-2">Tokens Issued</h3>
            <p className="text-2xl font-bold text-gray-900">
              ${creditStatus.tokensIssued.toLocaleString()}
            </p>
          </div>
          <div>
            <h3 className="text-sm text-gray-600 mb-2">Available Credit</h3>
            <p className="text-2xl font-bold text-green-600">
              ${creditStatus.availableCredit.toLocaleString()}
            </p>
          </div>
          <div>
            <h3 className="text-sm text-gray-600 mb-2">Utilization</h3>
            <p className="text-2xl font-bold text-gray-900">
              {creditStatus.utilization.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-medium text-gray-600">Active PTTs</h3>
            <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-blue-600">{stats.activePTTs}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Pending Approvals</h3>
          <p className="text-3xl font-bold text-orange-600">{stats.pendingApprovals}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Value</h3>
          <p className="text-3xl font-bold text-green-600">
            ${stats.totalValue.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Settled</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.settled}</p>
        </div>
      </div>

      {/* My PTTs */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-lg font-bold text-gray-900">My PTTs</h2>
          <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-sm text-gray-600">Loading PTT requests...</p>
          </div>
        ) : pttRequests.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-600 mb-6">
              No PTTs found. Request a new PTT to get started.
            </p>
            <button
              onClick={() => router.push('/importer/request-ptt')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Request PTT
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PTT Number
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Maturity
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Incoterms
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pttRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => router.push(`/importer/ptt/${request.id}`)}
                        className="text-sm font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        {request.ptt_number}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(request.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.currency} {parseFloat(request.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.maturity_days} days
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.incoterms}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          request.status === 'issued'
                            ? 'bg-green-100 text-green-800'
                            : request.status === 'maker_approved'
                            ? 'bg-blue-100 text-blue-800'
                            : request.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : request.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : request.status === 'settled'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {request.status === 'maker_approved' ? 'Maker Approved' :
                         request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
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
