'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

interface PTTInvestment {
  id: string;
  ptt_number: string;
  amount: number;
  currency: string;
  discount_percentage: number;
  status: string;
  issue_date: string;
  maturity_date: string;
  discounted_at: string;
  settled_at: string | null;
  exporter: {
    company_name: string;
    contact_person: string;
  } | null;
  importer: {
    company_name: string;
  } | null;
}

export default function MyPortfolio() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [unrealizedInvestments, setUnrealizedInvestments] = useState<PTTInvestment[]>([]);
  const [realizedInvestments, setRealizedInvestments] = useState<PTTInvestment[]>([]);

  useEffect(() => {
    const loadPortfolio = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Fetch discounted PTTs (unrealized - purchased but not settled)
      const { data: unrealized } = await supabase
        .from('ptt_requests')
        .select(`
          *,
          exporter:user_profiles!ptt_requests_exporter_id_fkey(company_name, contact_person),
          importer:user_profiles!ptt_requests_importer_id_fkey(company_name)
        `)
        .eq('status', 'discounted')
        .order('discounted_at', { ascending: false });

      if (unrealized) {
        setUnrealizedInvestments(unrealized);
      }

      // Fetch settled PTTs (realized returns)
      const { data: realized } = await supabase
        .from('ptt_requests')
        .select(`
          *,
          exporter:user_profiles!ptt_requests_exporter_id_fkey(company_name, contact_person),
          importer:user_profiles!ptt_requests_importer_id_fkey(company_name)
        `)
        .eq('status', 'settled')
        .order('settled_at', { ascending: false });

      if (realized) {
        setRealizedInvestments(realized);
      }

      setLoading(false);
    };

    loadPortfolio();
  }, [router]);

  const calculatePurchasePrice = (amount: number, discount: number) => {
    return amount * (1 - discount / 100);
  };

  const calculateReturn = (amount: number, discount: number) => {
    return amount - calculatePurchasePrice(amount, discount);
  };

  const getDaysToMaturity = (maturityDate: string) => {
    const days = Math.ceil((new Date(maturityDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const getDaysSincePurchase = (purchaseDate: string) => {
    return Math.floor((new Date().getTime() - new Date(purchaseDate).getTime()) / (1000 * 60 * 60 * 24));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-600">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  // Calculate totals
  const totalUnrealizedInvestment = unrealizedInvestments.reduce(
    (sum, inv) => sum + calculatePurchasePrice(inv.amount, inv.discount_percentage),
    0
  );
  const totalUnrealizedValue = unrealizedInvestments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalUnrealizedReturn = totalUnrealizedValue - totalUnrealizedInvestment;

  const totalRealizedInvestment = realizedInvestments.reduce(
    (sum, inv) => sum + calculatePurchasePrice(inv.amount, inv.discount_percentage),
    0
  );
  const totalRealizedValue = realizedInvestments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalRealizedReturn = totalRealizedValue - totalRealizedInvestment;

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Portfolio</h1>
        <p className="text-gray-600">Track your PTT investments and returns</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Invested</h3>
          <p className="text-3xl font-bold text-blue-600">
            ${(totalUnrealizedInvestment + totalRealizedInvestment).toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Unrealized Returns</h3>
          <p className="text-3xl font-bold text-orange-600">
            ${totalUnrealizedReturn.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {unrealizedInvestments.length} active investment{unrealizedInvestments.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Realized Returns</h3>
          <p className="text-3xl font-bold text-green-600">
            ${totalRealizedReturn.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {realizedInvestments.length} settled investment{realizedInvestments.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Returns</h3>
          <p className="text-3xl font-bold text-purple-600">
            ${(totalUnrealizedReturn + totalRealizedReturn).toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {((totalUnrealizedReturn + totalRealizedReturn) / (totalUnrealizedInvestment + totalRealizedInvestment) * 100).toFixed(2)}% ROI
          </p>
        </div>
      </div>

      {/* Unrealized Investments */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Unrealized Returns</h2>
          <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
            Active Investments
          </span>
        </div>

        {unrealizedInvestments.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500">No active investments</p>
            <p className="text-sm text-gray-400 mt-1">Purchased PTTs will appear here until settlement</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PTT Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exporter</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchase Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Maturity Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected Return</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Maturity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchased</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {unrealizedInvestments.map((investment) => {
                  const purchasePrice = calculatePurchasePrice(investment.amount, investment.discount_percentage);
                  const expectedReturn = calculateReturn(investment.amount, investment.discount_percentage);
                  const daysToMaturity = getDaysToMaturity(investment.maturity_date);
                  const daysSincePurchase = getDaysSincePurchase(investment.discounted_at);

                  return (
                    <tr key={investment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono font-bold text-orange-600">{investment.ptt_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {investment.exporter ? (
                          <>
                            <div className="text-sm font-medium text-gray-900">{investment.exporter.company_name}</div>
                            <div className="text-xs text-gray-500">{investment.exporter.contact_person}</div>
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {investment.currency} {purchasePrice.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">{investment.discount_percentage}% discount</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {investment.currency} {investment.amount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-green-600">
                          +{investment.currency} {expectedReturn.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">+{investment.discount_percentage}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{daysToMaturity} days</div>
                        <div className="text-xs text-gray-500">{formatDate(investment.maturity_date)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{daysSincePurchase} days ago</div>
                        <div className="text-xs text-gray-500">{formatDate(investment.discounted_at)}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Realized Investments */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Realized Returns</h2>
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            Settled Investments
          </span>
        </div>

        {realizedInvestments.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500">No settled investments yet</p>
            <p className="text-sm text-gray-400 mt-1">Completed PTTs will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PTT Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exporter</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Investment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Received</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Return</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Settled Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {realizedInvestments.map((investment) => {
                  const purchasePrice = calculatePurchasePrice(investment.amount, investment.discount_percentage);
                  const realizedReturn = calculateReturn(investment.amount, investment.discount_percentage);

                  return (
                    <tr key={investment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono font-bold text-green-600">{investment.ptt_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {investment.exporter ? (
                          <>
                            <div className="text-sm font-medium text-gray-900">{investment.exporter.company_name}</div>
                            <div className="text-xs text-gray-500">{investment.exporter.contact_person}</div>
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {investment.currency} {purchasePrice.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {investment.currency} {investment.amount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-green-600">
                          +{investment.currency} {realizedReturn.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">+{investment.discount_percentage}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {investment.settled_at ? formatDate(investment.settled_at) : 'N/A'}
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
