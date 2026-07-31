import { useState, useEffect } from 'react';
import { 
  Users, FileText, Database, ShieldAlert,
  Activity, ArrowUpRight, ArrowDownRight, Fingerprint
} from 'lucide-react';
import adminService from '../../services/adminService';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminService.getStats()
      .then(res => setStats(res.data))
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <div className="h-full flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  }

  if (!stats) return <div className="text-red-500">Failed to load stats.</div>;

  const lineChartData = {
    labels: Object.keys(stats.uploadsLast7Days).reverse(),
    datasets: [
      {
        label: 'Daily Uploads',
        data: Object.values(stats.uploadsLast7Days).reverse(),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.4
      },
      {
        label: 'New Users',
        data: Object.values(stats.userSignupsLast7Days).reverse(),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        tension: 0.4
      }
    ]
  };

  const doughnutData = {
    labels: Object.keys(stats.documentsByCategory),
    datasets: [
      {
        label: 'Documents',
        data: Object.values(stats.documentsByCategory),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)'
        ],
        borderWidth: 0,
      }
    ]
  };

  const topCards = [
    { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { title: 'Total Documents', value: stats.totalDocuments, icon: FileText, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { title: 'Storage Used', value: `${(stats.totalStorageUsed / (1024*1024*1024)).toFixed(2)} GB`, icon: Database, color: 'text-amber-500', bg: 'bg-amber-50' },
    { title: 'AI Classifications', value: stats.totalAiClassifications, icon: Fingerprint, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-6 pb-8 max-w-7xl mx-auto">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" /> Admin Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Real-time platform metrics and growth telemetry</p>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {topCards.map((card, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">{card.title}</p>
              <h3 className="text-3xl font-bold text-gray-900">{card.value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-2xl ${card.bg} ${card.color} flex items-center justify-center`}>
              <card.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2"><Activity className="w-5 h-5"/> Growth Trends (Last 7 Days)</h2>
          <div className="h-72">
            <Line 
              data={lineChartData} 
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }} 
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-6">AI Document Categories</h2>
          <div className="h-64 flex justify-center">
            <Doughnut 
              data={doughnutData} 
              options={{ responsive: true, maintainAspectRatio: false, cutout: '70%' }} 
            />
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500">Active Online Users</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2 flex items-center gap-2">
            {stats.onlineUsers} <span className="text-xs text-success bg-success/10 px-2 py-1 rounded-full flex items-center"><ArrowUpRight className="w-3 h-3"/> Live</span>
          </p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500">Total OCR Jobs</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalOcrJobs}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500">Secure Shared Links</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalSharedLinks}</p>
        </div>
      </div>
    </div>
  );
}
