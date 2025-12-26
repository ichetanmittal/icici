export default function FunderBlacklistPage() {
  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Blacklisted Organizations</h1>
          <p className="text-gray-600">Manage exporters restricted from your bank</p>
        </div>
        <button className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2">
          <span className="text-lg">+</span>
          Add to Blacklist
        </button>
      </div>

      <div className="rounded-lg bg-white p-8 shadow-md border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Blacklisted Exporters (0)</h2>
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-500 mb-1">No blacklisted organizations</p>
          <p className="text-sm text-gray-400">Add exporters to the blacklist to restrict them</p>
        </div>
      </div>
    </div>
  );
}
