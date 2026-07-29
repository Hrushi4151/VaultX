import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Shield, Lock, Download, AlertCircle, FileText, ChevronRight, Check, Eye, Image as ImageIcon, File } from 'lucide-react';
import toast from 'react-hot-toast';
import publicShareService from '../../services/publicShareService';
import DocumentPreviewModal from '../../components/documents/DocumentPreviewModal';

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

export default function PublicSharePage() {
  const { token } = useParams();
  
  const [metadata, setMetadata] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isCheckingPassword, setIsCheckingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [isDownloading, setIsDownloading] = useState(false);
  
  const [documents, setDocuments] = useState([]);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);

  useEffect(() => {
    if (isUnlocked && token) {
      const fetchDocs = async () => {
        try {
          const res = await publicShareService.getDocuments(token, password);
          setDocuments(res.data);
        } catch (err) {
          toast.error("Failed to fetch documents for this share.");
        }
      };
      fetchDocs();
    }
  }, [isUnlocked, token, password]);

  const handlePreview = async (doc) => {
    const toastId = toast.loading('Loading preview...');
    try {
      const res = await publicShareService.downloadSingleDocument(token, doc.id, password);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: doc.mimeType }));
      setPreviewBlobUrl(url);
      setPreviewDoc(doc);
      toast.dismiss(toastId);
    } catch (err) {
      toast.error('Failed to load preview', { id: toastId });
    }
  };

  const handleSingleDownload = async (doc) => {
    const toastId = toast.loading('Downloading...');
    try {
      const res = await publicShareService.downloadSingleDocument(token, doc.id, password);
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
    const fetchMetadata = async () => {
      try {
        const res = await publicShareService.getMetadata(token);
        setMetadata(res.data);
        if (!res.data.passwordProtected) {
          setIsUnlocked(true);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'This link is invalid or has expired.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMetadata();
  }, [token]);

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (!password) return;
    
    setIsCheckingPassword(true);
    setPasswordError('');
    try {
      const res = await publicShareService.verifyPassword(token, password);
      if (res.data.valid) {
        setIsUnlocked(true);
      } else {
        setPasswordError('Incorrect password');
      }
    } catch (err) {
      setPasswordError('Failed to verify password');
    } finally {
      setIsCheckingPassword(false);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const res = await publicShareService.downloadShare(token, password);
      // Create blob download
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      // Default to .zip if it's multiple files, .pdf if single. We can just use the Content-Disposition header in a real app, 
      // but for simplicity here we'll append .zip if fileCount > 1
      const filename = metadata.fileCount > 1 ? `VaultX_Share_${token}.zip` : `VaultX_Document_${token}.pdf`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download file(s).');
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-3xl p-8 text-center shadow-xl shadow-gray-200/50 border border-gray-100">
          <div className="w-20 h-20 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 text-primary font-bold text-2xl tracking-tight mb-2">
            <Shield className="w-8 h-8" />
            VaultX
          </div>
          <p className="text-gray-500 font-medium">{metadata.ownerName} shared a secure link with you.</p>
        </div>

        <div className="bg-white max-w-md w-full rounded-3xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100">
          <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Password Protected</h2>
          <p className="text-gray-500 text-center text-sm mb-8">This content is protected by end-to-end encryption. Please enter the password to unlock.</p>
          
          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <input 
                type="password" 
                placeholder="Enter password..."
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary outline-none text-center font-medium"
              />
              {passwordError && <p className="text-danger text-xs font-bold mt-2 text-center">{passwordError}</p>}
            </div>
            <button 
              type="submit" 
              disabled={isCheckingPassword || !password}
              className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-md disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isCheckingPassword ? 'Unlocking...' : 'Unlock Content'} <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-bold text-2xl tracking-tight">
            <Shield className="w-8 h-8" />
            VaultX
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
            <Lock className="w-4 h-4" /> Secure Share
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Left: Info & Download */}
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">{metadata.name}</h1>
              <p className="text-gray-500 mb-8">Shared securely by <span className="font-bold text-gray-700">{metadata.ownerName}</span></p>

              <button 
                onClick={handleDownload}
                disabled={isDownloading}
                className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/30 flex flex-col items-center justify-center gap-1 group active:scale-95 disabled:opacity-70"
              >
                <div className="flex items-center gap-2 text-lg">
                  <Download className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
                  {isDownloading ? 'Downloading...' : (metadata.fileCount > 1 ? 'Download All as ZIP' : 'Download File')}
                </div>
                <span className="text-xs font-normal text-white/80">{metadata.fileCount} file(s) inside</span>
              </button>

              <div className="mt-8 pt-8 border-t border-gray-100 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 font-medium">Shared On</span>
                  <span className="text-gray-800 font-bold">{new Date(metadata.sharedOn).toLocaleDateString()}</span>
                </div>
                {metadata.expiresAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 font-medium">Expires On</span>
                    <span className="text-danger font-bold">{new Date(metadata.expiresAt).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 font-medium">End-to-End Encryption</span>
                  <span className="text-success font-bold flex items-center gap-1"><Check className="w-4 h-4"/> Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Previews */}
          <div className="md:col-span-2">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2"><FileText className="w-5 h-5"/> Included Files ({metadata.fileCount})</h2>
              
              {documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 hover:bg-white rounded-xl border border-gray-100 transition-all hover:shadow-sm group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 shrink-0 rounded-lg bg-white shadow-sm flex items-center justify-center border border-gray-50">
                          <DocIcon mimeType={doc.mimeType} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-800 truncate group-hover:text-primary transition-colors">{doc.displayName || doc.originalFilename}</p>
                          <p className="text-xs text-gray-500 font-medium">{formatSize(doc.fileSize)} • {doc.extension?.toUpperCase()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handlePreview(doc)}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button 
                          onClick={() => handleSingleDownload(doc)}
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
                <div className="h-64 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-gray-50/50">
                  <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                  <h3 className="text-lg font-bold text-gray-700 mb-2">Loading documents...</h3>
                </div>
              )}

            </div>
          </div>

        </div>
      </main>
      
      <DocumentPreviewModal 
        isOpen={!!previewDoc}
        onClose={() => {
          setPreviewDoc(null);
          setPreviewBlobUrl(null);
        }}
        document={previewDoc}
        onDownload={handleSingleDownload}
        preloadedBlobUrl={previewBlobUrl}
      />
    </div>
  );
}
