'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface PTTRequest {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  importer: {
    company_name: string;
  };
}

export default function ExporterDashboardPage() {
  const [pttRequests, setPttRequests] = useState<PTTRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    receivedPTTs: 0,
    pendingUploads: 0,
    availableForDiscount: 0,
    totalValue: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch PTT requests for this exporter
      const { data: requests, error } = await supabase
        .from('ptt_requests')
        .select('*')
        .eq('exporter_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching PTT requests:', error);
        setPttRequests([]);
        setLoading(false);
        return;
      }

      // Fetch importer details for each request
      if (requests && requests.length > 0) {
        const importerIds = requests.map(r => r.importer_id).filter(Boolean);
        const { data: importers } = await supabase
          .from('user_profiles')
          .select('user_id, company_name')
          .in('user_id', importerIds);

        // Map importer data to requests
        const requestsWithImporters = requests.map(request => ({
          ...request,
          importer: importers?.find(imp => imp.user_id === request.importer_id) || { company_name: 'Unknown' }
        }));

        setPttRequests(requestsWithImporters);
      } else {
        setPttRequests([]);
      }

      // Calculate stats
      const receivedPTTs = requests?.length || 0;
      const pendingUploads = requests?.filter(r => r.status === 'pending').length || 0;
      const availableForDiscount = requests?.filter(r => r.status === 'approved').length || 0;
      const totalValue = requests?.reduce((sum, r) => sum + parseFloat(r.amount.toString()), 0) || 0;

      setStats({
        receivedPTTs,
        pendingUploads,
        availableForDiscount,
        totalValue,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Received PTTs</h3>
          <p className="text-4xl font-bold text-purple-600 mb-1">
            {stats.receivedPTTs}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Pending Uploads</h3>
          <p className="text-4xl font-bold text-orange-600 mb-1">
            {stats.pendingUploads}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Available for Discount</h3>
          <p className="text-4xl font-bold text-green-600 mb-1">
            {stats.availableForDiscount}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Value</h3>
          <p className="text-4xl font-bold text-blue-600 mb-1">
            ${stats.totalValue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Received PTTs Section */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Received PTTs</h2>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        ) : pttRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-gray-500 text-center">No PTTs received yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Importer
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pttRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(request.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.importer.company_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.currency} {parseFloat(request.amount.toString()).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          request.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : request.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button className="text-orange-600 hover:text-orange-800 font-medium">
                        View Details
                      </button>
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
