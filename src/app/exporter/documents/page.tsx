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
  transferred_at: string;
  importer: {
    company_name: string;
  } | null;
}

interface Document {
  type: string;
  name: string;
  file: File | null;
  url: string;
}

export default function ExporterDocumentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pttIdFromQuery = searchParams.get('ptt');

  const [userId, setUserId] = useState<string>('');
  const [transferredPTTs, setTransferredPTTs] = useState<PTTRequest[]>([]);
  const [selectedPTT, setSelectedPTT] = useState<PTTRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([
    { type: 'Commercial Invoice', name: '', file: null, url: '' },
    { type: 'Bill of Lading', name: '', file: null, url: '' },
    { type: 'Packing List', name: '', file: null, url: '' },
  ]);

  useEffect(() => {
    const loadTransferredPTTs = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUserId(user.id);

      // Fetch transferred PTTs for this exporter
      const { data: requests } = await supabase
        .from('ptt_requests')
        .select(`
          *,
          importer:user_profiles!ptt_requests_importer_id_fkey(company_name)
        `)
        .eq('exporter_id', user.id)
        .eq('status', 'transferred')
        .order('transferred_at', { ascending: false });

      if (requests) {
        setTransferredPTTs(requests);

        // If PTT ID is in query params, auto-select it
        if (pttIdFromQuery) {
          const ptt = requests.find(r => r.id === pttIdFromQuery);
          if (ptt) {
            setSelectedPTT(ptt);
          }
        }
      }

      setLoading(false);
    };

    loadTransferredPTTs();
  }, [router, pttIdFromQuery]);

  const handleFileChange = (index: number, file: File | null) => {
    const newDocuments = [...documents];
    if (file) {
      newDocuments[index].file = file;
      newDocuments[index].name = file.name;
      // In a real implementation, you would upload to Supabase Storage here
      // For now, we'll create a mock URL
      newDocuments[index].url = `https://storage.example.com/documents/${Date.now()}_${file.name}`;
    } else {
      newDocuments[index].file = null;
      newDocuments[index].name = '';
      newDocuments[index].url = '';
    }
    setDocuments(newDocuments);
  };

  const addDocument = () => {
    setDocuments([
      ...documents,
      { type: 'Other Document', name: '', file: null, url: '' },
    ]);
  };

  const removeDocument = (index: number) => {
    if (documents.length > 1) {
      setDocuments(documents.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPTT) {
      alert('Please select a PTT first');
      return;
    }

    const uploadedDocs = documents.filter(doc => doc.file !== null);

    if (uploadedDocs.length === 0) {
      alert('Please upload at least one document');
      return;
    }

    setUploading(true);

    try {
      const response = await fetch('/api/ptt-requests/upload-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pttId: selectedPTT.id,
          userId,
          documents: uploadedDocs.map(doc => ({
            type: doc.type,
            name: doc.name,
            url: doc.url,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload documents');
      }

      alert(`Documents uploaded successfully for PTT ${selectedPTT.ptt_number}!`);

      // Reset and reload
      setSelectedPTT(null);
      setDocuments([
        { type: 'Commercial Invoice', name: '', file: null, url: '' },
        { type: 'Bill of Lading', name: '', file: null, url: '' },
        { type: 'Packing List', name: '', file: null, url: '' },
      ]);

      // Reload PTTs
      setTransferredPTTs(prev => prev.filter(ptt => ptt.id !== selectedPTT.id));

      // Redirect to dashboard
      router.push('/exporter/dashboard');
    } catch (error) {
      console.error('Error uploading documents:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload documents');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Loading transferred PTTs...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Documents</h1>
        <p className="text-gray-600">
          Upload shipping documents for transferred PTTs
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900 mb-1">Required Documents</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Commercial Invoice</li>
              <li>• Bill of Lading (or Air Waybill)</li>
              <li>• Packing List</li>
              <li>• Other relevant trade documents</li>
            </ul>
          </div>
        </div>
      </div>

      {transferredPTTs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transferred PTTs</h3>
          <p className="text-gray-500 mb-6">
            No transferred PTTs are pending document upload. Check your dashboard for received PTTs.
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
                {transferredPTTs.length} PTT{transferredPTTs.length !== 1 ? 's' : ''} awaiting documents
              </p>
              <div className="space-y-3">
                {transferredPTTs.map((ptt) => (
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
                      Transferred: {new Date(ptt.transferred_at).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Document Upload Form */}
          <div className="lg:col-span-2">
            {selectedPTT ? (
              <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Upload Documents</h2>
                  <p className="text-sm text-gray-600">
                    For PTT: <span className="font-mono font-bold text-blue-600">{selectedPTT.ptt_number}</span>
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  {documents.map((doc, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {doc.type}
                          </label>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileChange(index, e.target.files?.[0] || null)}
                            className="block w-full text-sm text-gray-500
                              file:mr-4 file:py-2 file:px-4
                              file:rounded-lg file:border-0
                              file:text-sm file:font-semibold
                              file:bg-orange-50 file:text-orange-700
                              hover:file:bg-orange-100
                              cursor-pointer"
                          />
                          {doc.name && (
                            <p className="mt-2 text-xs text-green-600 flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              {doc.name}
                            </p>
                          )}
                        </div>
                        {documents.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeDocument(index)}
                            className="ml-4 text-red-600 hover:text-red-800"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addDocument}
                  className="w-full mb-6 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-orange-500 hover:text-orange-600 transition-colors"
                >
                  + Add Another Document
                </button>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setSelectedPTT(null)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || documents.filter(d => d.file).length === 0}
                    className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Uploading...' : 'Upload Documents'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a PTT</h3>
                <p className="text-gray-500">
                  Choose a PTT from the list to upload documents
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
