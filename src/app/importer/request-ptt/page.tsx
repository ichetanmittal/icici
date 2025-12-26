'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const INCOTERMS = [
  { value: 'FOB', label: 'FOB - Free On Board' },
  { value: 'CIF', label: 'CIF - Cost, Insurance & Freight' },
  { value: 'EXW', label: 'EXW - Ex Works' },
  { value: 'DDP', label: 'DDP - Delivered Duty Paid' },
];

export default function RequestPTT() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
    exporter: '',
    exporterBank: '',
    maturityDays: '90',
    incoterms: 'FOB',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Reset exporter bank when exporter changes
    if (name === 'exporter') {
      setFormData(prev => ({
        ...prev,
        exporterBank: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // TODO: Implement API call to create PTT request
      console.log('PTT Request:', formData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Redirect to dashboard after successful submission
      router.push('/importer/dashboard');
    } catch (err) {
      setError('Failed to submit PTT request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/importer/dashboard');
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Request PTT</h1>
        <p className="text-gray-600">Submit a request for Post-Shipment Trade Token</p>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                id="amount"
                name="amount"
                required
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={handleChange}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="100000"
              />
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-32 rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
                <option value="SGD">SGD</option>
              </select>
            </div>
          </div>

          {/* Exporter */}
          <div>
            <label htmlFor="exporter" className="block text-sm font-medium text-gray-700 mb-2">
              Exporter <span className="text-red-500">*</span>
            </label>
            <select
              id="exporter"
              name="exporter"
              required
              value={formData.exporter}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select Exporter</option>
              {/* TODO: Load exporters from database */}
            </select>
            <p className="mt-2 text-sm text-gray-500">
              No connected exporters. Please connect with exporters first.
            </p>
          </div>

          {/* Exporter's Bank */}
          <div>
            <label htmlFor="exporterBank" className="block text-sm font-medium text-gray-700 mb-2">
              Exporter's Bank
            </label>
            <select
              id="exporterBank"
              name="exporterBank"
              value={formData.exporterBank}
              onChange={handleChange}
              disabled={!formData.exporter}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select exporter first</option>
              {/* TODO: Load exporter's bank after exporter is selected */}
            </select>
          </div>

          {/* Maturity (Days) */}
          <div>
            <label htmlFor="maturityDays" className="block text-sm font-medium text-gray-700 mb-2">
              Maturity (Days) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="maturityDays"
              name="maturityDays"
              required
              min="1"
              max="365"
              value={formData.maturityDays}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="90"
            />
          </div>

          {/* Incoterms */}
          <div>
            <label htmlFor="incoterms" className="block text-sm font-medium text-gray-700 mb-2">
              Incoterms <span className="text-red-500">*</span>
            </label>
            <select
              id="incoterms"
              name="incoterms"
              required
              value={formData.incoterms}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {INCOTERMS.map((term) => (
                <option key={term.value} value={term.value}>
                  {term.label}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white rounded-lg px-6 py-3 font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Request PTT'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-8 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
