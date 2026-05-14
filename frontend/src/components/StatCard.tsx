interface StatCardProps {
  label: string
  value: string | number
  icon: string
  color?: 'green' | 'blue' | 'orange' | 'red'
  sub?: string
}

const colorMap = {
  green:  'bg-green-50  text-green-700  border-green-200',
  blue:   'bg-blue-50   text-blue-700   border-blue-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  red:    'bg-red-50    text-red-700    border-red-200',
}

export default function StatCard({ label, value, icon, color = 'green', sub }: StatCardProps) {
  return (
    <div className={`card flex items-center gap-4 border ${colorMap[color]}`}>
      <div className="text-3xl">{icon}</div>
      <div>
        <p className="text-xs font-medium opacity-70 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
        {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}
