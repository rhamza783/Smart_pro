import React, { useState, useEffect } from 'react';
import { useTableStore } from '../store/tableStore';
import { useLayoutStore } from '../store/layoutStore';
import { useCartStore } from '../store/cartStore';
import { useSettingsStore } from '../store/settingsStore';
import { Activity, RefreshCw, ArrowRightLeft, GitMerge, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TransferTableModal from '../components/modals/TransferTableModal';
import MergeOrderModal from '../components/modals/MergeOrderModal';
import { usePermission } from '../hooks/usePermission';

const ActiveOrdersPage: React.FC = () => {
  const { orders } = useTableStore();
  const { loadFromOrder } = useCartStore();
  const { setActiveSection } = useLayoutStore();
  const { activeOrdersDisplay } = useSettingsStore();
  const { hasPerm } = usePermission();
  const [groupByZone, setGroupByZone] = useState(activeOrdersDisplay.groupByZone);
  const [now, setNow] = useState(Date.now());
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, order: any } | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const activeOrders = Object.values(orders).filter(o => o.status === 'active');

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const totalActiveRevenue = activeOrders.reduce((acc, o) => acc + o.total, 0);
  const activeCount = activeOrders.length;

  const getTimerColor = (startTime: number) => {
    const diff = (now - startTime) / 60000;
    if (diff > 60) return 'text-red-600 font-bold animate-pulse';
    if (diff > 30) return 'text-red-500';
    if (diff > 10) return 'text-orange-500';
    return 'text-green-600';
  };

  const getTileBg = (startTime: number) => {
    const diff = (now - startTime) / 60000;
    if (diff > 60) return 'bg-red-50 border-2 border-red-400';
    if (diff > 30) return 'bg-red-50';
    if (diff > 10) return 'bg-orange-50';
    return 'bg-[#E0E5EC]';
  };

  const handleOrderClick = (order: any) => {
    loadFromOrder(order);
    setActiveSection('menu');
  };

  const handleContextMenu = (e: React.MouseEvent, order: any) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, order });
  };

  const handleAction = (action: 'transfer' | 'merge', order: any) => {
    setSelectedOrder(order);
    setContextMenu(null);
    if (action === 'transfer') setIsTransferModalOpen(true);
    if (action === 'merge') setIsMergeModalOpen(true);
  };

  const zones = [
    { id: 'dinein', name: 'Dine In', color: 'bg-blue-100 text-blue-700' },
    { id: 'takeaway', name: 'Take Away', color: 'bg-green-100 text-green-700' },
    { id: 'delivery', name: 'Delivery', color: 'bg-purple-100 text-purple-700' },
  ];

  const renderTiles = (orders: any[]) => (
    <div className="flex flex-wrap gap-4 p-4">
      {orders.map((o) => {
        const zone = zones.find(z => z.id === o.zoneId) || zones[0];
        const diff = Math.floor((now - o.startTime) / 60000);
        const settings = activeOrdersDisplay[o.zoneId as keyof typeof activeOrdersDisplay] as any || activeOrdersDisplay.dinein;

        return (
          <motion.div
            key={o.table}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleOrderClick(o)}
            onContextMenu={(e) => handleContextMenu(e, o)}
            className={`cursor-pointer rounded-2xl shadow-[6px_6px_12px_#b8b9be,-6px_-6px_12px_#ffffff] p-4 flex flex-col justify-between relative group ${getTileBg(o.startTime)}`}
            style={{
              width: settings.tileAutoSize ? 'auto' : settings.tileWidth,
              height: settings.tileAutoSize ? 'auto' : settings.tileHeight,
              minWidth: settings.tileMinItemWidth,
              borderRadius: settings.tileBorderRadius,
            }}
          >
            <div className="text-center">
              <div 
                className="font-bold text-gray-800 flex items-center justify-center gap-2"
                style={{ 
                  fontSize: settings.tableNameFontSize,
                  fontFamily: settings.uiFont.tableNameFamily,
                  fontWeight: settings.uiFont.tableNameStyle === 'Bold' ? 'bold' : 'normal'
                }}
              >
                {o.table}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContextMenu(e as any, o);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-black/5 rounded-lg transition-all"
                >
                  <MoreVertical size={14} />
                </button>
              </div>
              <div className={`text-[10px] px-2 py-0.5 rounded-full inline-block mt-1 ${zone.color}`}>
                {zone.name}
              </div>
            </div>

            <div 
              className={`text-center my-2 font-medium ${getTimerColor(o.startTime)}`}
              style={{ 
                fontSize: settings.timerFontSize,
                fontFamily: settings.uiFont.timerFamily,
              }}
            >
              {diff} min
            </div>

            <div className="flex justify-between items-center text-[10px] text-gray-500">
              <div className="group relative">
                <span>{o.items.length} items</span>
                <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50 bg-gray-800 text-white p-2 rounded-lg text-[10px] whitespace-nowrap shadow-xl">
                  {o.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-1">
                      {item.type === 'deal' && <span>🔥</span>}
                      <span>{item.name} x{item.qty}</span>
                    </div>
                  ))}
                </div>
              </div>
              <span className="font-bold text-purple-600">PKR {o.total.toLocaleString()}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#E0E5EC] p-6">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-8 px-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[#E0E5EC] shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff]">
            <Activity className="w-6 h-6 text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Active Orders</h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 bg-[#E0E5EC] p-2 px-4 rounded-2xl shadow-inner">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Active Revenue</span>
              <span className="text-lg font-bold text-green-600">PKR {totalActiveRevenue.toLocaleString()}</span>
            </div>
            <div className="w-px h-8 bg-gray-300 mx-2" />
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Orders</span>
              <span className="bg-purple-600 text-white px-3 py-0.5 rounded-full text-sm font-bold">
                {activeCount}
              </span>
            </div>
          </div>

          <button 
            onClick={() => setNow(Date.now())}
            className="p-3 rounded-xl bg-[#E0E5EC] shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] hover:shadow-inner transition-shadow"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Global Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-[#E0E5EC] p-1.5 rounded-2xl shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff] flex items-center">
          <button
            onClick={() => setGroupByZone(true)}
            className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${
              groupByZone ? 'bg-white shadow-md text-purple-600' : 'text-gray-500'
            }`}
          >
            Group by Zone
          </button>
          <button
            onClick={() => setGroupByZone(false)}
            className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${
              !groupByZone ? 'bg-white shadow-md text-purple-600' : 'text-gray-500'
            }`}
          >
            Flat Grid
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {groupByZone ? (
          <div className="space-y-12">
            {zones.map((z) => {
              const zoneOrders = activeOrders.filter(o => (o as any).zoneId === z.id);
              if (zoneOrders.length === 0) return null;
              const settings = activeOrdersDisplay[z.id as keyof typeof activeOrdersDisplay] as any || activeOrdersDisplay.dinein;

              return (
                <div key={z.id} style={{ paddingLeft: settings.groupHPadding, paddingRight: settings.groupHPadding }}>
                  <div className="flex items-center gap-4 mb-4">
                    <h2 
                      className="text-gray-700"
                      style={{ 
                        fontSize: settings.groupHeaderFontSize,
                        fontFamily: settings.uiFont.groupHeaderFamily,
                        fontWeight: settings.uiFont.groupHeaderStyle === 'Bold' ? 'bold' : 'normal'
                      }}
                    >
                      {z.name}
                      <span className="ml-2 text-sm font-normal text-gray-400">({zoneOrders.length})</span>
                    </h2>
                    {settings.groupLineStyle !== 'None' && (
                      <div 
                        className="flex-1" 
                        style={{ 
                          borderBottom: `${settings.groupLineThickness} ${settings.groupLineStyle.toLowerCase()} ${settings.groupLineColor}`,
                          marginTop: '4px'
                        }} 
                      />
                    )}
                  </div>
                  <div style={{ marginTop: settings.partitionGapTop, marginBottom: settings.partitionGapBottom }}>
                    {renderTiles(zoneOrders)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          renderTiles(activeOrders)
        )}
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <>
            <div 
              className="fixed inset-0 z-[110]" 
              onClick={() => setContextMenu(null)}
              onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{ top: contextMenu.y, left: contextMenu.x }}
              className="fixed z-[120] bg-white rounded-2xl shadow-2xl p-2 min-w-[160px] border border-gray-100"
            >
              <button 
                onClick={() => handleAction('transfer', contextMenu.order)}
                className="w-full flex items-center gap-3 p-3 hover:bg-purple-50 rounded-xl transition-colors text-gray-700 hover:text-purple-600 font-bold text-xs uppercase tracking-widest"
              >
                <ArrowRightLeft size={16} />
                Transfer Table
              </button>
              <button 
                onClick={() => handleAction('merge', contextMenu.order)}
                className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 rounded-xl transition-colors text-gray-700 hover:text-blue-600 font-bold text-xs uppercase tracking-widest"
              >
                <GitMerge size={16} />
                Merge Order
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {isTransferModalOpen && selectedOrder && (
          <TransferTableModal 
            currentTable={selectedOrder.table}
            onTransfer={() => {}}
            onClose={() => setIsTransferModalOpen(false)}
          />
        )}
        {isMergeModalOpen && selectedOrder && (
          <MergeOrderModal 
            currentTable={selectedOrder.table}
            onMerge={() => {}}
            onClose={() => setIsMergeModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ActiveOrdersPage;
