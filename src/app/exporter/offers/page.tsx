'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';

interface PTTRequest {
  id: string;
  ptt_number: string;
  amount: number;
  currency: string;
  status: string;
  maturity_date: string;
  documents_approved_at: string;
  discount_percentage: number | null;
  offered_for_discount_at: string | null;
  importer: {
    company_name: string;
  } | null;
}

export default function ExporterOffersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pttIdFromQuery = searchParams.get('ptt');

  const [userId, setUserId] = useState<string>('');
  const [approvedPTTs, setApprovedPTTs] = useState<PTTRequest[]>([]);
  const [offeredPTTs, setOfferedPTTs] = useState<PTTRequest[]>([]);
  const [selectedPTT, setSelectedPTT] = useState<PTTRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [offering, setOffering] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState<string>('');

  useEffect(() => {
    const loadPTTs = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUserId(user.id);

      // Fetch documents_approved PTTs (ready to offer)
      const { data: approved } = await supabase
        .from('ptt_requests')
        .select(`
          *,
          importer:user_profiles!ptt_requests_importer_id_fkey(company_name)
        `)
        .eq('exporter_id', user.id)
        .eq('status', 'documents_approved')
        .order('documents_approved_at', { ascending: false });

      if (approved) {
        setApprovedPTTs(approved);

        // Auto-select from query param
        if (pttIdFromQuery) {
          const ptt = approved.find(r => r.id === pttIdFromQuery);
          if (ptt) {
            setSelectedPTT(ptt);
          }
        }
      }

      // Fetch already offered and discounted PTTs
      const { data: offered } = await supabase
        .from('ptt_requests')
        .select(`
          *,
          importer:user_profiles!ptt_requests_importer_id_fkey(company_name)
        `)
        .eq('exporter_id', user.id)
        .in('status', ['offered_for_discount', 'discounted'])
        .order('offered_for_discount_at', { ascending: false });

      if (offered) {
        setOfferedPTTs(offered);
      }

      setLoading(false);
    };

    loadPTTs();
  }, [router, pttIdFromQuery]);

  const calculateDiscountedAmount = (amount: number, discount: number) => {
    return amount * (1 - discount / 100);
  };

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPTT) {
      alert('Please select a PTT first');
      return;
    }

    const discount = parseFloat(discountPercentage);
    if (isNaN(discount) || discount <= 0 || discount > 100) {
      alert('Please enter a valid discount percentage between 0 and 100');
      return;
    }

    const discountedAmount = calculateDiscountedAmount(selectedPTT.amount, discount);
    const discountAmount = selectedPTT.amount - discountedAmount;

    if (!confirm(
      `Offer PTT ${selectedPTT.ptt_number} to ICICI Gift IBU?\n\n` +
      `Face Value: ${selectedPTT.currency} ${selectedPTT.amount.toLocaleString()}\n` +
      `Discount: ${discount}%\n` +
      `Discount Amount: ${selectedPTT.currency} ${discountAmount.toLocaleString()}\n` +
      `You will receive: ${selectedPTT.currency} ${discountedAmount.toLocaleString()}`
    )) {
      return;
    }

    setOffering(true);

    try {
      const response = await fetch('/api/ptt-requests/offer-discount', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pttId: selectedPTT.id,
          userId,
          discountPercentage: discount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to offer PTT for discount');
      }

      alert(`PTT ${selectedPTT.ptt_number} offered to ICICI Gift IBU successfully!`);

      // Move to offered list
      setApprovedPTTs(prev => prev.filter(ptt => ptt.id !== selectedPTT.id));
      setOfferedPTTs(prev => [data.pttRequest, ...prev]);

      // Reset
      setSelectedPTT(null);
      setDiscountPercentage('');

      // Redirect to dashboard
      router.push('/exporter/dashboard');
    } catch (error) {
      console.error('Error offering PTT:', error);
      alert(error instanceof Error ? error.message : 'Failed to offer PTT for discount');
    } finally {
      setOffering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Loading PTTs...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Discount Offers</h1>
        <p className="text-gray-600">
          Offer approved PTTs to ICICI Gift IBU for discounting
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900 mb-1">How Discounting Works</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Set your desired discount percentage (e.g., 5% for early payment)</li>
              <li>• ICICI Gift IBU will review and decide to accept or reject</li>
              <li>• If accepted, you receive immediate payment minus the discount</li>
              <li>• ICICI Gift IBU collects full amount from importer at maturity</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button className="border-b-2 border-orange-500 py-4 px-1 text-sm font-medium text-orange-600">
              Ready to Offer ({approvedPTTs.length})
            </button>
            <button
              onClick={() => {/* Could switch to offered tab */}}
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Offered PTTs ({offeredPTTs.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Ready to Offer Section */}
      {approvedPTTs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No PTTs Ready to Offer</h3>
          <p className="text-gray-500 mb-6">
            PTTs will appear here after documents are approved by the importer.
          </p>
          <button
            onClick={() => router.push('/exporter/dashboard')}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* PTT Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Select PTT</h2>
              <p className="text-sm text-gray-500 mb-4">
                {approvedPTTs.length} PTT{approvedPTTs.length !== 1 ? 's' : ''} ready to offer
              </p>
              <div className="space-y-3">
                {approvedPTTs.map((ptt) => (
                  <button
                    key={ptt.id}
                    onClick={() => setSelectedPTT(ptt)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedPTT?.id === ptt.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300 bg-white'
                    }`}
                  >
                    <div className="font-mono font-bold text-blue-600 mb-1">
                      {ptt.ptt_number}
                    </div>
                    <div className="text-sm text-gray-600">
                      {ptt.importer?.company_name || 'Unknown Importer'}
                    </div>
                    <div className="text-sm font-medium text-gray-900 mt-1">
                      {ptt.currency} {parseFloat(ptt.amount.toString()).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Maturity: {new Date(ptt.maturity_date).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Offer Form */}
          <div className="lg:col-span-2">
            {selectedPTT ? (
              <form onSubmit={handleSubmitOffer} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Create Discount Offer</h2>
                  <p className="text-sm text-gray-600">
                    For PTT: <span className="font-mono font-bold text-blue-600">{selectedPTT.ptt_number}</span>
                  </p>
                </div>

                {/* PTT Details */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Importer</p>
                      <p className="text-sm font-medium text-gray-900">{selectedPTT.importer?.company_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Face Value</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedPTT.currency} {parseFloat(selectedPTT.amount.toString()).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Maturity Date</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(selectedPTT.maturity_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Days to Maturity</p>
                      <p className="text-sm font-medium text-gray-900">
                        {Math.ceil((new Date(selectedPTT.maturity_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                      </p>
                    </div>
                  </div>
                </div>

                {/* Discount Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Percentage (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={discountPercentage}
                    onChange={(e) => setDiscountPercentage(e.target.value)}
                    placeholder="e.g., 5.0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Typical discount range: 2% - 10% depending on days to maturity
                  </p>
                </div>

                {/* Calculation Preview */}
                {discountPercentage && parseFloat(discountPercentage) > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <h3 className="text-sm font-semibold text-green-900 mb-3">Offer Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Face Value:</span>
                        <span className="font-medium text-gray-900">
                          {selectedPTT.currency} {selectedPTT.amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Discount ({discountPercentage}%):</span>
                        <span className="font-medium text-red-600">
                          - {selectedPTT.currency} {(selectedPTT.amount * parseFloat(discountPercentage) / 100).toLocaleString()}
                        </span>
                      </div>
                      <div className="border-t border-green-300 pt-2 flex justify-between">
                        <span className="font-semibold text-gray-900">You will receive:</span>
                        <span className="font-bold text-green-700 text-lg">
                          {selectedPTT.currency} {calculateDiscountedAmount(selectedPTT.amount, parseFloat(discountPercentage)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPTT(null);
                      setDiscountPercentage('');
                    }}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={offering || !discountPercentage || parseFloat(discountPercentage) <= 0}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {offering ? 'Submitting Offer...' : 'Submit Offer to ICICI Gift IBU'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a PTT</h3>
                <p className="text-gray-500">
                  Choose a PTT from the list to create a discount offer
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Offered PTTs Section */}
      {offeredPTTs.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Offered PTTs</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PTT Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Face Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">You Receive</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Offered On</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {offeredPTTs.map((ptt) => (
                  <tr key={ptt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono font-bold text-blue-600">{ptt.ptt_number}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ptt.currency} {parseFloat(ptt.amount.toString()).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                      {ptt.discount_percentage}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                      {ptt.currency} {calculateDiscountedAmount(ptt.amount, ptt.discount_percentage || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        ptt.status === 'offered_for_discount'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {ptt.status === 'offered_for_discount' ? 'Pending Review' : 'Accepted'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ptt.offered_for_discount_at ? new Date(ptt.offered_for_discount_at).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
