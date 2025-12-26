import StatCard from '@/components/StatCard';

export default function OutstandingPTTsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Outstanding PTTs</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Outstanding"
          value={0}
          color="blue"
        />
        <StatCard
          title="Active"
          value={0}
          color="green"
        />
        <StatCard
          title="Discounted"
          value={0}
          color="orange"
        />
        <StatCard
          title="Total Exposure"
          value="$0"
          color="purple"
        />
      </div>

      <div className="rounded-lg bg-white p-8 shadow-md border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-6">All Outstanding PTTs</h2>
        <div className="flex items-center justify-center py-16">
          <p className="text-gray-500">No outstanding PTTs</p>
        </div>
      </div>
    </div>
  );
}
