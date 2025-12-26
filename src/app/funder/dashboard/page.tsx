'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

interface PTTRequest {
  id: string;
  ptt_number: string;
  amount: number;
  currency: string;
  status: string;
  maturity_date: string;
  issue_date: string;
  discount_percentage: number;
  offered_for_discount_at: string;
  exporter: {
    company_name: string;
    contact_person: string;
  } | null;
  importer: {
    company_name: string;
  } | null;
}

export default function FunderDashboardPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string>('');
  const [offeredPTTs, setOfferedPTTs] = useState<PTTRequest[]>([]);
  const [selectedPTT, setSelectedPTT] = useState<PTTRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    const loadMarketplace = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUserId(user.id);

      // Fetch PTTs offered for discount
      const { data: requests } = await supabase
        .from('ptt_requests')
        .select(`
          *,
          exporter:user_profiles!ptt_requests_exporter_id_fkey(company_name, contact_person),
          importer:user_profiles!ptt_requests_importer_id_fkey(company_name)
        `)
        .eq('status', 'offered_for_discount')
        .order('offered_for_discount_at', { ascending: false });

      if (requests) {
        setOfferedPTTs(requests);
      }

      setLoading(false);
    };

    loadMarketplace();
  }, [router]);

  const calculateDiscountedAmount = (amount: number, discount: number) => {
    return amount * (1 - discount / 100);
  };

  const calculateReturn = (amount: number, discount: number) => {
    return amount - calculateDiscountedAmount(amount, discount);
  };

  const getDaysToMaturity = (maturityDate: string) => {
    return Math.ceil((new Date(maturityDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleAccept = async () => {
    if (!selectedPTT) return;

    const discountedAmount = calculateDiscountedAmount(selectedPTT.amount, selectedPTT.discount_percentage);
    const returnAmount = calculateReturn(selectedPTT.amount, selectedPTT.discount_percentage);

    if (!confirm(
      `Accept discount offer for PTT ${selectedPTT.ptt_number}?\n\n` +
      `You will pay: ${selectedPTT.currency} ${discountedAmount.toLocaleString()}\n` +
      `You will receive at maturity: ${selectedPTT.currency} ${selectedPTT.amount.toLocaleString()}\n` +
      `Expected return: ${selectedPTT.currency} ${returnAmount.toLocaleString()} (${selectedPTT.discount_percentage}%)`
    )) {
      return;
    }

    setProcessing(true);

    try {
      const response = await fetch('/api/ptt-requests/accept-discount', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pttId: selectedPTT.id,
          userId,
          action: 'accept',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept discount offer');
      }

      alert(`Discount offer accepted for PTT ${selectedPTT.ptt_number}!`);

      // Remove from list
      setOfferedPTTs(prev => prev.filter(ptt => ptt.id !== selectedPTT.id));
      setSelectedPTT(null);
    } catch (error) {
      console.error('Error accepting offer:', error);
      alert(error instanceof Error ? error.message : 'Failed to accept offer');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPTT) return;

    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setProcessing(true);

    try {
      const response = await fetch('/api/ptt-requests/accept-discount', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pttId: selectedPTT.id,
          userId,
          action: 'reject',
          rejectionReason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject discount offer');
      }

      alert(`Discount offer rejected for PTT ${selectedPTT.ptt_number}.`);

      // Remove from list
      setOfferedPTTs(prev => prev.filter(ptt => ptt.id !== selectedPTT.id));
      setSelectedPTT(null);
      setShowRejectModal(false);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting offer:', error);
      alert(error instanceof Error ? error.message : 'Failed to reject offer');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Loading marketplace...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">PTT Marketplace</h1>
        <p className="text-gray-600">
          Review and accept discount offers from exporters
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
              <li>• Pay discounted amount immediately to exporter</li>
              <li>• Collect full face value from importer at maturity</li>
              <li>• Profit is the discount percentage of face value</li>
              <li>• All PTTs are backed by DBS Bank issued guarantees</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Available Offers</h3>
          <p className="text-4xl font-bold text-green-600 mb-1">
            {offeredPTTs.length}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Face Value</h3>
          <p className="text-4xl font-bold text-blue-600 mb-1">
            ${offeredPTTs.reduce((sum, ptt) => sum + parseFloat(ptt.amount.toString()), 0).toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Avg. Discount Rate</h3>
          <p className="text-4xl font-bold text-purple-600 mb-1">
            {offeredPTTs.length > 0
              ? (offeredPTTs.reduce((sum, ptt) => sum + ptt.discount_percentage, 0) / offeredPTTs.length).toFixed(2)
              : '0.00'}%
          </p>
        </div>
      </div>

      {offeredPTTs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No PTTs Available</h3>
          <p className="text-gray-500">
            No PTTs have been offered for discounting yet. Check back later for new opportunities.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* PTT List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Available PTTs</h2>
              <div className="space-y-3">
                {offeredPTTs.map((ptt) => (
                  <button
                    key={ptt.id}
                    onClick={() => setSelectedPTT(ptt)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedPTT?.id === ptt.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300 bg-white'
                    }`}
                  >
                    <div className="font-mono font-bold text-blue-600 mb-1">
                      {ptt.ptt_number}
                    </div>
                    <div className="text-sm font-medium text-gray-900 mt-1">
                      {ptt.currency} {parseFloat(ptt.amount.toString()).toLocaleString()}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-semibold text-green-600">
                        {ptt.discount_percentage}% discount
                      </span>
                      <span className="text-xs text-gray-500">
                        {getDaysToMaturity(ptt.maturity_date)} days
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* PTT Details */}
          <div className="lg:col-span-2">
            {selectedPTT ? (
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Discount Offer Details</h2>
                  <p className="text-sm text-gray-600">
                    PTT: <span className="font-mono font-bold text-blue-600">{selectedPTT.ptt_number}</span>
                  </p>
                </div>

                {/* Investment Summary */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-5 mb-6">
                  <h3 className="text-sm font-semibold text-green-900 mb-4">Investment Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">You Pay Now:</span>
                      <span className="text-lg font-bold text-gray-900">
                        {selectedPTT.currency} {calculateDiscountedAmount(selectedPTT.amount, selectedPTT.discount_percentage).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">You Receive at Maturity:</span>
                      <span className="text-lg font-bold text-gray-900">
                        {selectedPTT.currency} {selectedPTT.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="border-t border-green-300 pt-3 flex justify-between items-center">
                      <span className="font-semibold text-gray-900">Expected Return:</span>
                      <span className="text-xl font-bold text-green-700">
                        {selectedPTT.currency} {calculateReturn(selectedPTT.amount, selectedPTT.discount_percentage).toLocaleString()}
                        <span className="text-sm ml-2">({selectedPTT.discount_percentage}%)</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* PTT Details */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Exporter</p>
                    <p className="text-sm font-medium text-gray-900">{selectedPTT.exporter?.company_name}</p>
                    <p className="text-xs text-gray-600">{selectedPTT.exporter?.contact_person}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Importer (Obligor)</p>
                    <p className="text-sm font-medium text-gray-900">{selectedPTT.importer?.company_name}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Issue Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(selectedPTT.issue_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Maturity Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(selectedPTT.maturity_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Days to Maturity</p>
                    <p className="text-sm font-medium text-gray-900">
                      {getDaysToMaturity(selectedPTT.maturity_date)} days
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Offered On</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(selectedPTT.offered_for_discount_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={processing}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Reject Offer
                  </button>
                  <button
                    onClick={handleAccept}
                    disabled={processing}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {processing ? 'Processing...' : 'Accept & Purchase'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a PTT</h3>
                <p className="text-gray-500">
                  Choose a PTT from the list to review the discount offer
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Discount Offer</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this offer. The exporter will be able to re-submit with different terms.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
            />
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                disabled={processing}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processing || !rejectionReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {processing ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
