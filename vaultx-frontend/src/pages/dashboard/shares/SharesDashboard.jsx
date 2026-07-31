import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Share2, Plus, Globe, Lock, Link as LinkIcon, Trash2, Eye, Download, Search, AlertCircle, Copy, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import shareService from '../../../services/shareService';

export default function SharesDashboard() {
  const navigate = useNavigate();
  const [shares, setShares] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchShares = async () => {
    try {
      const res = await shareService.getUserShares(0, 50);
      setShares(res.data.content);
    } catch (err) {
      toast.error('Failed to load shares');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShares();
  }, []);

  const handleRevoke = async (id) => {
    try {
      await shareService.revokeShare(id);
      toast.success('Link revoked successfully');
      fetchShares();
    } catch (err) {
      toast.error('Failed to revoke link');
    }
  };

  const handleCopy = (token) => {
    const url = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  const filteredShares = shares.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="h-full flex flex-col pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">Secure Shares</h1>
          <p className="page-subtitle mt-1">Manage public links and track analytics for your shared documents.</p>
        </div>
        <button 
          onClick={() => navigate('/dashboard/shares/create')}
          className="btn-primary flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl shadow-md shadow-primary/20 w-full sm:w-auto"
        >
          <Share2 className="w-5 h-5" />
          Create Share Link
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden">
        
        <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search active shares..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-primary outline-none transition-colors"
            />
          </div>
          
          <div className="flex gap-4 w-full sm:w-auto">
            <div className="px-4 py-2 bg-white border border-gray-100 rounded-xl flex items-center gap-2 shadow-sm flex-1 sm:flex-none justify-center">
              <Globe className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-gray-700">{shares.filter(s => s.active).length} Active</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : filteredShares.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-6">
                <Share2 className="w-10 h-10 text-primary/40" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No active shares found</h3>
              <p className="text-gray-500 max-w-sm mb-6">Create secure links to securely share your documents, collections, and bundles with clients or colleagues.</p>
              <button onClick={() => navigate('/dashboard/shares/create')} className="btn-primary px-6 py-2.5 rounded-xl">Create your first link</button>
            </div>
          ) : (
          <div className="flex flex-col divide-y divide-gray-50">
            {filteredShares.map(share => (
              <div 
                key={share.id} 
                className="flex flex-col lg:flex-row lg:items-center justify-between p-4 sm:p-6 bg-white hover:bg-gray-50/80 transition-all group cursor-pointer gap-4 lg:gap-6"
                onClick={() => navigate(`/dashboard/shares/${share.id}`)}
              >
                {/* Left: Icon & Info */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-sm border border-primary/10">
                    <LinkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-800 text-base sm:text-lg truncate group-hover:text-primary transition-colors">{share.name}</h3>
                    <p className="text-[11px] sm:text-xs text-gray-500 font-medium mt-0.5">Created on {new Date(share.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Right: Badges, Stats & Actions */}
                <div className="flex flex-row flex-wrap lg:flex-nowrap items-center gap-4 sm:gap-6 w-full lg:w-auto lg:justify-end">
                  
                  {/* Status & Badges */}
                  <div className="flex items-center gap-3">
                    {share.active ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 text-success text-[11px] font-bold tracking-wide uppercase">
                        <div className="w-1.5 h-1.5 rounded-full bg-success" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-[11px] font-bold tracking-wide uppercase">
                        <AlertCircle className="w-3.5 h-3.5" /> Revoked
                      </span>
                    )}
                    
                    <div className="flex gap-2 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                      {share.passwordProtected ? <Lock className="w-4 h-4 text-amber-500" title="Password Protected" /> : <Globe className="w-4 h-4 text-gray-300" title="Public Link" />}
                      {share.expiresAt && <Clock className="w-4 h-4 text-blue-500" title="Time Limited" />}
                    </div>
                  </div>

                  {/* Analytics */}
                  <div className="flex items-center gap-4 bg-gray-50 px-4 py-1.5 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-1.5 text-gray-500" title="Views">
                      <Eye className="w-4 h-4" />
                      <span className="text-sm font-bold text-gray-700">{share.viewsCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500 border-l border-gray-200 pl-4" title="Downloads">
                      <Download className="w-4 h-4" />
                      <span className="text-sm font-bold text-gray-700">{share.downloadsCount}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity ml-auto lg:ml-0">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleCopy(share.token); }}
                      className="p-2.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-xl bg-white shadow-sm border border-gray-100 transition-all"
                      title="Copy Link"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    {share.active && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleRevoke(share.id); }}
                        className="p-2.5 text-gray-400 hover:text-danger hover:bg-danger/10 rounded-xl bg-white shadow-sm border border-gray-100 transition-all"
                        title="Revoke Access"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
