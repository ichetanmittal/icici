interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color: 'green' | 'orange' | 'purple' | 'blue';
}

export default function StatCard({ title, value, subtitle, color }: StatCardProps) {
  const colorClasses = {
    green: 'text-green-600',
    orange: 'text-orange-500',
    purple: 'text-purple-600',
    blue: 'text-blue-600',
  };

  return (
    <div className="rounded-lg bg-white p-5 shadow-md border border-gray-200">
      <h3 className="text-xs font-medium text-gray-600 mb-1">{title}</h3>
      <p className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</p>
      {subtitle && (
        <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
      )}
    </div>
  );
}
