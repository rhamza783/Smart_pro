import { useState, useEffect, useMemo, useCallback } from 'react';
import { useHistoryStore } from '../store/historyStore';
import { useMenuStore } from '../store/menuStore';
import { generateReport } from '../utils/reportUtils';
import { ReportData, Client } from '../types';

export const useReport = () => {
  const { history } = useHistoryStore();
  const { menuItems } = useMenuStore();
  const [activeReport, setActiveReport] = useState('Sale by Menu Items');
  const [dateFrom, setDateFrom] = useState(new Date(new Date().setHours(0, 0, 0, 0)));
  const [dateTo, setDateTo] = useState(new Date(new Date().setHours(23, 59, 59, 999)));
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mock clients for Udhaar reports
  const clients: Client[] = useMemo(() => {
    const stored = localStorage.getItem('pos_clients');
    return stored ? JSON.parse(stored) : [];
  }, []);

  const handleGenerateReport = useCallback(() => {
    setIsLoading(true);
    // Simulate processing time
    setTimeout(() => {
      const data = generateReport(activeReport, history, dateFrom, dateTo, menuItems, clients);
      setReportData(data);
      setIsLoading(false);
    }, 500);
  }, [activeReport, history, dateFrom, dateTo, menuItems, clients]);

  useEffect(() => {
    handleGenerateReport();
  }, [activeReport, handleGenerateReport]);

  return {
    activeReport,
    setActiveReport,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    reportData,
    isLoading,
    generateReport: handleGenerateReport
  };
};
