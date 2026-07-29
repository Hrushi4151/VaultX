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
    { label: 'Total Documents', value: stats?.totalDocuments || 0, icon: FileText, color: 'bg-blue-50 text-blue-500' },
    { label: 'Storage Used', value: formatSize(stats?.totalStorageUsed), icon: ShieldAlert, color: 'bg-indigo-50 text-indigo-500' },
    { label: 'Favourites', value: stats?.favouriteDocuments || 0, icon: Star, color: 'bg-amber-50 text-amber-500' },
    { label: 'In Trash', value: stats?.trashDocuments || 0, icon: FolderHeart, color: 'bg-red-50 text-red-500' },
  ];

  return (
    <div className="space-y-8 h-full overflow-y-auto pb-8">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="page-title">
            Welcome back, {userName.split(' ')[0]} 👋
          </h1>
          <p className="page-subtitle mt-1">
            Here's an overview of your secure document vault.
          </p>
        </div>
        <Link 
          to="/dashboard/documents"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors text-sm font-medium"
        >
          <UploadCloud className="w-4 h-4" />
          Upload Files
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5" aria-hidden="true" />
              </div>
            </div>
            <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
            <p className="text-sm text-text-muted mt-0.5">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Document Insights & AI */}
        <Card
          className="lg:col-span-2"
          header={
            <div className="flex items-center justify-between">
              <h2 className="section-title flex items-center gap-2"><Bot className="w-5 h-5 text-primary"/> AI Document Insights</h2>
              <Badge variant="primary" className="bg-primary/10 text-primary border-primary/20">Powered by VaultX AI</Badge>
            </div>
          }
        >
          <div className="grid sm:grid-cols-2 gap-4">
            
            {/* AI Categories Card */}
            <div 
              onClick={() => setIsSmartCatOpen(true)}
              className="p-4 bg-purple-50/50 hover:bg-purple-50 border border-purple-100 rounded-2xl flex items-start gap-4 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md hover:border-purple-200 group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-sm group-hover:text-purple-700 transition-colors">Smart Categorization</h3>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="font-bold text-purple-700">{aiSummary?.smartCategorizedCount || stats?.totalDocuments || 0} documents</span> identified & tagged by VaultX AI.
                </p>
              </div>
            </div>

            {/* Recent OCR Card */}
            <div 
              onClick={() => setIsOcrOpen(true)}
              className="p-4 bg-blue-50/50 hover:bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-4 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md hover:border-blue-200 group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-sm group-hover:text-blue-700 transition-colors">Recent OCR Scans</h3>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="font-bold text-blue-700">{aiSummary?.ocrProcessedCount || stats?.totalDocuments || 0} documents</span> processed for full-text search.
                </p>
              </div>
            </div>

            {/* Expiring Documents Card */}
            <div 
              onClick={() => setIsExpiringOpen(true)}
              className="p-4 bg-red-50/50 hover:bg-red-50 border border-red-100 rounded-2xl flex items-start gap-4 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md hover:border-red-200 group"
            >
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-sm group-hover:text-red-700 transition-colors">Expiring Documents</h3>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="font-bold text-red-600">{aiSummary?.expiringDocsCount || 0} documents</span> ({aiSummary?.expiringSummary || 'Passports, Contracts'}).
                </p>
              </div>
            </div>

            {/* Duplicate Alerts Card */}
            <div 
              onClick={() => setIsDuplicateOpen(true)}
              className="p-4 bg-amber-50/50 hover:bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md hover:border-amber-200 group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <FileWarning className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-sm group-hover:text-amber-700 transition-colors">Duplicate Alerts</h3>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="font-bold text-amber-600">{aiSummary?.duplicateFilesCount || 0} exact duplicate(s)</span> found in vault.
                </p>
              </div>
            </div>

          </div>
        </Card>

        {/* Category Breakdown */}
        <Card header={<h2 className="section-title flex items-center gap-2"><PieChart className="w-4 h-4"/> Category Breakdown</h2>}>
          {stats?.categoryBreakdown?.length > 0 ? (
            <div className="space-y-3">
              {stats.categoryBreakdown.map((cat) => (
                <div key={cat.categoryName} className="flex items-center justify-between p-3 rounded-xl border border-border bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-sm font-medium text-gray-700">{cat.categoryName}</span>
                  </div>
                  <Badge variant="gray">{cat.count} files</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400 text-sm">
              <PieChart className="w-10 h-10 mb-2 opacity-20" />
              No categories used yet
            </div>
          )}
        </Card>
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
