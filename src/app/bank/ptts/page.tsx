'use client';

import { useEffect, useState } from 'react';
import StatCard from '@/components/StatCard';

interface PTTRequest {
  id: string;
  ptt_number: string;
  amount: number;
  currency: string;
  maturity_days: number;
  issue_date: string;
  maturity_date: string;
  incoterms: string;
  status: string;
  created_at: string;
  discount_percentage?: number;
  discounted_at?: string;
  importer: {
    company_name: string;
    contact_person: string;
  };
  exporter: {
    company_name: string;
    contact_person: string;
  } | null;
}

export default function OutstandingPTTsPage() {
  const [issuedPTTs, setIssuedPTTs] = useState<PTTRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadIssuedPTTs = async () => {
      try {
        // Fetch both issued and discounted PTTs (outstanding until settled)
        const [issuedResponse, discountedResponse] = await Promise.all([
          fetch('/api/ptt-requests?status=issued&importerBank=DBS Bank'),
          fetch('/api/ptt-requests?status=discounted&importerBank=DBS Bank')
        ]);

        const issuedData = await issuedResponse.json();
        const discountedData = await discountedResponse.json();

        const allPTTs = [
          ...(issuedData.requests || []),
          ...(discountedData.requests || [])
        ];

        setIssuedPTTs(allPTTs);
      } catch (error) {
        console.error('Error fetching outstanding PTTs:', error);
      }
      setLoading(false);
    };

    loadIssuedPTTs();
  }, []);

  const totalOutstanding = issuedPTTs.length;
  const totalExposure = issuedPTTs.reduce((sum, ptt) => sum + parseFloat(ptt.amount.toString()), 0);
  const activePTTs = issuedPTTs.filter(ptt => {
    const maturityDate = new Date(ptt.maturity_date);
    return maturityDate > new Date();
  }).length;
  const discountedPTTs = issuedPTTs.filter(ptt => ptt.status === 'discounted').length;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysRemaining = (maturityDate: string) => {
    if (!maturityDate) return 'N/A';
    const today = new Date();
    const maturity = new Date(maturityDate);
    const diffTime = maturity.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `${diffDays} days` : 'Matured';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Outstanding PTTs</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Outstanding"
          value={totalOutstanding}
          subtitle="Issued + Discounted"
          color="blue"
        />
        <StatCard
          title="Discounted"
          value={discountedPTTs}
          subtitle="Purchased by funder"
          color="orange"
        />
        <StatCard
          title="Matured"
          value={totalOutstanding - activePTTs}
          subtitle="Awaiting settlement"
          color="orange"
        />
        <StatCard
          title="Total Exposure"
          value={`$${totalExposure.toLocaleString()}`}
          color="purple"
        />
      </div>

      <div className="rounded-lg bg-white p-8 shadow-md border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-6">All Outstanding PTTs</h2>

        {issuedPTTs.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <p className="text-gray-500 mb-2">No outstanding PTTs</p>
              <p className="text-sm text-gray-400">Issued PTTs will appear here</p>
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
                    Importer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Exporter
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issue Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Maturity Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days Remaining
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {issuedPTTs.map((ptt) => {
                  const daysRemaining = getDaysRemaining(ptt.maturity_date);
                  const isMatured = daysRemaining === 'Matured';

                  return (
                    <tr key={ptt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono font-bold text-blue-600">
                          {ptt.ptt_number}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {ptt.importer.company_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {ptt.importer.contact_person}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {ptt.exporter ? (
                          <>
                            <div className="text-sm font-medium text-gray-900">
                              {ptt.exporter.company_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {ptt.exporter.contact_person}
                            </div>
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">Not specified</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {ptt.currency} {parseFloat(ptt.amount.toString()).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(ptt.issue_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(ptt.maturity_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${isMatured ? 'text-red-600' : 'text-green-600'}`}>
                          {daysRemaining}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            ptt.status === 'discounted'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {ptt.status === 'discounted' ? 'Discounted' : 'Issued'}
                          </span>
                          {isMatured && (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              Matured
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
