import { useState, useEffect } from 'react';
import { 
  FileText, ShieldAlert, Clock, FolderHeart, 
  UploadCloud, Star, Lock, Activity, PieChart,
  Bot, AlertTriangle, FileWarning, Fingerprint, Calendar
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import dashboardService from '../../services/dashboardService';
import aiService from '../../services/aiService';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

import SmartCategorizationModal from '../../components/dashboard/ai/SmartCategorizationModal';
import OcrScansModal from '../../components/dashboard/ai/OcrScansModal';
import ExpiringDocumentsModal from '../../components/dashboard/ai/ExpiringDocumentsModal';
import DuplicateAlertsModal from '../../components/dashboard/ai/DuplicateAlertsModal';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isSmartCatOpen, setIsSmartCatOpen] = useState(false);
  const [isOcrOpen, setIsOcrOpen] = useState(false);
  const [isExpiringOpen, setIsExpiringOpen] = useState(false);
  const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);

  const userName = user
    ? (user.firstName ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}` : user.username)
    : 'User';

  const fetchData = async () => {
    try {
      const [statsRes, aiRes] = await Promise.all([
        dashboardService.getStats(),
        aiService.getSummary().catch(() => ({ data: null }))
      ]);
      setStats(statsRes.data);
      if (aiRes?.data) setAiSummary(aiRes.data);
    } catch (error) {
      toast.error('Failed to load dashboard stats');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDocumentClickFromModal = (doc) => {
    if (doc?.id) {
      navigate(`/dashboard/documents/${doc.id}`);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Documents', value: stats?.totalDocuments || 0, icon: FileText, bg: 'bg-gradient-to-br from-blue-500 to-blue-600', text: 'text-blue-600', lightBg: 'bg-blue-50' },
    { label: 'Storage Used', value: formatSize(stats?.totalStorageUsed), icon: ShieldAlert, bg: 'bg-gradient-to-br from-indigo-500 to-indigo-600', text: 'text-indigo-600', lightBg: 'bg-indigo-50' },
    { label: 'Favourites', value: stats?.favouriteDocuments || 0, icon: Star, bg: 'bg-gradient-to-br from-amber-400 to-amber-500', text: 'text-amber-500', lightBg: 'bg-amber-50' },
    { label: 'In Trash', value: stats?.trashDocuments || 0, icon: FolderHeart, bg: 'bg-gradient-to-br from-rose-400 to-rose-500', text: 'text-rose-500', lightBg: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 h-full overflow-y-auto pb-24 sm:pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6 relative">
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 tracking-tight">
            Welcome back, {userName.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base font-medium max-w-xl">
            Here's a smart overview of your secure document vault.
          </p>
        </div>
        <Link 
          to="/dashboard/documents"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl sm:rounded-2xl hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 text-sm font-semibold active:scale-95"
        >
          <UploadCloud className="w-5 h-5" />
          Upload Files
        </Link>
      </div>

      {/* Stat cards - Now 2x2 grid on mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {statCards.map((stat, idx) => (
          <div 
            key={stat.label}
            className="group relative bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            {/* Background decorative blob */}
            <div className={`absolute -right-4 -top-4 sm:-right-6 sm:-top-6 w-16 h-16 sm:w-24 sm:h-24 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-700 ${stat.bg}`} />
            
            <div className="flex items-start justify-between mb-2 sm:mb-4 relative z-10">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${stat.lightBg} ${stat.text} flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-inner`}>
                <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight">{stat.value}</p>
              <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-0.5 sm:mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Document Insights & AI */}
        <div className="lg:col-span-2 bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-6 relative overflow-hidden">
          {/* Subtle gradient background for AI section */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 to-purple-50/30 pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 relative z-10 gap-2 sm:gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <div className="p-1.5 sm:p-2 bg-indigo-100 text-indigo-600 rounded-lg sm:rounded-xl">
                <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              AI Document Insights
            </h2>
            <Badge variant="primary" className="bg-indigo-100 text-indigo-700 border-indigo-200 shadow-sm font-semibold text-xs sm:text-sm px-2 py-0.5 sm:px-3 sm:py-1 self-start sm:self-auto">
              Powered by VaultX AI
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 relative z-10">
            {/* AI Categories Card */}
            <div 
              onClick={() => setIsSmartCatOpen(true)}
              className="p-4 sm:p-5 bg-white hover:bg-gradient-to-br hover:from-purple-50 hover:to-white border border-gray-100 hover:border-purple-200 rounded-xl sm:rounded-2xl flex items-center sm:items-start gap-3 sm:gap-4 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-inner">
                <Fingerprint className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-purple-700 transition-colors">Smart Categorization</h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 leading-snug sm:leading-relaxed">
                  <span className="font-bold text-purple-600 bg-purple-50 px-1 py-0.5 sm:px-1.5 rounded-md">{aiSummary?.smartCategorizedCount || stats?.totalDocuments || 0} docs</span> tagged by AI.
                </p>
              </div>
            </div>

            {/* Recent OCR Card */}
            <div 
              onClick={() => setIsOcrOpen(true)}
              className="p-4 sm:p-5 bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-white border border-gray-100 hover:border-blue-200 rounded-xl sm:rounded-2xl flex items-center sm:items-start gap-3 sm:gap-4 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:-rotate-6 transition-all shadow-inner">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-blue-700 transition-colors">Recent OCR Scans</h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 leading-snug sm:leading-relaxed">
                  <span className="font-bold text-blue-600 bg-blue-50 px-1 py-0.5 sm:px-1.5 rounded-md">{aiSummary?.ocrProcessedCount || stats?.totalDocuments || 0} docs</span> processed for search.
                </p>
              </div>
            </div>

            {/* Expiring Documents Card */}
            <div 
              onClick={() => setIsExpiringOpen(true)}
              className="p-4 sm:p-5 bg-white hover:bg-gradient-to-br hover:from-rose-50 hover:to-white border border-gray-100 hover:border-rose-200 rounded-xl sm:rounded-2xl flex items-center sm:items-start gap-3 sm:gap-4 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all shadow-inner relative">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
                {(aiSummary?.expiringDocsCount > 0) && (
                  <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-rose-500 rounded-full animate-ping" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-rose-700 transition-colors">Expiring Documents</h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 leading-snug sm:leading-relaxed truncate sm:whitespace-normal max-w-[200px] sm:max-w-none">
                  <span className="font-bold text-rose-600 bg-rose-50 px-1 py-0.5 sm:px-1.5 rounded-md">{aiSummary?.expiringDocsCount || 0} docs</span> ({aiSummary?.expiringSummary || 'Passports, Contracts'}).
                </p>
              </div>
            </div>

            {/* Duplicate Alerts Card */}
            <div 
              onClick={() => setIsDuplicateOpen(true)}
              className="p-4 sm:p-5 bg-white hover:bg-gradient-to-br hover:from-amber-50 hover:to-white border border-gray-100 hover:border-amber-200 rounded-xl sm:rounded-2xl flex items-center sm:items-start gap-3 sm:gap-4 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all shadow-inner relative">
                <FileWarning className="w-5 h-5 sm:w-6 sm:h-6" />
                {(aiSummary?.duplicateFilesCount > 0) && (
                  <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-amber-500 border-2 border-white rounded-full" />
                )}
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-amber-700 transition-colors">Duplicate Alerts</h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 leading-snug sm:leading-relaxed">
                  <span className="font-bold text-amber-600 bg-amber-50 px-1 py-0.5 sm:px-1.5 rounded-md">{aiSummary?.duplicateFilesCount || 0} exact duplicates</span> found.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-6 flex flex-col">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2 mb-4 sm:mb-6">
            <div className="p-1.5 sm:p-2 bg-emerald-100 text-emerald-600 rounded-lg sm:rounded-xl">
              <PieChart className="w-4 h-4 sm:w-5 sm:h-5"/>
            </div>
            Category Breakdown
          </h2>
          {stats?.categoryBreakdown?.length > 0 ? (
            <div className="space-y-2.5 sm:space-y-3 flex-1 overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
              {stats.categoryBreakdown.map((cat, idx) => (
                <div key={cat.categoryName} className="group flex items-center justify-between p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-gray-100 bg-white hover:bg-gray-50 hover:border-gray-200 transition-all hover:shadow-sm">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0 ${['bg-indigo-500', 'bg-purple-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500'][idx % 5]}`} />
                    <span className="text-xs sm:text-sm font-semibold text-gray-700 truncate">{cat.categoryName}</span>
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">{cat.count} files</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-center text-gray-400 py-4 sm:py-0">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-50 flex items-center justify-center mb-2 sm:mb-3">
                <PieChart className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300" />
              </div>
              <p className="text-xs sm:text-sm font-medium">No categories used yet</p>
              <p className="text-[10px] sm:text-xs mt-1">Upload files to see insights</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Interactive Modals */}
      <SmartCategorizationModal
        isOpen={isSmartCatOpen}
        onClose={() => setIsSmartCatOpen(false)}
        onDocumentClick={handleDocumentClickFromModal}
      />

      <OcrScansModal
        isOpen={isOcrOpen}
        onClose={() => setIsOcrOpen(false)}
        onDocumentClick={handleDocumentClickFromModal}
      />

      <ExpiringDocumentsModal
        isOpen={isExpiringOpen}
        onClose={() => setIsExpiringOpen(false)}
        onDocumentClick={handleDocumentClickFromModal}
      />

      <DuplicateAlertsModal
        isOpen={isDuplicateOpen}
        onClose={() => setIsDuplicateOpen(false)}
        onDocumentClick={handleDocumentClickFromModal}
        onUpdate={fetchData}
      />

    </div>
  );
}
