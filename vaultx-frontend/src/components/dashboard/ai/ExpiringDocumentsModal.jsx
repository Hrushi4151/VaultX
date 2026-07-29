import { useState, useEffect } from 'react';
import { X, Calendar, AlertTriangle, Clock, Plus, CheckCircle, Edit2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import aiService from '../../../services/aiService';
import documentService from '../../../services/documentService';

export default function ExpiringDocumentsModal({ isOpen, onClose, onDocumentClick }) {
  const [data, setData] = useState([]);
  const [allDocs, setAllDocs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [expRes, docsRes] = await Promise.all([
        aiService.getExpiringDocuments(),
        documentService.getActiveDocuments()
      ]);
      setData(expRes.data);
      setAllDocs(docsRes.data.content || []);
    } catch (err) {
      toast.error('Failed to load expiring documents');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const handleAddOrUpdateExpiry = async (e) => {
    e.preventDefault();
    if (!selectedDocId || !newExpiryDate) {
      toast.error('Please select a document and an expiry date');
      return;
    }

    try {
      setIsSaving(true);
      await aiService.setExpiryDate(selectedDocId, newExpiryDate);
      toast.success('Expiry date set successfully');
      setSelectedDocId('');
      setNewExpiryDate('');
      await fetchData();
    } catch (err) {
      toast.error('Failed to set expiry date');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-red-500 to-rose-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                Expiring Documents & Reminders
                <span className="px-2.5 py-0.5 text-xs bg-white/20 rounded-full font-normal">VaultX Guard</span>
              </h2>
              <p className="text-red-100 text-xs mt-0.5">
                Track passports, insurance, contracts & licenses before they expire
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Set Expiry Form */}
        <form onSubmit={handleAddOrUpdateExpiry} className="p-4 border-b border-gray-100 bg-red-50/40 flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full">
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            >
              <option value="">Select a document to set expiry date...</option>
              {allDocs.map(doc => (
                <option key={doc.id} value={doc.id}>{doc.displayName}</option>
              ))}
            </select>
          </div>

          <input 
            type="date"
            value={newExpiryDate}
            onChange={(e) => setNewExpiryDate(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          />

          <button
            type="submit"
            disabled={isSaving || !selectedDocId || !newExpiryDate}
            className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 whitespace-nowrap shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Set Expiry
          </button>
        </form>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="py-16 text-center">
              <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500">Checking document expiry timelines...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-gray-200 rounded-2xl">
              <Calendar className="w-10 h-10 text-red-300 mx-auto mb-2" />
              <h3 className="text-base font-semibold text-gray-700">No expiring documents tracked yet</h3>
              <p className="text-xs text-gray-400 max-w-xs mx-auto mt-1">
                Use the form above to select a passport, contract, or license and assign an expiration date.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {data.map(item => {
                const isCritical = item.expired || item.daysRemaining <= 15;
                return (
                  <div 
                    key={item.id}
                    onClick={() => onDocumentClick && onDocumentClick(item.document)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between ${
                      item.expired 
                        ? 'bg-red-50/60 border-red-200 hover:border-red-400'
                        : isCritical
                        ? 'bg-amber-50/60 border-amber-200 hover:border-amber-400'
                        : 'bg-white border-gray-100 hover:border-gray-300 shadow-sm'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                            item.expired ? 'bg-red-100 text-red-600' : 'bg-red-50 text-red-500'
                          }`}>
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-gray-800 text-sm truncate group-hover:text-red-600 transition-colors">
                              {item.document?.displayName}
                            </h4>
                            <span className="text-[11px] text-gray-400">
                              {item.categoryName || 'Document'}
                            </span>
                          </div>
                        </div>

                        <span className={`px-2.5 py-1 text-xs font-bold rounded-lg flex items-center gap-1 ${
                          item.expired
                            ? 'bg-red-600 text-white'
                            : isCritical
                            ? 'bg-amber-500 text-white'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {item.expired ? (
                            <>
                              <AlertTriangle className="w-3.5 h-3.5" />
                              EXPIRED
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5" />
                              {item.daysRemaining} days left
                            </>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                        <span>Expires on: <strong className="text-gray-700">{item.expiryDate}</strong></span>
                        <span className="text-[11px] text-gray-400">Auto Reminders Active</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>Tracking {data.length} document expiration dates</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 text-white rounded-xl font-medium hover:bg-black transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
