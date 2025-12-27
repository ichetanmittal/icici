'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

interface ImporterData {
  user_id: string;
  company_name: string;
  contact_person: string;
  phone_number: string;
  geography: string;
  bank_name: string;
  totalPTTs: number;
  totalAmount: number;
  activePTTs: number;
}

export default function MyImporters() {
  const [importers, setImporters] = useState<ImporterData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadImporters = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // Fetch ALL importers
      const { data: importerProfiles } = await supabase
        .from('user_profiles')
        .select('user_id, company_name, contact_person, phone_number, geography, bank_name')
        .eq('role', 'importer')
        .order('company_name');

      // Fetch PTT requests where this exporter is involved
      const { data: requests } = await supabase
        .from('ptt_requests')
        .select('importer_id, amount, status')
        .eq('exporter_id', user.id);

      if (importerProfiles) {
        // Calculate stats for each importer
        const importersWithStats = importerProfiles.map(importer => {
          const importerRequests = requests?.filter(r => r.importer_id === importer.user_id) || [];
          const totalPTTs = importerRequests.length;
          const totalAmount = importerRequests.reduce((sum, r) => sum + parseFloat(r.amount.toString()), 0);
          const activePTTs = importerRequests.filter(r =>
            r.status === 'transferred' ||
            r.status === 'documents_uploaded' ||
            r.status === 'documents_approved' ||
            r.status === 'offered_for_discount'
          ).length;

          return {
            ...importer,
            totalPTTs,
            totalAmount,
            activePTTs,
          };
        });

        setImporters(importersWithStats);
      }

      setLoading(false);
    };

    loadImporters();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-600">Loading importers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Importers</h1>
        <p className="text-gray-600">Importers who have transferred PTTs to you</p>
      </div>

      {importers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12">
          <div className="flex flex-col items-center justify-center">
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Importers Yet</h3>
            <p className="text-gray-500 text-center mb-6">
              Importers will appear here once PTTs are transferred to you
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {importers.map((importer) => (
            <div key={importer.user_id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-blue-600">
                      {importer.company_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{importer.company_name}</h3>
                    <p className="text-sm text-gray-500">{importer.geography}</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{importer.totalPTTs}</p>
                    <p className="text-xs text-gray-500">Total PTTs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{importer.activePTTs}</p>
                    <p className="text-xs text-gray-500">Active</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      ${importer.totalAmount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Total Amount</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Contact Person</p>
                  <p className="text-sm font-medium text-gray-900">{importer.contact_person}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{importer.phone_number}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Bank</p>
                  <p className="text-sm font-medium text-gray-900">{importer.bank_name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
