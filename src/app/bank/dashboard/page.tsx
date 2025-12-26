'use client';

import { useEffect, useState } from 'react';
import { getCurrentUser, getUserProfile } from '@/lib/auth';
import StatCard from '@/components/StatCard';

interface PTTRequest {
  id: string;
  amount: number;
  currency: string;
  maturity_days: number;
  incoterms: string;
  status: string;
  created_at: string;
  importer: {
    company_name: string;
    contact_person: string;
    email: string;
    phone_number: string;
  };
  exporter: {
    company_name: string;
    contact_person: string;
    email: string;
  } | null;
}

export default function BankDashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [pttRequests, setPttRequests] = useState<PTTRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const { user } = await getCurrentUser();
      if (user) {
        const { data: profileData } = await getUserProfile(user.id);
        setProfile(profileData);

        // Fetch pending PTT requests for DBS Bank
        try {
          const response = await fetch('/api/ptt-requests?status=pending&importerBank=DBS Bank');
          const data = await response.json();
          if (data.requests) {
            setPttRequests(data.requests);
          }
        } catch (error) {
          console.error('Error fetching PTT requests:', error);
        }
      }
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  const treasuryBalance = profile?.current_balance || 0;
  const pendingRequests = pttRequests.length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

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
          title="Pending Requests"
          value={pendingRequests}
          color="orange"
        />
        <StatCard
          title="Issued PTTs"
          value={0}
          color="purple"
        />
        <StatCard
          title="Total Exposure"
          value="$0"
          color="blue"
        />
        <StatCard
          title="Pending Settlements"
          value={0}
          color="orange"
        />
      </div>

      <div className="rounded-lg bg-white p-8 shadow-md border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Pending PTT Requests</h2>

        {pttRequests.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-gray-500">No pending requests</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
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
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pttRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-4">
                        Review
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
