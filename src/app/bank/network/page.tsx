'use client';

import { useState } from 'react';

export default function NetworkManagementPage() {
  const [formData, setFormData] = useState({
    entityName: '',
    geography: '',
    pocName: '',
    pocEmail: '',
    pocPhone: '',
    creditLimit: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/invite-importer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Invitation sent successfully!' });
        setFormData({
          entityName: '',
          geography: '',
          pocName: '',
          pocEmail: '',
          pocPhone: '',
          creditLimit: '',
        });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send invitation' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while sending the invitation' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Managing Network</h1>
        <p className="text-gray-600">Invite and manage importers in your network</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Invite Form */}
        <div className="lg:col-span-2">
          <div className="rounded-lg bg-white p-8 shadow-md border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Invite Importer</h2>

            {message.text && (
              <div className={`mb-6 p-4 rounded-lg ${
                message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <p className={`text-sm ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                  {message.text}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="entityName" className="block text-sm font-medium text-gray-700 mb-2">
                  Entity Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="entityName"
                  name="entityName"
                  required
                  value={formData.entityName}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter importer company name"
                />
              </div>

              <div>
                <label htmlFor="geography" className="block text-sm font-medium text-gray-700 mb-2">
                  Geography <span className="text-red-500">*</span>
                </label>
                <select
                  id="geography"
                  name="geography"
                  required
                  value={formData.geography}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select geography</option>
                  <option value="India">India</option>
                  <option value="Singapore">Singapore</option>
                  <option value="UAE">UAE</option>
                  <option value="USA">USA</option>
                  <option value="UK">UK</option>
                  <option value="China">China</option>
                  <option value="Japan">Japan</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">POC Information</h3>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="pocName" className="block text-sm font-medium text-gray-700 mb-2">
                      POC Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="pocName"
                      name="pocName"
                      required
                      value={formData.pocName}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Point of Contact name"
                    />
                  </div>

                  <div>
                    <label htmlFor="pocEmail" className="block text-sm font-medium text-gray-700 mb-2">
                      POC Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="pocEmail"
                      name="pocEmail"
                      required
                      value={formData.pocEmail}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="poc@company.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="pocPhone" className="block text-sm font-medium text-gray-700 mb-2">
                      POC Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="pocPhone"
                      name="pocPhone"
                      required
                      value={formData.pocPhone}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="+91 9876543210"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Credit Limit Assignment</h3>

                <div>
                  <label htmlFor="creditLimit" className="block text-sm font-medium text-gray-700 mb-2">
                    Credit Limit (USD) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <span className="text-gray-500">$</span>
                    </div>
                    <input
                      type="number"
                      id="creditLimit"
                      name="creditLimit"
                      required
                      min="0"
                      step="1000"
                      value={formData.creditLimit}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 pl-8 pr-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Maximum credit limit for this importer
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white rounded-lg px-6 py-3 font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending Invitation...' : 'Send Invitation'}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({
                    entityName: '',
                    geography: '',
                    pocName: '',
                    pocEmail: '',
                    pocPhone: '',
                    creditLimit: '',
                  })}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Invited Importers List */}
        <div className="lg:col-span-1">
          <div className="rounded-lg bg-white p-6 shadow-md border border-gray-200 sticky top-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Invitations</h2>
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 text-center">No invitations sent yet</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
