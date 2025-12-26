import StatCard from '@/components/StatCard';

export default function SettlementsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settlement Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Pending Settlements"
          value={0}
          subtitle="Discounted PTTs"
          color="orange"
        />
        <StatCard
          title="Due This Week"
          value={0}
          subtitle="Within 7 days"
          color="blue"
        />
        <StatCard
          title="Overdue"
          value={0}
          subtitle="Past maturity"
          color="orange"
        />
        <StatCard
          title="Total Amount"
          value="$0"
          subtitle="To be settled"
          color="green"
        />
      </div>

      <div className="rounded-lg bg-white p-8 shadow-md border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-6">PTTs Ready for Settlement</h2>
        <div className="flex items-center justify-center py-16">
          <p className="text-gray-500">No PTTs pending settlement</p>
        </div>
      </div>
    </div>
  );
}
