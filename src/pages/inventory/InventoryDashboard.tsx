import React, { useMemo, useState } from 'react';
import { useInventoryStore } from '../../store/inventoryStore';
import { getStockStatus, getStatusColor, getStatusLabel, formatQty } from '../../utils/inventoryUtils';
import { 
  Package, 
  AlertTriangle, 
  AlertCircle, 
  DollarSign, 
  History, 
  TrendingUp, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import StockAdjustmentModal from '../../components/modals/StockAdjustmentModal';

const InventoryDashboard: React.FC = () => {
  const { 
    getActiveIngredients, 
    getStockQty, 
    getStockValue, 
    movements, 
    ingredients 
  } = useInventoryStore();
  
  const [adjustingIngredient, setAdjustingIngredient] = useState<any>(null);

  const activeIngredients = getActiveIngredients();
  const lowStockItems = activeIngredients.filter(ing => {
    const qty = getStockQty(ing.id);
    return qty <= ing.minThreshold && qty > 0;
  });
  const outOfStockItems = activeIngredients.filter(ing => getStockQty(ing.id) === 0);
  const totalStockValue = getStockValue();

  const kpiCards = [
    { label: 'Total Ingredients', value: activeIngredients.length, icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Low Stock Items', value: lowStockItems.length, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100' },
    { label: 'Out of Stock', value: outOfStockItems.length, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' },
    { label: 'Stock Value', value: `PKR ${totalStockValue.toLocaleString()}`, icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  const attentionItems = useMemo(() => {
    return activeIngredients
      .filter(ing => getStockQty(ing.id) <= ing.minThreshold)
      .sort((a, b) => getStockQty(a.id) - getStockQty(b.id))
      .slice(0, 5);
  }, [activeIngredients, getStockQty]);

  const recentMovements = useMemo(() => {
    return movements.slice(0, 10).map(m => {
      const ing = ingredients.find(i => i.id === m.ingredientId);
      return { ...m, ingredientName: ing?.name || 'Unknown' };
    });
  }, [movements, ingredients]);

  const chartData = useMemo(() => {
    return activeIngredients
      .map(ing => ({
        name: ing.name,
        value: getStockQty(ing.id) * ing.costPerUnit
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [activeIngredients, getStockQty]);

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case 'PURCHASE': return 'text-blue-600 bg-blue-100';
      case 'MANUAL': return 'text-orange-600 bg-orange-100';
      case 'WASTAGE': return 'text-red-600 bg-red-100';
      case 'SALE': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, idx) => (
          <div key={idx} className="bg-background rounded-3xl p-6 shadow-neumorphic flex flex-col gap-4 border-l-4 border-primary/20">
            <div className={`w-12 h-12 rounded-2xl ${card.bg} flex items-center justify-center ${card.color}`}>
              <card.icon size={24} />
            </div>
            <div>
              <p className="text-2xl font-black text-text-primary">{card.value}</p>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Items Needing Attention */}
        <div className="bg-background rounded-[32px] p-8 shadow-neumorphic space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle size={24} className="text-orange-500" />
              <h2 className="text-xl font-black text-primary uppercase tracking-tight">Items Needing Attention</h2>
            </div>
          </div>

          {attentionItems.length > 0 ? (
            <div className="space-y-4">
              {attentionItems.map((ing) => {
                const qty = getStockQty(ing.id);
                const status = getStockStatus(qty, ing.minThreshold);
                return (
                  <div key={ing.id} className="flex items-center justify-between p-4 rounded-2xl bg-background shadow-neumorphic-inset">
                    <div className="space-y-1">
                      <p className="font-black text-primary">{ing.name}</p>
                      <p className="text-xs font-bold text-text-secondary">
                        {formatQty(qty, ing.unit)} / min {formatQty(ing.minThreshold, ing.unit)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black ${getStatusColor(status)}`}>
                        {getStatusLabel(status)}
                      </span>
                      <button 
                        onClick={() => setAdjustingIngredient(ing)}
                        className="p-2 rounded-xl bg-background shadow-neumorphic text-primary hover:shadow-neumorphic-inset transition-all"
                      >
                        <TrendingUp size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <CheckCircle2 size={32} />
              </div>
              <p className="font-bold text-text-secondary">All stock levels are healthy</p>
            </div>
          )}
        </div>

        {/* Recent Movements */}
        <div className="bg-background rounded-[32px] p-8 shadow-neumorphic space-y-6">
          <div className="flex items-center gap-3">
            <History size={24} className="text-primary" />
            <h2 className="text-xl font-black text-primary uppercase tracking-tight">Recent Movements</h2>
          </div>

          <div className="space-y-4">
            {recentMovements.length > 0 ? (
              recentMovements.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-4 rounded-2xl bg-background shadow-neumorphic-inset">
                  <div className="flex items-center gap-4">
                    <div className={`px-2 py-1 rounded-lg text-[10px] font-black ${getMovementTypeColor(m.type)}`}>
                      {m.type}
                    </div>
                    <div>
                      <p className="text-sm font-black text-text-primary">{m.ingredientName}</p>
                      <p className="text-[10px] font-bold text-text-secondary">
                        {new Date(m.timestamp).toLocaleTimeString()} • {m.reason}
                      </p>
                    </div>
                  </div>
                  <div className={`text-sm font-black ${m.delta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {m.delta > 0 ? '+' : ''}{m.delta}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-12 text-text-secondary font-bold">No recent movements</p>
            )}
          </div>
        </div>
      </div>

      {/* Stock Value Chart */}
      <div className="bg-background rounded-[32px] p-8 shadow-neumorphic space-y-6">
        <div className="flex items-center gap-3">
          <TrendingUp size={24} className="text-primary" />
          <h2 className="text-xl font-black text-primary uppercase tracking-tight">Top 10 Ingredients by Value</h2>
        </div>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e0e0e0" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                tick={{ fontSize: 12, fontWeight: 'bold', fill: '#666' }}
                width={100}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                formatter={(value: number) => [`PKR ${value.toLocaleString()}`, 'Value']}
              />
              <Bar dataKey="value" radius={[0, 10, 10, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="#6750A4" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {adjustingIngredient && (
        <StockAdjustmentModal 
          ingredient={adjustingIngredient}
          currentQty={getStockQty(adjustingIngredient.id)}
          onClose={() => setAdjustingIngredient(null)}
        />
      )}
    </div>
  );
};

export default InventoryDashboard;
