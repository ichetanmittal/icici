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
  documents_uploaded_at: string;
  document_names: string[];
  document_urls: string[];
  exporter: {
    company_name: string;
    contact_person: string;
  } | null;
}

export default function ReviewDocumentsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string>('');
  const [pttsWithDocuments, setPttsWithDocuments] = useState<PTTRequest[]>([]);
  const [selectedPTT, setSelectedPTT] = useState<PTTRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    const loadPTTsWithDocuments = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUserId(user.id);

      // Fetch PTTs with uploaded documents
      const { data: requests } = await supabase
        .from('ptt_requests')
        .select(`
          *,
          exporter:user_profiles!ptt_requests_exporter_id_fkey(company_name, contact_person)
        `)
        .eq('importer_id', user.id)
        .eq('status', 'documents_uploaded')
        .order('documents_uploaded_at', { ascending: false });

      if (requests) {
        setPttsWithDocuments(requests);
      }

      setLoading(false);
    };

    loadPTTsWithDocuments();
  }, [router]);

  const handleApprove = async () => {
    if (!selectedPTT) return;

    if (!confirm(`Are you sure you want to approve the documents for PTT ${selectedPTT.ptt_number}?\n\nThis will allow the exporter to offer the PTT for discount.`)) {
      return;
    }

    setReviewing(true);

    try {
      const response = await fetch('/api/ptt-requests/review-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pttId: selectedPTT.id,
          userId,
          action: 'approve',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve documents');
      }

      alert(`Documents approved successfully for PTT ${selectedPTT.ptt_number}!`);

      // Remove from list
      setPttsWithDocuments(prev => prev.filter(ptt => ptt.id !== selectedPTT.id));
      setSelectedPTT(null);
    } catch (error) {
      console.error('Error approving documents:', error);
      alert(error instanceof Error ? error.message : 'Failed to approve documents');
    } finally {
      setReviewing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPTT) return;

    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setReviewing(true);

    try {
      const response = await fetch('/api/ptt-requests/review-documents', {
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
        throw new Error(data.error || 'Failed to reject documents');
      }

      alert(`Documents rejected for PTT ${selectedPTT.ptt_number}. Exporter can re-upload.`);

      // Remove from list
      setPttsWithDocuments(prev => prev.filter(ptt => ptt.id !== selectedPTT.id));
      setSelectedPTT(null);
      setShowRejectModal(false);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting documents:', error);
      alert(error instanceof Error ? error.message : 'Failed to reject documents');
    } finally {
      setReviewing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Loading PTTs with documents...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Documents</h1>
        <p className="text-gray-600">
          Review shipping documents uploaded by exporters
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900 mb-1">Document Review Process</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Review all uploaded documents carefully</li>
              <li>• Verify completeness and accuracy of trade documents</li>
              <li>• Approve to allow exporter to offer PTT for discount</li>
              <li>• Reject to request document re-upload from exporter</li>
            </ul>
          </div>
        </div>
      </div>

      {pttsWithDocuments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Documents to Review</h3>
          <p className="text-gray-500 mb-6">
            No PTTs have pending document uploads to review. Check back later.
          </p>
          <button
            onClick={() => router.push('/importer/dashboard')}
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
              <h2 className="text-lg font-bold text-gray-900 mb-4">PTTs for Review</h2>
              <p className="text-sm text-gray-500 mb-4">
                {pttsWithDocuments.length} PTT{pttsWithDocuments.length !== 1 ? 's' : ''} with documents
              </p>
              <div className="space-y-3">
                {pttsWithDocuments.map((ptt) => (
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
                      {ptt.exporter?.company_name || 'Unknown Exporter'}
                    </div>
                    <div className="text-sm font-medium text-gray-900 mt-1">
                      {ptt.currency} {parseFloat(ptt.amount.toString()).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Uploaded: {new Date(ptt.documents_uploaded_at).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-purple-600 mt-1 font-semibold">
                      {ptt.document_names?.length || 0} document{ptt.document_names?.length !== 1 ? 's' : ''}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Document Review */}
          <div className="lg:col-span-2">
            {selectedPTT ? (
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Review Documents</h2>
                  <p className="text-sm text-gray-600">
                    For PTT: <span className="font-mono font-bold text-blue-600">{selectedPTT.ptt_number}</span>
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Exporter</p>
                      <p className="text-sm font-medium text-gray-900">{selectedPTT.exporter?.company_name}</p>
                      <p className="text-xs text-gray-600">{selectedPTT.exporter?.contact_person}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Amount</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedPTT.currency} {parseFloat(selectedPTT.amount.toString()).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Documents List */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Documents</h3>
                  <div className="space-y-3">
                    {selectedPTT.document_names?.map((name, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{name}</p>
                              <p className="text-xs text-gray-500">Document {index + 1} of {selectedPTT.document_names.length}</p>
                            </div>
                          </div>
                          <a
                            href={selectedPTT.document_urls?.[index] || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            View
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={reviewing}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Reject Documents
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={reviewing}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {reviewing ? 'Processing...' : 'Approve Documents'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a PTT</h3>
                <p className="text-gray-500">
                  Choose a PTT from the list to review documents
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
            <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Documents</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting the documents. The exporter will be able to re-upload.
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
                disabled={reviewing}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={reviewing || !rejectionReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {reviewing ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
