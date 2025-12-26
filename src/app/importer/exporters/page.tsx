'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

interface ExporterData {
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

export default function MyExporters() {
  const [exporters, setExporters] = useState<ExporterData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadExporters = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // Fetch ALL exporters
      const { data: exporterProfiles } = await supabase
        .from('user_profiles')
        .select('user_id, company_name, contact_person, phone_number, geography, bank_name')
        .eq('role', 'exporter')
        .order('company_name');

      // Fetch PTT requests for this importer to calculate stats
      const { data: requests } = await supabase
        .from('ptt_requests')
        .select('exporter_id, amount, status')
        .eq('importer_id', user.id);

      if (exporterProfiles) {
        // Calculate stats for each exporter
        const exportersWithStats = exporterProfiles.map(exporter => {
          const exporterRequests = requests?.filter(r => r.exporter_id === exporter.user_id) || [];
          const totalPTTs = exporterRequests.length;
          const totalAmount = exporterRequests.reduce((sum, r) => sum + parseFloat(r.amount.toString()), 0);
          const activePTTs = exporterRequests.filter(r => r.status === 'pending' || r.status === 'approved').length;

          return {
            ...exporter,
            totalPTTs,
            totalAmount,
            activePTTs,
          };
        });

        setExporters(exportersWithStats);
      }

      setLoading(false);
    };

    loadExporters();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-600">Loading exporters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Exporters</h1>
        <p className="text-gray-600">Exporters you've sent PTT requests to</p>
      </div>

      {exporters.length === 0 ? (
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Exporters Yet</h3>
            <p className="text-gray-500 text-center mb-6">
              Exporters will appear here once you send PTT requests to them
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {exporters.map((exporter) => (
            <div key={exporter.user_id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-orange-600">
                      {exporter.company_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{exporter.company_name}</h3>
                    <p className="text-sm text-gray-500">{exporter.geography}</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{exporter.totalPTTs}</p>
                    <p className="text-xs text-gray-500">Total PTTs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{exporter.activePTTs}</p>
                    <p className="text-xs text-gray-500">Active</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      ${exporter.totalAmount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Total Amount</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Contact Person</p>
                  <p className="text-sm font-medium text-gray-900">{exporter.contact_person}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{exporter.phone_number}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Bank</p>
                  <p className="text-sm font-medium text-gray-900">{exporter.bank_name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
