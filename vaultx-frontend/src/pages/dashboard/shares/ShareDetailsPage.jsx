import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Share2, Globe, Clock, Download, Eye, Shield, Trash2, Key, File, Image as ImageIcon, FileText, Copy } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import shareService from '../../../services/shareService';
import documentService from '../../../services/documentService';
import DocumentPreviewModal from '../../../components/documents/DocumentPreviewModal';

function DocIcon({ mimeType }) {
  if (mimeType?.startsWith('image/')) return <ImageIcon className="w-8 h-8 text-blue-500" />;
  if (mimeType === 'application/pdf') return <FileText className="w-8 h-8 text-red-500" />;
  return <File className="w-8 h-8 text-gray-500" />;
}

function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ShareDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [share, setShare] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stats'); // 'stats', 'documents', 'configuration'
  
  // Preview State
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);

  const handlePreview = async (doc) => {
    const toastId = toast.loading('Loading preview...');
    try {
      const res = await documentService.downloadDocument(doc.id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: doc.mimeType }));
      setPreviewBlobUrl(url);
      setPreviewDoc(doc);
      toast.dismiss(toastId);
    } catch (err) {
      toast.error('Failed to load preview', { id: toastId });
    }
  };

  const handleDownload = async (doc) => {
    const toastId = toast.loading('Downloading...');
    try {
      const res = await documentService.downloadDocument(doc.id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: doc.mimeType }));
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.originalFilename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success('Downloaded', { id: toastId });
    } catch (err) {
      toast.error('Download failed', { id: toastId });
    }
  };

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await shareService.getShare(id);
        setShare(res.data);
      } catch (err) {
        toast.error('Failed to load share details');
        navigate('/dashboard/shares');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [id, navigate]);

  if (isLoading) return <div className="h-full flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  if (!share) return null;

  return (
    <div className="h-full flex flex-col pb-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="flex items-start sm:items-center gap-3 sm:gap-4">
          <button onClick={() => navigate('/dashboard/shares')} className="mt-1 sm:mt-0 p-2 bg-white rounded-xl border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors shadow-sm shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="page-title flex items-center gap-3">
              {share.name}
              {share.active ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-success/10 text-success text-xs font-bold">Active</span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-bold">Revoked</span>
              )}
            </h1>
            <p className="page-subtitle mt-1 font-mono text-[10px] sm:text-xs truncate max-w-[250px] sm:max-w-md">{window.location.origin}/share/{share.token}</p>
          </div>
        </div>
        
        {share.active && (
          <button 
            onClick={async () => {
              try {
                await shareService.revokeShare(share.id);
                setShare({...share, active: false});
                toast.success('Link Revoked');
              } catch(e) { toast.error('Failed to revoke'); }
            }}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-danger/10 text-danger rounded-xl hover:bg-danger/20 transition-colors font-bold text-sm w-full sm:w-auto shrink-0"
          >
            <Trash2 className="w-4 h-4" /> Revoke Access
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex p-1.5 bg-gray-100/80 rounded-2xl mb-8 overflow-x-auto no-scrollbar w-full xl:w-max shadow-inner border border-gray-200/50">
        <button 
          onClick={() => setActiveTab('stats')}
          className={`flex-1 sm:flex-none px-5 sm:px-8 py-2.5 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeTab === 'stats' ? 'bg-white text-primary shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/50 border border-transparent'}`}
        >
          Stats & Analytics
        </button>
        <button 
          onClick={() => setActiveTab('documents')}
          className={`flex-1 sm:flex-none px-5 sm:px-8 py-2.5 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeTab === 'documents' ? 'bg-white text-primary shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/50 border border-transparent'}`}
        >
          Documents
        </button>
        <button 
          onClick={() => setActiveTab('configuration')}
          className={`flex-1 sm:flex-none px-5 sm:px-8 py-2.5 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeTab === 'configuration' ? 'bg-white text-primary shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/50 border border-transparent'}`}
        >
          Configuration
        </button>
      </div>

      <div className="flex-1">
        
        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-600 text-sm">Total Views</h3>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center"><Eye className="w-4 h-4"/></div>
                </div>
                <p className="text-2xl font-bold text-gray-800">{share.viewsCount}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-600 text-sm">Total Downloads</h3>
                  <div className="w-8 h-8 rounded-lg bg-green-50 text-green-500 flex items-center justify-center"><Download className="w-4 h-4"/></div>
                </div>
                <p className="text-2xl font-bold text-gray-800">{share.downloadsCount}</p>
              </div>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 h-64 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Globe className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Detailed Analytics Coming Soon</h3>
              <p className="text-sm text-gray-500 max-w-xs">Detailed logs of IP addresses, browsers, and operating systems accessing this link will appear here.</p>
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
            <h3 className="font-bold text-gray-800 mb-4 sm:mb-6 text-base sm:text-lg">Shared Documents</h3>
            {share.documents && share.documents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {share.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 hover:bg-white rounded-xl border border-gray-100 transition-all hover:shadow-sm group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 shrink-0 rounded-lg bg-white shadow-sm flex items-center justify-center border border-gray-50">
                        <DocIcon mimeType={doc.mimeType} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate group-hover:text-primary transition-colors">{doc.displayName}</p>
                        <p className="text-xs text-gray-500 font-medium">{formatSize(doc.fileSize)} • {doc.extension.toUpperCase()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        onClick={() => handlePreview(doc)}
                        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      <button 
                        onClick={() => handleDownload(doc)}
                        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <File className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <h4 className="text-base sm:text-lg font-bold text-gray-700 mb-1">No Documents</h4>
                <p className="text-sm">This share link doesn't contain any documents.</p>
              </div>
            )}
          </div>
        )}

        {/* Configuration Tab */}
        {activeTab === 'configuration' && (
          <div className="animate-fade-in w-full">
            <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6 sm:space-y-8 w-full">
              <h3 className="font-bold text-gray-800 text-base sm:text-lg border-b border-gray-100 pb-3 sm:pb-4">Link Configuration</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                    <Clock className="w-5 h-5"/>
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Expires On</p>
                    <p className="text-sm font-bold text-gray-800">{share.expiresAt ? new Date(share.expiresAt).toLocaleString() : 'Never expires'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
                    <Download className="w-5 h-5"/>
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Download Limit</p>
                    <p className="text-sm font-bold text-gray-800">{share.maxDownloads ? `${share.downloadsCount} / ${share.maxDownloads} used` : 'Unlimited'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                    <Shield className="w-5 h-5"/>
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Security</p>
                    <p className="text-sm font-bold text-gray-800">{share.passwordProtected ? 'Password Protected' : 'Public Link'}</p>
                  </div>
                </div>
              </div>
              
              
              {/* Link & QR Code Section */}
              <div className="pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-start">
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <h4 className="font-bold text-gray-800 mb-1">Share Link</h4>
                    <p className="text-xs text-gray-500">Copy this link or scan the QR code to access the share.</p>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
                    <input 
                      type="text" 
                      readOnly 
                      value={`${window.location.origin}/share/${share.token}`}
                      className="bg-transparent border-none outline-none text-sm font-mono text-gray-600 px-2 flex-1 min-w-0"
                    />
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/share/${share.token}`);
                        toast.success('Link copied to clipboard!');
                      }}
                      className="p-2 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg shadow-sm transition-colors shrink-0"
                      title="Copy link"
                    >
                      <Copy className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col items-center justify-center space-y-3 p-6 bg-gray-50 rounded-2xl border border-gray-100 h-full w-full max-w-sm mx-auto md:max-w-none">
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                    <QRCodeSVG 
                      value={`${window.location.origin}/share/${share.token}`} 
                      size={120}
                      level={"Q"}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Scan QR</span>
                </div>
              </div>

              {share.active && (
                <div className="pt-6 border-t border-gray-100">
                  <button 
                    onClick={() => toast('Password update UI coming soon')}
                    className="w-full sm:w-max px-6 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Key className="w-4 h-4" /> Change Password
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      <DocumentPreviewModal 
        isOpen={!!previewDoc}
        onClose={() => {
          setPreviewDoc(null);
          setPreviewBlobUrl(null);
        }}
        document={previewDoc}
        onDownload={handleDownload}
        preloadedBlobUrl={previewBlobUrl}
      />
    </div>
  );
}
