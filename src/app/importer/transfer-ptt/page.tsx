'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

interface PTTRequest {
  id: string;
  ptt_number: string;
  amount: number;
  currency: string;
  maturity_days: number;
  incoterms: string;
  status: string;
  issue_date: string;
  maturity_date: string;
  exporter_id: string;
  exporter: {
    company_name: string;
    contact_person: string;
  } | null;
}

export default function TransferPTTPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string>('');
  const [issuedPTTs, setIssuedPTTs] = useState<PTTRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState<string | null>(null);

  useEffect(() => {
    const loadIssuedPTTs = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUserId(user.id);

      // Fetch issued PTTs for this importer
      const { data: requests } = await supabase
        .from('ptt_requests')
        .select(`
          *,
          exporter:user_profiles!ptt_requests_exporter_id_fkey(company_name, contact_person)
        `)
        .eq('importer_id', user.id)
        .eq('status', 'issued')
        .order('issue_date', { ascending: false });

      if (requests) {
        setIssuedPTTs(requests);
      }

      setLoading(false);
    };

    loadIssuedPTTs();
  }, [router]);

  const handleTransfer = async (pttId: string, exporterName: string) => {
    if (!confirm(`Are you sure you want to transfer this PTT to ${exporterName}?\n\nOnce transferred, the exporter will be able to upload shipping documents.`)) {
      return;
    }

    setTransferring(pttId);

    try {
      const response = await fetch('/api/ptt-requests/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pttId,
          userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to transfer PTT');
      }

      alert(`PTT transferred successfully to ${exporterName}!`);

      // Remove from list
      setIssuedPTTs(prev => prev.filter(ptt => ptt.id !== pttId));
    } catch (error) {
      console.error('Error transferring PTT:', error);
      alert(error instanceof Error ? error.message : 'Failed to transfer PTT');
    } finally {
      setTransferring(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Loading issued PTTs...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Transfer PTT to Exporter</h1>
        <p className="text-gray-600">
          Transfer issued PTTs to exporters so they can upload shipping documents
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900 mb-1">How Transfer Works</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Transfer issued PTTs to exporters as payment confirmation</li>
              <li>• Exporters will upload shipping documents (invoice, bill of lading, etc.)</li>
              <li>• You will review and approve the documents</li>
              <li>• After approval, exporters can offer the PTT for discount to their bank</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Issued PTTs Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Issued PTTs Ready for Transfer</h2>
          <p className="text-sm text-gray-500 mt-1">
            {issuedPTTs.length} PTT{issuedPTTs.length !== 1 ? 's' : ''} available
          </p>
        </div>

        {issuedPTTs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Issued PTTs</h3>
            <p className="text-gray-500 mb-6">
              No issued PTTs available for transfer. PTTs will appear here after bank approval.
            </p>
            <button
              onClick={() => router.push('/importer/dashboard')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
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
                    Incoterms
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {issuedPTTs.map((ptt) => (
                  <tr key={ptt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono font-bold text-blue-600">
                        {ptt.ptt_number}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ptt.incoterms}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleTransfer(ptt.id, ptt.exporter?.company_name || 'Exporter')}
                        disabled={transferring === ptt.id || !ptt.exporter_id}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {transferring === ptt.id ? 'Transferring...' : 'Transfer to Exporter'}
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
