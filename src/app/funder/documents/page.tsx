export default function FunderDocumentsPage() {
  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Documents</h1>
          <p className="text-gray-600">Manage and view all transaction documents</p>
        </div>
        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
          <span className="text-lg">+</span>
          Upload Document
        </button>
      </div>

      <div className="rounded-lg bg-white p-8 shadow-md border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-6">All Documents</h2>
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500 mb-1">No documents</p>
          <p className="text-sm text-gray-400">Upload documents to get started</p>
        </div>
      </div>
    </div>
  );
}
