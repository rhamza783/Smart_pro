import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

interface CategoryPieChartProps {
  data: { category: string, revenue: number, percentage: number }[];
}

const COLORS = ['#6750A4', '#2196F3', '#4CAF50', '#FF9800', '#00BCD4', '#F44336', '#FFEB3B'];

const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ data }) => {
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <div className="h-[300px] w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="revenue"
            nameKey="category"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            content={({ active, payload }: any) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-background shadow-2xl rounded-2xl p-4 border border-primary/10">
                    <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">{payload[0].name}</p>
                    <p className="text-lg font-black text-primary">PKR {payload[0].value.toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-text-secondary">{payload[0].payload.percentage.toFixed(1)}% of total</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconType="circle"
            formatter={(value, entry: any, index) => (
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider ml-1">
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Center Label */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
        <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Total</p>
        <p className="text-sm font-black text-primary">PKR {(totalRevenue / 1000).toFixed(1)}k</p>
      </div>
    </div>
  );
};

export default CategoryPieChart;
