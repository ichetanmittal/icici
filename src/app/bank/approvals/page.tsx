export default function PendingApprovalsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Pending Approvals</h1>

      <div className="rounded-lg bg-white p-8 shadow-md border border-gray-200">
        <div className="flex items-center justify-center py-16">
          <p className="text-gray-500">No pending approvals</p>
        </div>
      </div>
    </div>
  );
}
