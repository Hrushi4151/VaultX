import { useState, useEffect } from 'react';
import { Activity, BarChart, PieChart, TrendingUp, Users } from 'lucide-react';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, Title, Tooltip, Legend, ArcElement, Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, Title, Tooltip, Legend, ArcElement, Filler
);

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminService.getStats()
      .then(res => setStats(res.data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!stats) return null;

  const uploadsData = {
    labels: Object.keys(stats.uploadsLast7Days).reverse(),
    datasets: [
      {
        label: 'Documents Uploaded',
        data: Object.values(stats.uploadsLast7Days).reverse(),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4
      }
    ]
  };

  const signupsData = {
    labels: Object.keys(stats.userSignupsLast7Days).reverse(),
    datasets: [
      {
        label: 'New User Signups',
        data: Object.values(stats.userSignupsLast7Days).reverse(),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderRadius: 8,
      }
    ]
  };

  const categoryData = {
    labels: Object.keys(stats.documentsByCategory),
    datasets: [
      {
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0"/> In-Depth Analytics
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Detailed breakdowns and historical trends</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Uploads Trend */}
        <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
            <h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-500 shrink-0"/> Upload Trends</h2>
          </div>
          <div className="h-80">
            <Line data={uploadsData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
          </div>
        </div>

        {/* Signups Trend */}
        <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
            <h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2"><Users className="w-5 h-5 text-emerald-500 shrink-0"/> User Signups</h2>
          </div>
          <div className="h-80">
            <Bar data={signupsData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
          </div>
        </div>

        {/* Document Categories */}
        <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
            <h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2"><PieChart className="w-5 h-5 text-amber-500 shrink-0"/> AI Document Categories</h2>
          </div>
          <div className="h-80 flex justify-center">
            <Doughnut data={categoryData} options={{ responsive: true, maintainAspectRatio: false, cutout: '65%' }} />
          </div>
        </div>
        
        {/* Mocked Security Events */}
        <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
            <h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2"><BarChart className="w-5 h-5 text-purple-500 shrink-0"/> Security Events</h2>
          </div>
          <div className="h-80">
             <Bar 
               data={{
                 labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                 datasets: [
                   { label: 'Failed Logins', data: [12, 19, 3, 5, 2, 3, 10], backgroundColor: 'rgba(239, 68, 68, 0.7)', borderRadius: 4 },
                   { label: 'MFA Challenges', data: [42, 39, 23, 25, 22, 13, 30], backgroundColor: 'rgba(139, 92, 246, 0.7)', borderRadius: 4 }
                 ]
               }} 
               options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { x: { stacked: true }, y: { stacked: true } } }} 
             />
          </div>
        </div>

      </div>
    </div>
  );
}
