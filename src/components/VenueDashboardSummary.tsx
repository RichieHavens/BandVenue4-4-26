import React from 'react';
import { AlertCircle, Clock, Calendar, CheckCircle } from 'lucide-react';
import { Card } from './ui/Card';

export function VenueDashboardSummary() {
  const stats = [
    { label: 'Pending Requests', value: 3, icon: Clock, color: 'text-amber-400' },
    { label: 'Awaiting Confirmation', value: 1, icon: CheckCircle, color: 'text-green-400' },
    { label: 'Upcoming This Week', value: 5, icon: Calendar, color: 'text-blue-400' },
    { label: 'Issues / Missing', value: 2, icon: AlertCircle, color: 'text-red-400' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, i) => (
        <Card key={i} className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-400 uppercase tracking-wider font-bold">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
          <stat.icon className={stat.color} size={24} />
        </Card>
      ))}
    </div>
  );
}
