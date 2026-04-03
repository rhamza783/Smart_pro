import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

interface HourlySalesChartProps {
  data: { hour: string, revenue: number, count: number }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background shadow-2xl rounded-2xl p-4 border border-primary/10">
        <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">{label}</p>
        <p className="text-lg font-black text-primary">PKR {payload[0].value.toLocaleString()}</p>
        <p className="text-[10px] font-bold text-text-secondary">{payload[0].payload.count} Orders</p>
      </div>
    );
  }
  return null;
};

const HourlySalesChart: React.FC<HourlySalesChartProps> = ({ data }) => {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
          <XAxis 
            dataKey="hour" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#8E9299', fontWeight: 600 }}
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#8E9299', fontWeight: 600 }}
            tickFormatter={(value) => `PKR ${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(103, 80, 164, 0.05)' }} />
          <Bar 
            dataKey="revenue" 
            fill="#6750A4" 
            radius={[6, 6, 0, 0]} 
            barSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HourlySalesChart;
