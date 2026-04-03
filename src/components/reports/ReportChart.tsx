import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  CartesianGrid,
  Legend
} from 'recharts';

interface ReportChartProps {
  data: any[];
  chartType: 'bar' | 'horizontalBar' | 'pie' | 'line';
  xKey: string;
  yKey: string;
}

const COLORS = ['#FF6B6B', '#4ECDC4', '#FFB347', '#9B59B6', '#3498DB', '#F1C40F', '#E67E22', '#1ABC9C'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background shadow-2xl rounded-2xl p-4 border border-primary/10">
        <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">{label || payload[0].name}</p>
        <p className="text-lg font-black text-primary">PKR {payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

const ReportChart: React.FC<ReportChartProps> = ({ data, chartType, xKey, yKey }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] w-full bg-background rounded-[32px] shadow-neumorphic flex items-center justify-center text-text-secondary font-bold">
        No data available for chart
      </div>
    );
  }

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
            <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8E9299', fontWeight: 600 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8E9299', fontWeight: 600 }} tickFormatter={(val) => `PKR ${(val / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey={yKey} fill="#6750A4" radius={[6, 6, 0, 0]} barSize={32} />
          </BarChart>
        );
      case 'horizontalBar':
        return (
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" />
            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8E9299', fontWeight: 600 }} tickFormatter={(val) => `PKR ${(val / 1000).toFixed(0)}k`} />
            <YAxis dataKey={xKey} type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8E9299', fontWeight: 600 }} width={100} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey={yKey} fill="#6750A4" radius={[0, 6, 6, 0]} barSize={20} />
          </BarChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey={yKey} nameKey={xKey}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider ml-1">{value}</span>} />
          </PieChart>
        );
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
            <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8E9299', fontWeight: 600 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8E9299', fontWeight: 600 }} tickFormatter={(val) => `PKR ${(val / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey={yKey} stroke="#6750A4" strokeWidth={3} dot={{ r: 4, fill: '#6750A4', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
          </LineChart>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-[300px] w-full bg-background rounded-[32px] p-8 shadow-neumorphic">
      <ResponsiveContainer width="100%" height="100%">
        {renderChart() as any}
      </ResponsiveContainer>
    </div>
  );
};

export default ReportChart;
