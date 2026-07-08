import React from 'react';
import { type LucideIcon } from 'lucide-react';

export function CTAStatCard({ icon: Icon, label, value, trend, color }: {
  icon: LucideIcon; label: string; value: string | number; trend?: 'up' | 'down'; color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-gcp-blue/10 border-gcp-blue/20 text-gcp-blue',
    green: 'bg-gcp-green/10 border-gcp-green/20 text-gcp-green',
    red: 'bg-gcp-red/10 border-gcp-red/20 text-gcp-red',
    yellow: 'bg-gcp-yellow/10 border-gcp-yellow/20 text-gcp-yellow',
  };
  const c = colorMap[color] || colorMap.blue;
  return (
    <div className={`rounded-lg border p-4 ${c}`}>
      <div className="flex items-center gap-3">
        <Icon size={20} />
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs opacity-70">{label}</div>
        </div>
      </div>
    </div>
  );
}
