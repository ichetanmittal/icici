'use client';

import { useState, useEffect, useRef } from 'react';

type FilterType = 'all' | 'pending' | 'active';

interface NetworkMember {
  id: string;
  name: string;
  type: 'Exporter' | 'Bank';
  geography: string;
  creditLimit: number | null;
  status: 'pending' | 'active';
  pocName: string;
  pocEmail: string;
  pocPhone: string;
  bankAccountNumber?: string;
  swiftCode?: string;
}

export default function FunderNetworkPage() {
  const [networkMembers, setNetworkMembers] = useState<NetworkMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<NetworkMember[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingLimit, setEditingLimit] = useState<string | null>(null);
  const [editLimitValue, setEditLimitValue] = useState('');

  const [formData, setFormData] = useState({
    entityName: '',
    geography: '',
    pocName: '',
    pocEmail: '',
    pocPhone: '',
    creditLimit: '',
    bankAccountNumber: '',
    swiftCode: '',
  });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const modalRef = useRef<HTMLDivElement>(null);

  // Fetch network members
  useEffect(() => {
    fetchNetworkMembers();
  }, []);

  // Apply filters
  useEffect(() => {
    applyFilter();
  }, [networkMembers, activeFilter]);

  // Close modal on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowInviteModal(false);
      }
    };

    if (showInviteModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showInviteModal]);

  const fetchNetworkMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/funder/network');
      const data = await response.json();

      if (response.ok) {
        setNetworkMembers(data.members || []);
      }
    } catch (error) {
      console.error('Error fetching network members:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    if (activeFilter === 'all') {
      setFilteredMembers(networkMembers);
    } else if (activeFilter === 'pending') {
      setFilteredMembers(networkMembers.filter(m => m.status === 'pending'));
    } else if (activeFilter === 'active') {
      setFilteredMembers(networkMembers.filter(m => m.status === 'active'));
    }
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/invite-exporter', {
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
          bankAccountNumber: '',
          swiftCode: '',
        });
        // Refresh network members
        fetchNetworkMembers();
        // Close modal after 2 seconds
        setTimeout(() => {
          setShowInviteModal(false);
          setMessage({ type: '', text: '' });
        }, 2000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send invitation' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while sending the invitation' });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleEditLimit = (memberId: string, currentLimit: number | null) => {
    setEditingLimit(memberId);
    setEditLimitValue(currentLimit?.toString() || '');
  };

  const handleSaveLimit = async (memberId: string, memberType: string) => {
    try {
      const response = await fetch('/api/funder/update-credit-limit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberId,
          memberType,
          creditLimit: parseFloat(editLimitValue),
        }),
      });

      if (response.ok) {
        // Update local state
        setNetworkMembers(prev =>
          prev.map(m =>
            m.id === memberId ? { ...m, creditLimit: parseFloat(editLimitValue) } : m
          )
        );
        setEditingLimit(null);
      }
    } catch (error) {
      console.error('Error updating credit limit:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingLimit(null);
    setEditLimitValue('');
  };

  const getStatusBadge = (status: string) => {
    if (status === 'pending') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Pending
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Active
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    if (type === 'Bank') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          Bank POC
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        Exporter
      </span>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Managing Network</h1>
          <p className="text-gray-600">Manage exporters and bank partners in your network</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Exporter
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2 border-b border-gray-200">
        <button
          onClick={() => handleFilterChange('all')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeFilter === 'all'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          All ({networkMembers.length})
        </button>
        <button
          onClick={() => handleFilterChange('pending')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeFilter === 'pending'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Pending Invitations ({networkMembers.filter(m => m.status === 'pending').length})
        </button>
        <button
          onClick={() => handleFilterChange('active')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeFilter === 'active'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Active ({networkMembers.filter(m => m.status === 'active').length})
        </button>
      </div>

      {/* Table */}
      <div className="rounded-lg bg-white shadow-md border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">No network members found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Geography
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    POC
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credit Limit (USD)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{member.name}</div>
                      <div className="text-sm text-gray-500">{member.pocEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTypeBadge(member.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.geography}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.pocName}</div>
                      <div className="text-sm text-gray-500">{member.pocPhone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingLimit === member.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={editLimitValue}
                            onChange={(e) => setEditLimitValue(e.target.value)}
                            className="w-32 rounded border border-gray-300 px-2 py-1 text-sm"
                            placeholder="0.00"
                          />
                          <button
                            onClick={() => handleSaveLimit(member.id, member.type)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-red-600 hover:text-red-700"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-900">
                          ${member.creditLimit?.toLocaleString() || '0'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(member.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleEditLimit(member.id, member.creditLimit)}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Edit Limit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div ref={modalRef} className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Invite Exporter</h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-6">
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
                    placeholder="Enter exporter company name"
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Banking Information</h3>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="bankAccountNumber" className="block text-sm font-medium text-gray-700 mb-2">
                        Bank Account Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="bankAccountNumber"
                        name="bankAccountNumber"
                        required
                        value={formData.bankAccountNumber}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Account number"
                      />
                    </div>

                    <div>
                      <label htmlFor="swiftCode" className="block text-sm font-medium text-gray-700 mb-2">
                        IFSC / SWIFT Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="swiftCode"
                        name="swiftCode"
                        required
                        value={formData.swiftCode}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="SWIFT/IFSC code"
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
                      Maximum credit limit for this exporter
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={inviteLoading}
                    className="flex-1 bg-blue-600 text-white rounded-lg px-6 py-3 font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {inviteLoading ? 'Sending Invitation...' : 'Send Invitation'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        entityName: '',
                        geography: '',
                        pocName: '',
                        pocEmail: '',
                        pocPhone: '',
                        creditLimit: '',
                        bankAccountNumber: '',
                        swiftCode: '',
                      });
                    }}
                    className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
