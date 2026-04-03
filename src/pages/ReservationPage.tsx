import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  Users, 
  User, 
  Phone, 
  ChevronRight, 
  X, 
  Check, 
  AlertCircle,
  FileText,
  ChevronLeft,
  Edit2,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useReservationStore } from '../store/reservationStore';
import { useLayoutStore } from '../store/layoutStore';
import { useClientStore } from '../store/clientStore';
import { useAdvancePaymentStore } from '../store/advancePaymentStore';
import { useSettingsStore } from '../store/settingsStore';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { usePrompt } from '../hooks/usePrompt';
import { Reservation } from '../types';
import { formatCurrency } from '../utils/reportUtils';
import ClockTimePicker from '../components/ui/ClockTimePicker';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

const ReservationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'new' | 'all' | 'calendar'>('new');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const { 
    reservations, 
    settings, 
    addReservation, 
    updateReservation, 
    cancelReservation, 
    completeReservation,
    isTableFree,
    getFreeTables
  } = useReservationStore();
  
  const { tableLayout } = useLayoutStore();
  const { clients, addLedgerEntry } = useClientStore();
  const { addAdvance } = useAdvancePaymentStore();
  const { paymentMethods } = useSettingsStore();
  const { currentUser } = useAuthStore();
  const { showToast } = useToastStore();
  const { askConfirm } = usePrompt();

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    tableName: '',
    people: 2,
    clientName: '',
    clientPhone: '',
    clientId: '',
    notes: '',
    isAutoEnd: true,
    depositAmount: '',
    paymentMethod: paymentMethods[0] || 'Cash'
  });

  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);

  // Initialize start time
  useEffect(() => {
    if (!formData.startTime) {
      const now = new Date();
      now.setHours(now.getHours() + 1, 0, 0, 0);
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      setFormData(prev => ({ ...prev, startTime: `${h}:${m}` }));
    }
  }, []);

  // Auto-calculate end time
  useEffect(() => {
    if (formData.startTime && formData.isAutoEnd) {
      const [h, m] = formData.startTime.split(':').map(Number);
      const startMinutes = h * 60 + m;
      const endMinutes = startMinutes + settings.defaultDuration;
      const endH = String(Math.floor(endMinutes / 60) % 24).padStart(2, '0');
      const endM = String(endMinutes % 60).padStart(2, '0');
      setFormData(prev => ({ ...prev, endTime: `${endH}:${endM}` }));
    }
  }, [formData.startTime, settings.defaultDuration, formData.isAutoEnd]);

  const allTables = useMemo(() => {
    const tables: { name: string, zone: string }[] = [];
    tableLayout.forEach(zone => {
      zone.sections.forEach(section => {
        section.tables.forEach(table => {
          tables.push({ name: table.name, zone: zone.name });
        });
      });
    });
    return tables;
  }, [tableLayout]);

  const tableAvailability = useMemo(() => {
    if (!formData.date || !formData.startTime || !formData.endTime) return {};
    const map: Record<string, boolean> = {};
    allTables.forEach(t => {
      map[t.name] = isTableFree(t.name, formData.date, formData.startTime, formData.endTime, editingId || undefined);
    });
    return map;
  }, [formData.date, formData.startTime, formData.endTime, allTables, isTableFree, editingId]);

  const filteredClients = useMemo(() => {
    if (!clientSearch) return [];
    return clients.filter(c => 
      c.name.toLowerCase().includes(clientSearch.toLowerCase()) || 
      c.phone.includes(clientSearch)
    ).slice(0, 5);
  }, [clients, clientSearch]);

  const handleClientSelect = (client: any) => {
    setFormData(prev => ({
      ...prev,
      clientName: client.name,
      clientPhone: client.phone,
      clientId: client.id
    }));
    setClientSearch(client.name);
    setShowClientSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tableName) {
      showToast('Please select a table', 'error');
      return;
    }

    const isFree = isTableFree(formData.tableName, formData.date, formData.startTime, formData.endTime, editingId || undefined);
    
    if (!isFree && !settings.allowOverbooking) {
      showToast('Table is already reserved for this time slot', 'error');
      return;
    }

    const deposit = parseFloat(formData.depositAmount) || 0;
    let advanceId: string | undefined;

    if (deposit > 0) {
      const advance = addAdvance({
        type: 'reservation',
        clientId: formData.clientId || undefined,
        clientName: formData.clientName,
        clientPhone: formData.clientPhone,
        amount: deposit,
        paymentMethod: formData.paymentMethod,
        referenceNote: `Deposit for Table ${formData.tableName} on ${formData.date}`,
        status: 'active',
        createdBy: currentUser?.name || 'Staff'
      });
      advanceId = advance.id;

      if (formData.clientId) {
        addLedgerEntry(formData.clientId, {
          type: 'payment',
          credit: deposit,
          debit: 0,
          description: `Reservation Deposit — Table ${formData.tableName} (${formData.date})`,
          orderId: advanceId
        });
      }
    }

    const resData = {
      tableName: formData.tableName,
      clientName: formData.clientName,
      clientPhone: formData.clientPhone,
      clientId: formData.clientId || undefined,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      people: formData.people,
      notes: formData.notes,
      status: 'confirmed' as const,
      depositAmount: deposit || undefined,
      advanceId
    };

    if (editingId) {
      updateReservation(editingId, resData);
      showToast('Reservation updated successfully', 'success');
      setEditingId(null);
    } else {
      addReservation(resData);
      showToast('Reservation confirmed successfully', 'success');
    }

    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      startTime: '',
      endTime: '',
      tableName: '',
      people: 2,
      clientName: '',
      clientPhone: '',
      clientId: '',
      notes: '',
      isAutoEnd: true,
      depositAmount: '',
      paymentMethod: paymentMethods[0] || 'Cash'
    });
    setClientSearch('');
    setActiveTab('all');
  };

  const handleEdit = (res: Reservation) => {
    setFormData({
      date: res.date,
      startTime: res.startTime,
      endTime: res.endTime,
      tableName: res.tableName,
      people: res.people,
      clientName: res.clientName,
      clientPhone: res.clientPhone,
      clientId: res.clientId || '',
      notes: res.notes,
      isAutoEnd: false
    });
    setEditingId(res.id);
    setClientSearch(res.clientName);
    setActiveTab('new');
  };

  // List Filters
  const [listFilters, setListFilters] = useState({
    date: 'all',
    status: 'all',
    search: ''
  });

  const filteredReservations = useMemo(() => {
    return reservations.filter(r => {
      const matchesSearch = r.clientName.toLowerCase().includes(listFilters.search.toLowerCase()) || 
                           r.tableName.toLowerCase().includes(listFilters.search.toLowerCase());
      const matchesStatus = listFilters.status === 'all' || r.status === listFilters.status;
      
      let matchesDate = true;
      const today = new Date().toISOString().split('T')[0];
      if (listFilters.date === 'today') matchesDate = r.date === today;
      else if (listFilters.date === 'tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        matchesDate = r.date === tomorrow.toISOString().split('T')[0];
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    }).sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.startTime.localeCompare(a.startTime);
    });
  }, [reservations, listFilters]);

  const formatTime = (time: string) => {
    if (!time) return '';
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const calendarEvents = useMemo(() => {
    return reservations
      .filter(r => r.status === 'confirmed')
      .map(r => ({
        id: r.id,
        title: `${r.tableName} — ${r.clientName}`,
        start: `${r.date}T${r.startTime}:00`,
        end: `${r.date}T${r.endTime}:00`,
        backgroundColor: '#6750A4',
        borderColor: '#6750A4',
        extendedProps: r
      }));
  }, [reservations]);

  return (
    <div className="min-h-full bg-[#E0E5EC] p-6">
      {/* Top Bar */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-[5px_5px_10px_#bebebe,-5px_-5px_10px_#ffffff]">
            <CalendarIcon className="text-[#6750A4]" size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#6750A4]">Reservations</h1>
        </div>
        <button 
          onClick={() => {
            setEditingId(null);
            setActiveTab('new');
          }}
          className="flex items-center gap-2 rounded-2xl bg-[#6750A4] px-6 py-3 font-bold text-white shadow-[5px_5px_10px_#bebebe,-5px_-5px_10px_#ffffff] transition-all hover:scale-105 active:scale-95"
        >
          <Plus size={20} />
          <span>New Reservation</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex gap-4">
        {[
          { id: 'new', label: 'New Reservation', icon: Plus },
          { id: 'all', label: 'All Reservations', icon: Filter },
          { id: 'calendar', label: 'Calendar View', icon: CalendarIcon }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold transition-all ${
              activeTab === tab.id 
                ? 'bg-[#6750A4] text-white shadow-lg' 
                : 'bg-[#E0E5EC] text-gray-500 shadow-[5px_5px_10px_#bebebe,-5px_-5px_10px_#ffffff] hover:text-[#6750A4]'
            }`}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'new' && (
          <motion.div
            key="new"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-auto max-w-[560px]"
          >
            <form onSubmit={handleSubmit} className="rounded-[32px] bg-[#E0E5EC] p-8 shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff]">
              <h2 className="mb-8 text-xl font-bold text-gray-700">
                {editingId ? 'Edit Reservation' : 'Create New Reservation'}
              </h2>

              <div className="space-y-6">
                {/* Date & Time Row */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Date</label>
                    <input 
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full rounded-2xl border-none bg-[#E0E5EC] p-4 text-gray-700 shadow-[inset_5px_5px_10px_#bebebe,inset_-5px_-5px_10px_#ffffff] focus:ring-2 focus:ring-[#6750A4]/20"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Start Time</label>
                    <div 
                      onClick={() => setShowStartTimePicker(true)}
                      className="flex w-full cursor-pointer items-center justify-between rounded-2xl bg-[#E0E5EC] p-4 text-gray-700 shadow-[inset_5px_5px_10px_#bebebe,inset_-5px_-5px_10px_#ffffff]"
                    >
                      <span className="font-medium">{formatTime(formData.startTime) || 'Select Time'}</span>
                      <Clock size={18} className="text-[#6750A4]" />
                    </div>
                  </div>
                </div>

                {/* End Time & Table Row */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      End Time {formData.isAutoEnd && <span className="text-[10px] text-[#6750A4]">(auto)</span>}
                    </label>
                    <div 
                      onClick={() => {
                        setShowEndTimePicker(true);
                        setFormData(prev => ({ ...prev, isAutoEnd: false }));
                      }}
                      className="flex w-full cursor-pointer items-center justify-between rounded-2xl bg-[#E0E5EC] p-4 text-gray-700 shadow-[inset_5px_5px_10px_#bebebe,inset_-5px_-5px_10px_#ffffff]"
                    >
                      <span className="font-medium">{formatTime(formData.endTime) || 'Select Time'}</span>
                      <Clock size={18} className="text-[#6750A4]" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Table</label>
                    <select
                      value={formData.tableName}
                      onChange={(e) => setFormData(prev => ({ ...prev, tableName: e.target.value }))}
                      className="w-full rounded-2xl border-none bg-[#E0E5EC] p-4 text-gray-700 shadow-[inset_5px_5px_10px_#bebebe,inset_-5px_-5px_10px_#ffffff] focus:ring-2 focus:ring-[#6750A4]/20"
                      required
                    >
                      <option value="">Select Table</option>
                      {allTables.map(t => (
                        <option key={t.name} value={t.name}>
                          {t.name} ({t.zone}) {tableAvailability[t.name] ? '● Available' : '● Reserved'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Conflict Warning */}
                {formData.tableName && !tableAvailability[formData.tableName] && (
                  <div className={`rounded-2xl p-4 flex items-start gap-3 ${settings.allowOverbooking ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold">Conflict Detected</p>
                      <p className="text-xs opacity-80">Table {formData.tableName} is already reserved during this time slot.</p>
                      
                      <div className="mt-3">
                        <p className="text-[10px] font-bold uppercase mb-2">Available tables for this time:</p>
                        <div className="flex flex-wrap gap-2">
                          {allTables.filter(t => tableAvailability[t.name]).slice(0, 4).map(t => (
                            <button
                              key={t.name}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, tableName: t.name }))}
                              className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-bold hover:bg-green-200 transition-colors"
                            >
                              {t.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* People & Client Row */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">People</label>
                    <div className="flex items-center gap-4 rounded-2xl bg-[#E0E5EC] p-2 shadow-[inset_5px_5px_10px_#bebebe,inset_-5px_-5px_10px_#ffffff]">
                      <button 
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, people: Math.max(1, prev.people - 1) }))}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#6750A4] shadow-sm active:shadow-inner"
                      >
                        −
                      </button>
                      <span className="flex-1 text-center font-bold text-gray-700">{formData.people}</span>
                      <button 
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, people: Math.min(20, prev.people + 1) }))}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#6750A4] shadow-sm active:shadow-inner"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="relative space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Client Search</label>
                    <div className="relative">
                      <input 
                        type="text"
                        value={clientSearch}
                        onChange={(e) => {
                          setClientSearch(e.target.value);
                          setFormData(prev => ({ ...prev, clientName: e.target.value }));
                          setShowClientSuggestions(true);
                        }}
                        placeholder="Search or enter name"
                        className="w-full rounded-2xl border-none bg-[#E0E5EC] p-4 pl-10 text-gray-700 shadow-[inset_5px_5px_10px_#bebebe,inset_-5px_-5px_10px_#ffffff] focus:ring-2 focus:ring-[#6750A4]/20"
                        required
                      />
                      <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    {showClientSuggestions && filteredClients.length > 0 && (
                      <div className="absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-2xl bg-white shadow-xl">
                        {filteredClients.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleClientSelect(c)}
                            className="flex w-full items-center gap-3 p-3 text-left hover:bg-gray-50"
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6750A4]/10 text-[#6750A4]">
                              <User size={14} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-800">{c.name}</p>
                              <p className="text-xs text-gray-500">{c.phone}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Phone & Notes */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Phone</label>
                    <div className="relative">
                      <input 
                        type="tel"
                        value={formData.clientPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                        className="w-full rounded-2xl border-none bg-[#E0E5EC] p-4 pl-10 text-gray-700 shadow-[inset_5px_5px_10px_#bebebe,inset_-5px_-5px_10px_#ffffff] focus:ring-2 focus:ring-[#6750A4]/20"
                        required
                      />
                      <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Notes</label>
                    <textarea 
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={1}
                      className="w-full rounded-2xl border-none bg-[#E0E5EC] p-4 text-gray-700 shadow-[inset_5px_5px_10px_#bebebe,inset_-5px_-5px_10px_#ffffff] focus:ring-2 focus:ring-[#6750A4]/20"
                    />
                  </div>
                </div>

                {/* Deposit Section */}
                {!editingId && (
                  <div className="rounded-[24px] bg-white/40 p-6 shadow-neumorphic space-y-4">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Plus size={14} /> Advance Deposit (Optional)
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Amount</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400">PKR</span>
                          <input 
                            type="number"
                            value={formData.depositAmount}
                            onChange={(e) => setFormData(prev => ({ ...prev, depositAmount: e.target.value }))}
                            placeholder="0"
                            className="w-full rounded-2xl border-none bg-[#E0E5EC] p-4 pl-12 text-gray-700 shadow-[inset_5px_5px_10px_#bebebe,inset_-5px_-5px_10px_#ffffff] focus:ring-2 focus:ring-[#6750A4]/20"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Method</label>
                        <select 
                          value={formData.paymentMethod}
                          onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                          className="w-full rounded-2xl border-none bg-[#E0E5EC] p-4 text-gray-700 shadow-[inset_5px_5px_10px_#bebebe,inset_-5px_-5px_10px_#ffffff] focus:ring-2 focus:ring-[#6750A4]/20"
                        >
                          {paymentMethods.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <button 
                  type="submit"
                  className="mt-8 w-full rounded-2xl bg-[#6750A4] py-4 font-bold text-white shadow-[10px_10px_20px_#bebebe,-10px_-10px_20px_#ffffff] transition-all hover:scale-[1.02] active:scale-95"
                >
                  {editingId ? 'Update Reservation' : 'Confirm Reservation'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {activeTab === 'all' && (
          <motion.div
            key="all"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Filters */}
            <div className="mb-6 flex flex-wrap items-center gap-4 rounded-3xl bg-[#E0E5EC] p-6 shadow-[10px_10px_20px_#bebebe,-10px_-10px_20px_#ffffff]">
              <div className="relative flex-1 min-w-[200px]">
                <input 
                  type="text"
                  placeholder="Search by client or table..."
                  value={listFilters.search}
                  onChange={(e) => setListFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full rounded-2xl border-none bg-[#E0E5EC] p-3 pl-10 text-sm shadow-[inset_5px_5px_10px_#bebebe,inset_-5px_-5px_10px_#ffffff]"
                />
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              
              <select 
                value={listFilters.date}
                onChange={(e) => setListFilters(prev => ({ ...prev, date: e.target.value }))}
                className="rounded-2xl border-none bg-[#E0E5EC] p-3 text-sm shadow-[5px_5px_10px_#bebebe,-5px_-5px_10px_#ffffff]"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
              </select>

              <select 
                value={listFilters.status}
                onChange={(e) => setListFilters(prev => ({ ...prev, status: e.target.value }))}
                className="rounded-2xl border-none bg-[#E0E5EC] p-3 text-sm shadow-[5px_5px_10px_#bebebe,-5px_-5px_10px_#ffffff]"
              >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-[32px] bg-[#E0E5EC] shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff]">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-gray-200/50">
                    <th className="p-6 text-xs font-bold uppercase tracking-wider text-gray-400">Date</th>
                    <th className="p-6 text-xs font-bold uppercase tracking-wider text-gray-400">Time</th>
                    <th className="p-6 text-xs font-bold uppercase tracking-wider text-gray-400">Table</th>
                    <th className="p-6 text-xs font-bold uppercase tracking-wider text-gray-400">Client</th>
                    <th className="p-6 text-xs font-bold uppercase tracking-wider text-gray-400">People</th>
                    <th className="p-6 text-xs font-bold uppercase tracking-wider text-gray-400">Status</th>
                    <th className="p-6 text-xs font-bold uppercase tracking-wider text-gray-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.map(res => {
                    const isPast = new Date(res.date) < new Date(new Date().toISOString().split('T')[0]);
                    return (
                      <tr key={res.id} className={`border-b border-gray-200/30 transition-colors hover:bg-white/20 ${isPast ? 'opacity-50' : ''}`}>
                        <td className="p-6">
                          <p className="font-bold text-gray-700">
                            {new Date(res.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock size={14} />
                            <span>{formatTime(res.startTime)} — {formatTime(res.endTime)}</span>
                          </div>
                        </td>
                        <td className="p-6">
                          <span className="rounded-lg bg-[#6750A4]/10 px-3 py-1 text-sm font-bold text-[#6750A4]">
                            {res.tableName}
                          </span>
                        </td>
                        <td className="p-6">
                          <div>
                            <p className="font-bold text-gray-800">{res.clientName}</p>
                            <p className="text-xs text-gray-500">{res.clientPhone}</p>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-1 font-bold text-gray-700">
                            <Users size={16} />
                            <span>{res.people}</span>
                          </div>
                          {res.depositAmount && (
                            <p className="text-[10px] font-black text-purple-600 uppercase mt-1">
                              Deposit: {formatCurrency(res.depositAmount)}
                            </p>
                          )}
                        </td>
                        <td className="p-6">
                          <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            res.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            res.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {res.status}
                          </span>
                        </td>
                        <td className="p-6 text-right">
                          <div className="flex justify-end gap-2">
                            {res.status === 'confirmed' && (
                              <>
                                <button 
                                  onClick={() => completeReservation(res.id)}
                                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-green-600 shadow-sm hover:bg-green-50"
                                  title="Mark Complete"
                                >
                                  <Check size={18} />
                                </button>
                                <button 
                                  onClick={() => handleEdit(res)}
                                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm hover:bg-blue-50"
                                  title="Edit"
                                >
                                  <Edit2 size={18} />
                                </button>
                                <button 
                                  onClick={async () => {
                                    const confirmed = await askConfirm('Cancel Reservation', 'Are you sure you want to cancel this reservation?');
                                    if (confirmed) {
                                      cancelReservation(res.id);
                                    }
                                  }}
                                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-red-600 shadow-sm hover:bg-red-50"
                                  title="Cancel"
                                >
                                  <X size={18} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredReservations.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-20 text-center text-gray-400">
                        <CalendarIcon size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No reservations found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'calendar' && (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-[32px] bg-[#E0E5EC] p-8 shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff]"
          >
            <div className="calendar-container">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                events={calendarEvents}
                eventClick={async (info) => {
                  const res = info.event.extendedProps as Reservation;
                  const confirmed = await askConfirm(
                    'Edit Reservation',
                    `Reservation for ${res.clientName} at ${res.tableName}\nTime: ${res.startTime} - ${res.endTime}\n\nWould you like to edit this reservation?`
                  );
                  if (confirmed) {
                    handleEdit(res);
                  }
                }}
                height="auto"
                nowIndicator={true}
                slotMinTime="08:00:00"
                slotMaxTime="23:59:59"
                allDaySlot={false}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Time Pickers */}
      <AnimatePresence>
        {showStartTimePicker && (
          <ClockTimePicker 
            label="Select Start Time"
            value={formData.startTime}
            onChange={(time) => setFormData(prev => ({ ...prev, startTime: time }))}
            onClose={() => setShowStartTimePicker(false)}
          />
        )}
        {showEndTimePicker && (
          <ClockTimePicker 
            label="Select End Time"
            value={formData.endTime}
            onChange={(time) => setFormData(prev => ({ ...prev, endTime: time }))}
            onClose={() => setShowEndTimePicker(false)}
          />
        )}
      </AnimatePresence>

      <style>{`
        .fc {
          --fc-border-color: rgba(0,0,0,0.05);
          --fc-button-bg-color: #E0E5EC;
          --fc-button-border-color: transparent;
          --fc-button-hover-bg-color: #f0f0f0;
          --fc-button-active-bg-color: #6750A4;
          --fc-button-active-text-color: #fff;
          --fc-today-bg-color: rgba(103, 80, 164, 0.05);
          font-family: inherit;
        }
        .fc .fc-button {
          box-shadow: 4px 4px 8px #bebebe, -4px -4px 8px #ffffff;
          border-radius: 12px;
          font-weight: bold;
          text-transform: capitalize;
          padding: 8px 16px;
          color: #6750A4;
        }
        .fc .fc-button-primary:not(:disabled).fc-button-active,
        .fc .fc-button-primary:not(:disabled):active {
          background-color: #6750A4;
          box-shadow: inset 4px 4px 8px #4a3a75, inset -4px -4px 8px #8466d3;
        }
        .fc .fc-toolbar-title {
          color: #6750A4;
          font-weight: bold;
        }
        .fc-v-event {
          border-radius: 8px;
          padding: 4px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .fc-event-title {
          font-weight: bold;
          font-size: 0.85rem;
        }
      `}</style>
    </div>
  );
};

export default ReservationPage;
