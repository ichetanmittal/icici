'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

interface PTTDetails {
  id: string;
  ptt_number: string;
  amount: number;
  currency: string;
  maturity_days: number;
  incoterms: string;
  status: string;
  importer_bank: string;
  exporter_bank: string;
  created_at: string;
  requested_at: string;
  maker_approved_at: string | null;
  maker_approved_by: string | null;
  checker_approved_at: string | null;
  checker_approved_by: string | null;
  issue_date: string | null;
  maturity_date: string | null;
  importer_id: string;
  exporter_id: string | null;
}

interface UserProfile {
  user_id: string;
  company_name: string;
  contact_person: string;
  phone_number: string;
  geography: string;
  bank_name: string;
  bank_account_number: string;
  swift_code: string;
}

export default function PTTDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [userId, setUserId] = useState<string>('');
  const [pttDetails, setPttDetails] = useState<PTTDetails | null>(null);
  const [importerProfile, setImporterProfile] = useState<UserProfile | null>(null);
  const [makerProfile, setMakerProfile] = useState<UserProfile | null>(null);
  const [checkerProfile, setCheckerProfile] = useState<UserProfile | null>(null);
  const [exporters, setExporters] = useState<UserProfile[]>([]);
  const [selectedExporter, setSelectedExporter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    const loadPTTDetails = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUserId(user.id);

      // Fetch PTT details
      const { data: pttData } = await supabase
        .from('ptt_requests')
        .select('*')
        .eq('id', resolvedParams.id)
        .single();

      if (pttData) {
        setPttDetails(pttData);

        // Set selected exporter if already exists
        if (pttData.exporter_id) {
          setSelectedExporter(pttData.exporter_id);
        }

        // Fetch importer profile
        const { data: importerData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', pttData.importer_id)
          .single();
        setImporterProfile(importerData);

        // Fetch all exporters for dropdown
        const { data: exportersData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('role', 'exporter');
        if (exportersData) {
          setExporters(exportersData);
        }

        // Fetch maker profile if approved
        if (pttData.maker_approved_by) {
          const { data: makerData } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', pttData.maker_approved_by)
            .single();
          setMakerProfile(makerData);
        }

        // Fetch checker profile if approved
        if (pttData.checker_approved_by) {
          const { data: checkerData } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', pttData.checker_approved_by)
            .single();
          setCheckerProfile(checkerData);
        }
      }

      setLoading(false);
    };

    loadPTTDetails();
  }, [resolvedParams.id, router]);

  const handleTransfer = async () => {
    if (!pttDetails || !selectedExporter) {
      alert('Please select an exporter');
      return;
    }

    const selectedExp = exporters.find(e => e.user_id === selectedExporter);

    if (!confirm(
      `Transfer PTT ${pttDetails.ptt_number} to ${selectedExp?.company_name}?\n\n` +
      `The exporter will be required to upload:\n` +
      `• Commercial Invoice\n` +
      `• Bill of Lading / Air Waybill\n` +
      `• Packing List\n` +
      `• Certificate of Origin (if applicable)\n\n` +
      `You will review and approve these documents before the exporter can proceed with discounting.`
    )) {
      return;
    }

    setTransferring(true);

    try {
      // First update exporter_id if changed
      const supabase = createClient();
      await supabase
        .from('ptt_requests')
        .update({ exporter_id: selectedExporter })
        .eq('id', pttDetails.id);

      // Then transfer
      const response = await fetch('/api/ptt-requests/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pttId: pttDetails.id,
          userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to transfer PTT');
      }

      alert(`PTT transferred successfully to ${selectedExp?.company_name}!`);
      router.push('/importer/dashboard');
    } catch (error) {
      console.error('Error transferring PTT:', error);
      alert(error instanceof Error ? error.message : 'Failed to transfer PTT');
    } finally {
      setTransferring(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'maker_approved':
        return 'bg-blue-100 text-blue-800';
      case 'issued':
        return 'bg-green-100 text-green-800';
      case 'transferred':
        return 'bg-purple-100 text-purple-800';
      case 'settled':
        return 'bg-gray-100 text-gray-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'maker_approved':
        return 'Maker Approved';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Loading PTT details...</p>
      </div>
    );
  }

  if (!pttDetails) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600 mb-4">PTT not found</p>
          <button
            onClick={() => router.push('/importer/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const canTransfer = pttDetails.status === 'issued';

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/importer/dashboard')}
          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">PTT Details</h1>
            <p className="text-lg font-mono font-bold text-blue-600">{pttDetails.ptt_number}</p>
          </div>
          <div>
            <span className={`px-4 py-2 rounded-full font-semibold ${getStatusColor(pttDetails.status)}`}>
              {getStatusText(pttDetails.status)}
            </span>
          </div>
        </div>
      </div>

      {/* PTT Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Financial Details */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Financial Details</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500">Amount</label>
              <p className="text-2xl font-bold text-gray-900">
                {pttDetails.currency} {parseFloat(pttDetails.amount.toString()).toLocaleString()}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Currency</label>
                <p className="text-lg font-semibold text-gray-900">{pttDetails.currency}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Incoterms</label>
                <p className="text-lg font-semibold text-gray-900">{pttDetails.incoterms}</p>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-500">Maturity Period</label>
              <p className="text-lg font-semibold text-gray-900">{pttDetails.maturity_days} days</p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Timeline</h2>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Requested</p>
                <p className="text-sm text-gray-500">{formatDate(pttDetails.requested_at || pttDetails.created_at)}</p>
              </div>
            </div>
            {pttDetails.maker_approved_at && (
              <div className="flex items-start">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Maker Approved</p>
                  <p className="text-sm text-gray-500">{formatDate(pttDetails.maker_approved_at)}</p>
                  {makerProfile && (
                    <p className="text-xs text-gray-400">by {makerProfile.contact_person}</p>
                  )}
                </div>
              </div>
            )}
            {pttDetails.checker_approved_at && (
              <div className="flex items-start">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Checker Approved (Issued)</p>
                  <p className="text-sm text-gray-500">{formatDate(pttDetails.checker_approved_at)}</p>
                  {checkerProfile && (
                    <p className="text-xs text-gray-400">by {checkerProfile.contact_person}</p>
                  )}
                </div>
              </div>
            )}
            {pttDetails.issue_date && (
              <div className="flex items-start">
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Issue Date</p>
                  <p className="text-sm text-gray-500">{formatDate(pttDetails.issue_date)}</p>
                </div>
              </div>
            )}
            {pttDetails.maturity_date && (
              <div className="flex items-start">
                <div className="w-2 h-2 bg-orange-600 rounded-full mt-2 mr-3"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Maturity Date</p>
                  <p className="text-sm text-gray-500">{formatDate(pttDetails.maturity_date)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Party Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Importer Details */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Importer Details</h2>
          {importerProfile && (
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-500">Company Name</label>
                <p className="text-lg font-semibold text-gray-900">{importerProfile.company_name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Contact Person</label>
                <p className="text-base text-gray-900">{importerProfile.contact_person}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Phone</label>
                <p className="text-base text-gray-900">{importerProfile.phone_number}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Geography</label>
                <p className="text-base text-gray-900">{importerProfile.geography || 'N/A'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Issuing Bank */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Issuing Bank (DBS)</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-500">Bank Name</label>
              <p className="text-lg font-semibold text-gray-900">{pttDetails.importer_bank}</p>
            </div>
            {importerProfile?.bank_account_number && (
              <>
                <div>
                  <label className="text-sm text-gray-500">Account Number</label>
                  <p className="text-base font-mono text-gray-900">{importerProfile.bank_account_number}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">SWIFT/IFSC Code</label>
                  <p className="text-base font-mono text-gray-900">{importerProfile.swift_code}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Transfer Section - Only show if status is 'issued' */}
      {canTransfer && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Transfer PTT to Exporter
          </h2>

          {/* Document Requirements */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Document Requirements
            </h3>
            <p className="text-sm text-blue-800 mb-3">After transfer, the exporter must upload the following documents:</p>
            <ul className="text-sm text-blue-800 space-y-2">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <span className="font-semibold">Commercial Invoice</span>
                  <p className="text-xs text-blue-700">Detailed invoice for the goods shipped</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <span className="font-semibold">Bill of Lading / Air Waybill</span>
                  <p className="text-xs text-blue-700">Proof of shipment and receipt</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <span className="font-semibold">Packing List</span>
                  <p className="text-xs text-blue-700">Detailed list of package contents</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <span className="font-semibold">Certificate of Origin</span> <span className="text-xs">(if applicable)</span>
                  <p className="text-xs text-blue-700">Document certifying country of origin</p>
                </div>
              </li>
            </ul>
            <p className="text-sm text-blue-800 mt-3 font-medium">
              ⚠️ You will review and approve these documents before the exporter can proceed with discounting.
            </p>
          </div>

          {/* Exporter Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Exporter <span className="text-red-600">*</span>
            </label>
            <select
              value={selectedExporter}
              onChange={(e) => setSelectedExporter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            >
              <option value="">-- Select an Exporter --</option>
              {exporters.map((exporter) => (
                <option key={exporter.user_id} value={exporter.user_id}>
                  {exporter.company_name} ({exporter.contact_person})
                </option>
              ))}
            </select>
            {selectedExporter && (
              <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Exporter selected
              </p>
            )}
          </div>

          {/* Transfer Button */}
          <button
            onClick={handleTransfer}
            disabled={!selectedExporter || transferring}
            className="w-full px-6 py-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {transferring ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Transferring...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Transfer PTT to Exporter
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
