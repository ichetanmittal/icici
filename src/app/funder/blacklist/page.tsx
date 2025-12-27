'use client';

import { useState, useEffect, useRef } from 'react';

type EntityType = 'Exporter' | 'Importer' | 'Funder';
type FilterType = 'all' | 'Exporter' | 'Importer' | 'Funder';

interface BlacklistEntry {
  id: string;
  entity_id: string;
  entity_name: string;
  entity_type: EntityType;
  reason: string;
  added_at: string;
  added_by: string;
}

interface AvailableEntity {
  id: string;
  name: string;
  type: EntityType;
}

export default function BlacklistPage() {
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [filteredBlacklist, setFilteredBlacklist] = useState<BlacklistEntry[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableEntities, setAvailableEntities] = useState<AvailableEntity[]>([]);
  const [selectedEntityType, setSelectedEntityType] = useState<EntityType>('Exporter');

  const [formData, setFormData] = useState({
    entityId: '',
    reason: '',
  });
  const [addLoading, setAddLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchBlacklist();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [blacklist, activeFilter]);

  // Close modal on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowAddModal(false);
      }
    };

    if (showAddModal) {
      document.addEventListener('mousedown', handleClickOutside);
      fetchAvailableEntities();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAddModal, selectedEntityType]);

  const fetchBlacklist = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/blacklist');
      const data = await response.json();

      if (response.ok) {
        setBlacklist(data.blacklist || []);
      }
    } catch (error) {
      console.error('Error fetching blacklist:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableEntities = async () => {
    try {
      const response = await fetch(`/api/admin/available-entities?type=${selectedEntityType}`);
      const data = await response.json();

      if (response.ok) {
        setAvailableEntities(data.entities || []);
      }
    } catch (error) {
      console.error('Error fetching available entities:', error);
    }
  };

  const applyFilter = () => {
    if (activeFilter === 'all') {
      setFilteredBlacklist(blacklist);
    } else {
      setFilteredBlacklist(blacklist.filter(item => item.entity_type === activeFilter));
    }
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
  };

  const handleAddToBlacklist = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const selectedEntity = availableEntities.find(e => e.id === formData.entityId);

      const response = await fetch('/api/admin/blacklist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityId: formData.entityId,
          entityName: selectedEntity?.name,
          entityType: selectedEntityType,
          reason: formData.reason,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Entity added to blacklist successfully!' });
        setFormData({ entityId: '', reason: '' });
        fetchBlacklist();
        setTimeout(() => {
          setShowAddModal(false);
          setMessage({ type: '', text: '' });
        }, 2000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to add to blacklist' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveFromBlacklist = async (id: string) => {
    if (!confirm('Are you sure you want to remove this entity from the blacklist?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/blacklist', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        fetchBlacklist();
      }
    } catch (error) {
      console.error('Error removing from blacklist:', error);
    }
  };

  const getTypeBadge = (type: EntityType) => {
    const colors = {
      Exporter: 'bg-blue-100 text-blue-800',
      Importer: 'bg-orange-100 text-orange-800',
      Funder: 'bg-purple-100 text-purple-800',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[type]}`}>
        {type}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Blacklisted Organizations</h1>
          <p className="text-gray-600">Manage entities restricted from your network</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add to Blacklist
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2 border-b border-gray-200">
        <button
          onClick={() => handleFilterChange('all')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeFilter === 'all'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          All ({blacklist.length})
        </button>
        <button
          onClick={() => handleFilterChange('Exporter')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeFilter === 'Exporter'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Exporters ({blacklist.filter(b => b.entity_type === 'Exporter').length})
        </button>
        <button
          onClick={() => handleFilterChange('Importer')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeFilter === 'Importer'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Importers ({blacklist.filter(b => b.entity_type === 'Importer').length})
        </button>
        <button
          onClick={() => handleFilterChange('Funder')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeFilter === 'Funder'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Funders ({blacklist.filter(b => b.entity_type === 'Funder').length})
        </button>
      </div>

      {/* Table */}
      <div className="rounded-lg bg-white shadow-md border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent"></div>
          </div>
        ) : filteredBlacklist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-500 mb-1">No blacklisted organizations</p>
            <p className="text-sm text-gray-400">Add entities to the blacklist to restrict them</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entity Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Added
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBlacklist.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{entry.entity_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTypeBadge(entry.entity_type)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-md">{entry.reason}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(entry.added_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleRemoveFromBlacklist(entry.id)}
                        className="text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add to Blacklist Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div ref={modalRef} className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
              <h2 className="text-xl font-bold text-gray-900">Add to Blacklist</h2>
              <button
                onClick={() => setShowAddModal(false)}
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

              <form onSubmit={handleAddToBlacklist} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Entity Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['Exporter', 'Importer', 'Funder'] as EntityType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setSelectedEntityType(type);
                          setFormData({ ...formData, entityId: '' });
                        }}
                        className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                          selectedEntityType === type
                            ? 'border-red-600 bg-red-50 text-red-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="entityId" className="block text-sm font-medium text-gray-700 mb-2">
                    Select {selectedEntityType} <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="entityId"
                    name="entityId"
                    required
                    value={formData.entityId}
                    onChange={(e) => setFormData({ ...formData, entityId: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  >
                    <option value="">Select {selectedEntityType}</option>
                    {availableEntities.map((entity) => (
                      <option key={entity.id} value={entity.id}>
                        {entity.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Blacklisting <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="reason"
                    name="reason"
                    required
                    rows={4}
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                    placeholder="Provide a detailed reason for blacklisting this entity..."
                  />
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={addLoading}
                    className="flex-1 bg-red-600 text-white rounded-lg px-6 py-3 font-medium hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {addLoading ? 'Adding to Blacklist...' : 'Add to Blacklist'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
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
