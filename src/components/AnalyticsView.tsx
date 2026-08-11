import React, { useState, useEffect, useMemo } from 'react';
import { SeatingStats, Table, GuestTurnoverRecord } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import * as XLSX from 'xlsx';
import {
  BarChart3, TrendingUp, Users, Clock, Utensils, Calendar, Search, Download,
  Mail, Phone, RefreshCw, Filter, CheckCircle, ArrowUpRight, Award, ShieldAlert,
  FileSpreadsheet, FileText, Check
} from 'lucide-react';

interface AnalyticsViewProps {
  stats: SeatingStats;
  tables: Table[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ stats, tables }) => {
  const [reportTab, setReportTab] = useState<'daily' | 'day_wise_summary' | 'monthly' | 'peak_hours'>('daily');

  // Business Date & Filter States
  const [selectedDate, setSelectedDate] = useState<string>(stats.currentBusinessDate || '2026-08-10');
  const [selectedMonth, setSelectedMonth] = useState<string>((stats.currentBusinessDate || '2026-08-10').substring(0, 7));
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Turnover records state fetched from backend
  const [turnovers, setTurnovers] = useState<GuestTurnoverRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Sync state if stats date changes
  useEffect(() => {
    if (stats.currentBusinessDate) {
      setSelectedDate(stats.currentBusinessDate);
      setSelectedMonth(stats.currentBusinessDate.substring(0, 7));
    }
  }, [stats.currentBusinessDate]);

  // Fetch turnover records
  const fetchTurnovers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/turnover');
      if (res.ok) {
        const data = await res.json();
        setTurnovers(data);
      }
    } catch (err) {
      console.error('Error fetching turnover records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTurnovers();
  }, []);

  // Filtered Turnovers for Daily Basis
  const dailyTurnovers = useMemo(() => {
    return turnovers.filter(t => t.date === selectedDate).filter(t => {
      const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
      if (!matchesStatus) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.guestName.toLowerCase().includes(q) ||
        t.phone.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.tableNumber.toLowerCase().includes(q)
      );
    });
  }, [turnovers, selectedDate, searchQuery, statusFilter]);

  // Daily Summary Metrics
  const dailyMetrics = useMemo(() => {
    const list = turnovers.filter(t => t.date === selectedDate);
    const totalTurnovers = list.length;
    const totalGuests = list.reduce((acc, curr) => acc + curr.partySize, 0);
    const completedList = list.filter(t => t.durationMinutes && t.durationMinutes > 0);
    const avgDuration = completedList.length > 0
      ? Math.round(completedList.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0) / completedList.length)
      : 55;

    return { totalTurnovers, totalGuests, avgDuration };
  }, [turnovers, selectedDate]);

  // Grouped Day-Wise Summaries
  const dayWiseGrouped = useMemo(() => {
    const map: {
      [date: string]: {
        date: string;
        totalTurnovers: number;
        totalGuests: number;
        records: GuestTurnoverRecord[];
        avgDuration: number;
        uniqueContacts: number;
      };
    } = {};

    turnovers.forEach((t) => {
      if (!map[t.date]) {
        map[t.date] = {
          date: t.date,
          totalTurnovers: 0,
          totalGuests: 0,
          records: [],
          avgDuration: 0,
          uniqueContacts: 0
        };
      }
      map[t.date].records.push(t);
      map[t.date].totalTurnovers += 1;
      map[t.date].totalGuests += t.partySize;
    });

    Object.values(map).forEach((group) => {
      const completed = group.records.filter((r) => r.durationMinutes && r.durationMinutes > 0);
      group.avgDuration = completed.length > 0
        ? Math.round(completed.reduce((acc, c) => acc + (c.durationMinutes || 0), 0) / completed.length)
        : 50;
      group.uniqueContacts = new Set(group.records.map((r) => r.phone || r.email)).size;
    });

    return Object.values(map).sort((a, b) => b.date.localeCompare(a.date));
  }, [turnovers]);

  // Filtered Turnovers for Monthly Basis
  const monthlyTurnovers = useMemo(() => {
    return turnovers.filter(t => t.date.startsWith(selectedMonth)).filter(t => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.guestName.toLowerCase().includes(q) ||
        t.phone.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.tableNumber.toLowerCase().includes(q)
      );
    });
  }, [turnovers, selectedMonth, searchQuery]);

  // Monthly Summary Metrics
  const monthlyMetrics = useMemo(() => {
    const list = turnovers.filter(t => t.date.startsWith(selectedMonth));
    const totalTurnovers = list.length;
    const totalGuests = list.reduce((acc, curr) => acc + curr.partySize, 0);
    const uniqueGuests = new Set(list.map(t => t.email || t.phone)).size;

    return { totalTurnovers, totalGuests, uniqueGuests };
  }, [turnovers, selectedMonth]);

  // Daily Turnover Trend for Monthly View Chart
  const monthlyDailyChartData = useMemo(() => {
    const list = turnovers.filter(t => t.date.startsWith(selectedMonth));
    const dayMap: { [day: string]: { date: string; turnovers: number; guests: number } } = {};

    list.forEach(item => {
      const dayStr = item.date.split('-')[2]; // '10' from '2026-08-10'
      if (!dayMap[dayStr]) {
        dayMap[dayStr] = { date: `Day ${dayStr}`, turnovers: 0, guests: 0 };
      }
      dayMap[dayStr].turnovers += 1;
      dayMap[dayStr].guests += item.partySize;
    });

    return Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [turnovers, selectedMonth]);

  // Hourly Traffic Data
  const hourlyData = [
    { hour: '11 AM', walkins: 8, seated: 8, turnoverRate: 1.2 },
    { hour: '12 PM', walkins: 24, seated: 22, turnoverRate: 2.5 },
    { hour: '1 PM', walkins: 32, seated: 30, turnoverRate: 3.1 },
    { hour: '2 PM', walkins: 14, seated: 14, turnoverRate: 1.8 },
    { hour: '5 PM', walkins: 18, seated: 18, turnoverRate: 2.0 },
    { hour: '6 PM', walkins: 42, seated: 38, turnoverRate: 3.8 },
    { hour: '7 PM', walkins: 56, seated: 48, turnoverRate: 4.5 },
    { hour: '8 PM', walkins: 38, seated: 35, turnoverRate: 3.2 },
    { hour: '9 PM', walkins: 16, seated: 16, turnoverRate: 1.5 }
  ];

  // Zone Distribution
  const zoneCounts: { [zone: string]: number } = {};
  tables.forEach((t) => {
    zoneCounts[t.zone] = (zoneCounts[t.zone] || 0) + 1;
  });

  const pieData = Object.keys(zoneCounts).map((zone) => ({
    name: zone,
    value: zoneCounts[zone]
  }));

  const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

  // Helper function to format timestamp
  const formatTime = (isoString?: string) => {
    if (!isoString) return '-';
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  // Helper to export EXCEL (.xlsx) for a specific date
  const handleExportExcelForDate = (targetDate: string) => {
    const listToExport = turnovers.filter((t) => t.date === targetDate);
    if (listToExport.length === 0) {
      alert(`No guest turnover records found for date ${targetDate}.`);
      return;
    }

    const wb = XLSX.utils.book_new();

    // Sheet 1: Detailed Guest List
    const guestRows = listToExport.map((t, idx) => ({
      "S.No": idx + 1,
      "Guest Name": t.guestName,
      "Phone Number": t.phone,
      "Email ID": t.email,
      "Number of People (Party Size)": t.partySize,
      "Table Number": t.tableNumber,
      "Zone": t.zone,
      "Visit Date": t.date,
      "Seated Time": formatTime(t.seatedAt),
      "Departure Time": t.completedAt ? formatTime(t.completedAt) : "Seated / Active",
      "Duration (Mins)": t.durationMinutes || "-",
      "Entry Type": t.type || "Walk-In",
      "Status": t.status,
      "Special Requests / Notes": t.specialRequests || ""
    }));

    const wsGuests = XLSX.utils.json_to_sheet(guestRows);

    // Set column widths for readability
    wsGuests['!cols'] = [
      { wch: 6 },  // S.No
      { wch: 22 }, // Guest Name
      { wch: 18 }, // Phone
      { wch: 28 }, // Email
      { wch: 16 }, // Party Size
      { wch: 14 }, // Table Number
      { wch: 16 }, // Zone
      { wch: 12 }, // Date
      { wch: 14 }, // Seated Time
      { wch: 16 }, // Departure Time
      { wch: 16 }, // Duration
      { wch: 16 }, // Entry Type
      { wch: 12 }, // Status
      { wch: 30 }  // Special Requests
    ];

    XLSX.utils.book_append_sheet(wb, wsGuests, "Guest List");

    // Sheet 2: Day Summary Report KPIs
    const totalGuests = listToExport.reduce((acc, c) => acc + c.partySize, 0);
    const completedList = listToExport.filter(c => c.durationMinutes && c.durationMinutes > 0);
    const avgDuration = completedList.length > 0
      ? Math.round(completedList.reduce((a, b) => a + (b.durationMinutes || 0), 0) / completedList.length)
      : 55;

    const summaryRows = [
      { "Metric Parameter": "Report Date", "Value": targetDate },
      { "Metric Parameter": "Total Table Turnovers", "Value": listToExport.length },
      { "Metric Parameter": "Total Guest Headcount (People)", "Value": totalGuests },
      { "Metric Parameter": "Average Table Duration (Minutes)", "Value": avgDuration },
      { "Metric Parameter": "Unique Contact Records", "Value": new Set(listToExport.map(t => t.phone || t.email)).size }
    ];

    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    wsSummary['!cols'] = [{ wch: 35 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Day Summary KPI");

    // Write file
    XLSX.writeFile(wb, `Guest_Summary_Report_${targetDate}.xlsx`);
  };

  // Helper to export ALL DAYS Master Excel Workbook
  const handleExportExcelAllDaysMaster = () => {
    if (turnovers.length === 0) {
      alert("No turnover records available in system to export.");
      return;
    }

    const wb = XLSX.utils.book_new();

    // Sheet 1: Day-Wise Headcount & Turnover Summary
    const dayWiseRows = dayWiseGrouped.map((group, idx) => ({
      "S.No": idx + 1,
      "Date": group.date,
      "Total Guest Headcount (People)": group.totalGuests,
      "Total Tables Seated": group.totalTurnovers,
      "Avg Table Duration (Mins)": group.avgDuration,
      "Unique Guest Contacts": group.uniqueContacts
    }));

    const wsDayWise = XLSX.utils.json_to_sheet(dayWiseRows);
    wsDayWise['!cols'] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 30 },
      { wch: 20 },
      { wch: 26 },
      { wch: 22 }
    ];
    XLSX.utils.book_append_sheet(wb, wsDayWise, "Day-Wise Summary");

    // Sheet 2: Master Guest List (All Days Combined)
    const sortedTurnovers = [...turnovers].sort((a, b) => b.date.localeCompare(a.date));
    const masterGuestRows = sortedTurnovers.map((t, idx) => ({
      "S.No": idx + 1,
      "Visit Date": t.date,
      "Guest Name": t.guestName,
      "Phone Number": t.phone,
      "Email ID": t.email,
      "Number of People (Party Size)": t.partySize,
      "Table Number": t.tableNumber,
      "Zone": t.zone,
      "Seated Time": formatTime(t.seatedAt),
      "Departure Time": t.completedAt ? formatTime(t.completedAt) : "Seated / Active",
      "Duration (Mins)": t.durationMinutes || "-",
      "Entry Type": t.type || "Walk-In",
      "Status": t.status,
      "Special Requests": t.specialRequests || ""
    }));

    const wsMasterList = XLSX.utils.json_to_sheet(masterGuestRows);
    wsMasterList['!cols'] = [
      { wch: 6 },  // S.No
      { wch: 12 }, // Date
      { wch: 22 }, // Guest Name
      { wch: 18 }, // Phone
      { wch: 28 }, // Email
      { wch: 16 }, // Party Size
      { wch: 14 }, // Table Number
      { wch: 16 }, // Zone
      { wch: 14 }, // Seated Time
      { wch: 16 }, // Departure Time
      { wch: 16 }, // Duration
      { wch: 16 }, // Entry Type
      { wch: 12 }, // Status
      { wch: 30 }  // Special Requests
    ];
    XLSX.utils.book_append_sheet(wb, wsMasterList, "Master Guest Directory");

    // Also create individual date tabs for each date
    dayWiseGrouped.forEach((group) => {
      const sheetName = group.date; // e.g. "2026-08-10"
      const dateRows = group.records.map((t, idx) => ({
        "S.No": idx + 1,
        "Guest Name": t.guestName,
        "Phone Number": t.phone,
        "Email ID": t.email,
        "Number of People": t.partySize,
        "Table Number": t.tableNumber,
        "Zone": t.zone,
        "Seated Time": formatTime(t.seatedAt),
        "Departure Time": t.completedAt ? formatTime(t.completedAt) : "Active",
        "Duration (Mins)": t.durationMinutes || "-",
        "Status": t.status,
        "Notes": t.specialRequests || ""
      }));
      const wsDate = XLSX.utils.json_to_sheet(dateRows);
      wsDate['!cols'] = [
        { wch: 6 },
        { wch: 20 },
        { wch: 16 },
        { wch: 26 },
        { wch: 16 },
        { wch: 14 },
        { wch: 16 },
        { wch: 14 },
        { wch: 14 },
        { wch: 16 },
        { wch: 12 },
        { wch: 25 }
      ];
      XLSX.utils.book_append_sheet(wb, wsDate, sheetName.replace(/[\/\\?\*\]\[]/g, '-'));
    });

    XLSX.writeFile(wb, `Day_Wise_Guest_Summary_Report_All_Days.xlsx`);
  };

  // Helper to export CSV
  const handleExportCSV = (type: 'daily' | 'monthly') => {
    const listToExport = type === 'daily' ? dailyTurnovers : monthlyTurnovers;
    if (listToExport.length === 0) {
      alert(`No guest records found to export for ${type} view.`);
      return;
    }

    const headers = ["ID", "Guest Name", "Phone", "Email", "Number of People (Party Size)", "Table Number", "Zone", "Date", "Seated Time", "Turnover Time", "Duration (mins)", "Status"];
    const rows = listToExport.map(t => [
      t.id,
      `"${t.guestName.replace(/"/g, '""')}"`,
      `"${t.phone}"`,
      `"${t.email}"`,
      t.partySize,
      t.tableNumber,
      `"${t.zone}"`,
      t.date,
      formatTime(t.seatedAt),
      t.completedAt ? formatTime(t.completedAt) : 'In Progress',
      t.durationMinutes || '-',
      t.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `GuestTurnover_${type}_${type === 'daily' ? selectedDate : selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white">Guest Directory & Day-Wise Summary Reports</h2>
            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold font-mono px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Business Date: {selectedDate}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete day-by-day guest directory, headcount reports, and downloadable Excel (.xlsx) spreadsheets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcelAllDaysMaster}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Download Master Excel (.xlsx)
          </button>

          <button
            onClick={fetchTurnovers}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            Sync Reports
          </button>
        </div>
      </div>

      {/* Top Level Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 relative overflow-hidden">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Today's Table Turnovers</span>
            <Utensils className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400">{stats.todayTableTurnovers || dailyMetrics.totalTurnovers}</div>
          <div className="text-[11px] text-slate-400">
            Total tables turned over on {selectedDate}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 relative overflow-hidden">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Today's Guest Headcount</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400">{stats.todayTotalGuests || dailyMetrics.totalGuests}</div>
          <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Total guests (people) today
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 relative overflow-hidden">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Monthly Turnovers</span>
            <BarChart3 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-blue-400">{stats.monthlyTableTurnovers || monthlyMetrics.totalTurnovers}</div>
          <div className="text-[11px] text-slate-400">
            {stats.monthlyTotalGuests || monthlyMetrics.totalGuests} total guests this month ({selectedMonth})
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 relative overflow-hidden">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Avg Table Duration</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-black text-purple-400">{stats.averageTurnTimeMinutes || dailyMetrics.avgDuration}m</div>
          <div className="text-[11px] text-slate-400">
            Average time per guest seating
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800 w-fit">
        <button
          onClick={() => setReportTab('daily')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            reportTab === 'daily'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Daily Guest & Turnover Log
        </button>

        <button
          onClick={() => setReportTab('day_wise_summary')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            reportTab === 'day_wise_summary'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-950" />
          Day-Wise Summary Report & Excel
        </button>

        <button
          onClick={() => setReportTab('monthly')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            reportTab === 'monthly'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Monthly Directory
        </button>

        <button
          onClick={() => setReportTab('peak_hours')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            reportTab === 'peak_hours'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Peak Hours & Zone Rate
        </button>
      </div>

      {/* TAB 1: DAILY TURNOVER & GUEST LOGS */}
      {reportTab === 'daily' && (
        <div className="space-y-6">
          
          {/* Controls Bar: Date Picker, Search, Status Filter & Exports */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-medium text-slate-400">Select Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-xs text-white font-bold font-mono focus:outline-none"
                />
              </div>

              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search guest name, phone, email, table..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-400">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-xs text-white font-bold focus:outline-none"
                >
                  <option value="All" className="bg-slate-900">All Statuses</option>
                  <option value="seated" className="bg-slate-900">Seated / Active</option>
                  <option value="completed" className="bg-slate-900">Completed</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExportExcelForDate(selectedDate)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Download Excel (.xlsx)
              </button>

              <button
                onClick={() => handleExportCSV('daily')}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5" />
                CSV
              </button>
            </div>
          </div>

          {/* Daily Guest Details Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
              <div>
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  Daily Guest Details & Table Turnover Logs
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Showing {dailyTurnovers.length} turnover records for {selectedDate}
                </p>
              </div>

              <div className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/30">
                Turnovers: {dailyMetrics.totalTurnovers} | Total Guests: {dailyMetrics.totalGuests}
              </div>
            </div>

            {dailyTurnovers.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <Users className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">No guest turnover logs recorded for {selectedDate}</p>
                <p className="text-xs">Seating guests or updating table statuses will generate turnover logs here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">S.No</th>
                      <th className="py-3 px-4">Guest Name</th>
                      <th className="py-3 px-4">Phone Number</th>
                      <th className="py-3 px-4">Email ID</th>
                      <th className="py-3 px-4 text-center">Number of People</th>
                      <th className="py-3 px-4">Table / Zone</th>
                      <th className="py-3 px-4">Seated Time</th>
                      <th className="py-3 px-4">Turn / Departure</th>
                      <th className="py-3 px-4 text-center">Duration</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {dailyTurnovers.map((t, idx) => (
                      <tr key={t.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono text-slate-500 text-xs">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center font-bold text-xs border border-slate-700 shrink-0">
                            {t.guestName.charAt(0).toUpperCase()}
                          </span>
                          <div>
                            <div>{t.guestName}</div>
                            {t.specialRequests && (
                              <span className="text-[10px] text-amber-400 font-normal truncate block max-w-[150px]">
                                {t.specialRequests}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-500" />
                            {t.phone}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                            <Mail className="w-3 h-3 text-slate-500" />
                            {t.email}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-white font-mono">
                          <span className="bg-slate-800 px-2.5 py-1 rounded-full text-amber-400 border border-slate-700">
                            {t.partySize} guests
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-200">{t.tableNumber}</div>
                          <div className="text-[10px] text-slate-400">{t.zone}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">
                          {formatTime(t.seatedAt)}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">
                          {t.completedAt ? (
                            formatTime(t.completedAt)
                          ) : (
                            <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              Seated Now
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-200">
                          {t.durationMinutes ? `${t.durationMinutes} mins` : '-'}
                        </td>
                        <td className="py-3 px-4">
                          {t.status === 'completed' ? (
                            <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full text-[10px] font-bold border border-slate-700">
                              Turn Completed
                            </span>
                          ) : (
                            <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-500/30">
                              Seated / Dining
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DAY-WISE COMPLETE SUMMARY REPORT & EXCEL HUB */}
      {reportTab === 'day_wise_summary' && (
        <div className="space-y-6">
          
          {/* Action Bar & Excel Generator Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  Day-Wise Guest Summary Reports & Excel Export
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Generate complete day-by-day guest lists containing guest names, phone numbers, email addresses, and number of people for any date or download the entire master report in Microsoft Excel (.xlsx) format.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleExportExcelAllDaysMaster}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg transition"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Download ALL Days Master Excel (.xlsx)
                </button>

                <button
                  onClick={() => handleExportExcelForDate(selectedDate)}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg transition"
                >
                  <Download className="w-4 h-4" />
                  Export Selected Day ({selectedDate})
                </button>
              </div>
            </div>

            {/* Quick Date Selector Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-300">Select Report Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-amber-400 font-bold font-mono focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                <span>Selected Date Guests: <strong className="text-emerald-400">{dailyMetrics.totalGuests} people</strong></span>
                <span>•</span>
                <span>Turnovers: <strong className="text-amber-400">{dailyMetrics.totalTurnovers} tables</strong></span>
                <span>•</span>
                <span>Avg Duration: <strong className="text-purple-400">{dailyMetrics.avgDuration} mins</strong></span>
              </div>
            </div>
          </div>

          {/* Day-Wise Summary Overview Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
              <div>
                <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  Day-by-Day Guest Headcount & Turnover Summary
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Overview of guests served and table turnovers recorded by business date
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/30">
                {dayWiseGrouped.length} Days Recorded
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Business Date</th>
                    <th className="py-3 px-4 text-center">Total Guest Headcount (People)</th>
                    <th className="py-3 px-4 text-center">Total Tables Turned Over</th>
                    <th className="py-3 px-4 text-center">Avg Seating Duration</th>
                    <th className="py-3 px-4 text-center">Unique Contacts</th>
                    <th className="py-3 px-4 text-right">Download Excel Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {dayWiseGrouped.map((group) => (
                    <tr
                      key={group.date}
                      className={`hover:bg-slate-800/50 transition ${
                        group.date === selectedDate ? 'bg-amber-500/5 border-l-2 border-amber-500' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-white font-mono flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        {group.date}
                        {group.date === stats.currentBusinessDate && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-sans">
                            Today
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-400 text-sm font-mono">
                        {group.totalGuests} guests
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-amber-400 font-mono">
                        {group.totalTurnovers} tables
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-300">
                        {group.avgDuration} mins
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-300">
                        {group.uniqueContacts} records
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedDate(group.date);
                              setReportTab('daily');
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                          >
                            View Guest List
                          </button>

                          <button
                            onClick={() => handleExportExcelForDate(group.date)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition shadow"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            .XLSX
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Guest List for Selected Day */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80">
              <div>
                <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  Detailed Guest List for {selectedDate}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Complete contact information & headcount summary per guest
                </p>
              </div>

              <button
                onClick={() => handleExportExcelForDate(selectedDate)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition self-start sm:self-auto"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Download {selectedDate} Excel Report (.xlsx)
              </button>
            </div>

            {dailyTurnovers.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <Users className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">No guest records found for date {selectedDate}</p>
                <p className="text-xs">Pick another date from the table above or seat new guests to populate records.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">S.No</th>
                      <th className="py-3 px-4">Guest Name</th>
                      <th className="py-3 px-4">Phone Number</th>
                      <th className="py-3 px-4">Email ID</th>
                      <th className="py-3 px-4 text-center">Number of People</th>
                      <th className="py-3 px-4">Table Number</th>
                      <th className="py-3 px-4">Zone</th>
                      <th className="py-3 px-4">Seated Time</th>
                      <th className="py-3 px-4">Departure Time</th>
                      <th className="py-3 px-4">Duration</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Special Requests</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {dailyTurnovers.map((t, idx) => (
                      <tr key={t.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center font-bold text-[11px] border border-slate-700 shrink-0">
                            {t.guestName.charAt(0).toUpperCase()}
                          </span>
                          {t.guestName}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">{t.phone}</td>
                        <td className="py-3 px-4 text-slate-300">{t.email}</td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-400 font-mono">
                          {t.partySize} guests
                        </td>
                        <td className="py-3 px-4 font-bold text-amber-400">{t.tableNumber}</td>
                        <td className="py-3 px-4 text-slate-300">{t.zone}</td>
                        <td className="py-3 px-4 font-mono text-slate-300">{formatTime(t.seatedAt)}</td>
                        <td className="py-3 px-4 font-mono text-slate-300">
                          {t.completedAt ? formatTime(t.completedAt) : "Seated"}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">
                          {t.durationMinutes ? `${t.durationMinutes}m` : "-"}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            t.status === 'completed'
                              ? 'bg-slate-800 text-slate-300 border-slate-700'
                              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px] italic">
                          {t.specialRequests || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 3: MONTHLY REPORT & GUEST DIRECTORY */}
      {reportTab === 'monthly' && (
        <div className="space-y-6">
          
          {/* Controls Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-medium text-slate-400">Select Month:</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-xs text-white font-bold font-mono focus:outline-none"
                />
              </div>

              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search monthly guests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportExcelAllDaysMaster}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Download Excel (.xlsx)
              </button>

              <button
                onClick={() => handleExportCSV('monthly')}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5" />
                CSV
              </button>
            </div>
          </div>

          {/* Monthly Turnover Trend Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-white">Monthly Table Turnover Volume ({selectedMonth})</h3>
                <p className="text-xs text-slate-400">Daily table turnover count and guest headcount</p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/30">
                Total Month Guests: {monthlyMetrics.totalGuests}
              </span>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyDailyChartData}>
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="turnovers" fill="#f59e0b" name="Table Turnovers" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="guests" fill="#10b981" name="Guests Headcount" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Guest Directory */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
              <div>
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  Monthly Guest Directory & Turnover History
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {monthlyTurnovers.length} turnover records for month {selectedMonth}
                </p>
              </div>

              <div className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/30">
                Total Monthly Turnovers: {monthlyMetrics.totalTurnovers}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">S.No</th>
                    <th className="py-3 px-4">Guest Name</th>
                    <th className="py-3 px-4">Phone Number</th>
                    <th className="py-3 px-4">Email ID</th>
                    <th className="py-3 px-4 text-center">Number of People</th>
                    <th className="py-3 px-4">Table Number</th>
                    <th className="py-3 px-4">Visit Date</th>
                    <th className="py-3 px-4">Seated Time</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {monthlyTurnovers.map((t, idx) => (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center font-bold text-xs border border-slate-700">
                          {t.guestName.charAt(0).toUpperCase()}
                        </span>
                        {t.guestName}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">{t.phone}</td>
                      <td className="py-3 px-4 text-slate-300">{t.email}</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-400 font-mono">
                        {t.partySize} guests
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-200">{t.tableNumber} ({t.zone})</td>
                      <td className="py-3 px-4 font-mono text-amber-400 font-bold">{t.date}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {formatTime(t.seatedAt)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full text-[10px] font-bold border border-slate-700">
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 4: PEAK HOURS & ZONE RATE */}
      {reportTab === 'peak_hours' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Peak Hours Walk-In Volume */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-white">Peak Dining Hours & Walk-In Traffic</h3>
                <p className="text-xs text-slate-400">Customer check-ins vs tables turned over by hour</p>
              </div>
              <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30 font-bold">
                Peak Hour: 7:00 PM
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData}>
                  <XAxis dataKey="hour" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="walkins" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Walk-Ins Registered" />
                  <Bar dataKey="seated" fill="#10b981" radius={[6, 6, 0, 0]} name="Tables Seated" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table Zone Turnover Distribution */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="font-extrabold text-base text-white">Table Zone Turnover</h3>
            <p className="text-xs text-slate-400">Distribution across dining sections</p>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 pt-2">
              {pieData.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                    {item.name}
                  </span>
                  <span className="font-mono font-bold">{item.value} tables</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};


