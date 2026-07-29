import { useState, useEffect } from 'react';
import { X, Settings, Type, AlignLeft, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import bundleService from '../../services/bundleService';

export default function EditBundleModal({ isOpen, onClose, bundle, onUpdated }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    settings: {
      includeCoverPage: true,
      includeToc: true,
      includePageNumbers: true,
      compressOutput: false,
      watermarkText: ''
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (bundle && isOpen) {
      setFormData({
        name: bundle.name || '',
        description: bundle.description || '',
        settings: {
          includeCoverPage: bundle.settings?.includeCoverPage ?? true,
          includeToc: bundle.settings?.includeToc ?? true,
          includePageNumbers: bundle.settings?.includePageNumbers ?? true,
          compressOutput: bundle.settings?.compressOutput ?? false,
          watermarkText: bundle.settings?.watermarkText || ''
        }
      });
    }
  }, [bundle, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Bundle name is required');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Saving changes...');

    try {
      const res = await bundleService.updateBundle(bundle.id, formData);
      toast.success('Bundle updated successfully', { id: toastId });
      onUpdated(res.data);
      onClose();
    } catch (error) {
      toast.error('Failed to update bundle', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateSetting = (key, value) => {
    setFormData(prev => ({
      ...prev,
      settings: { ...prev.settings, [key]: value }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm overflow-hidden">
      <div 
        className="w-full max-w-xl max-h-full sm:max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Edit Bundle Settings</h2>
            <p className="text-sm text-gray-500 mt-0.5">Update details and export configuration</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Type className="w-4 h-4 text-primary" />
                Basic Details
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Bundle Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Q3 Financial Reports"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-gray-700"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What is this bundle for?"
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-gray-700 resize-none"
                />
              </div>
            </div>

            <div className="w-full h-px bg-gray-100 my-6"></div>

            {/* Export Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Settings className="w-4 h-4 text-primary" />
                PDF Export Configuration
              </h3>
              
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { id: 'includeCoverPage', label: 'Cover Page', desc: 'Add title page' },
                  { id: 'includeToc', label: 'Table of Contents', desc: 'Auto-generate TOC' },
                  { id: 'includePageNumbers', label: 'Page Numbers', desc: 'Number every page' },
                  { id: 'compressOutput', label: 'Compress PDF', desc: 'Reduce file size' }
                ].map(setting => (
                  <label 
                    key={setting.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      formData.settings[setting.id] 
                        ? 'bg-primary/5 border-primary/30' 
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-colors ${
                      formData.settings[setting.id]
                        ? 'bg-primary border-primary text-white'
                        : 'bg-white border-gray-300'
                    }`}>
                      {formData.settings[setting.id] && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{setting.label}</p>
                      <p className="text-xs text-gray-500">{setting.desc}</p>
                    </div>
                    <input 
                      type="checkbox" 
                      className="sr-only"
                      checked={formData.settings[setting.id]}
                      onChange={(e) => updateSetting(setting.id, e.target.checked)}
                    />
                  </label>
                ))}
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Watermark Text (Optional)</label>
                <input
                  type="text"
                  value={formData.settings.watermarkText}
                  onChange={e => updateSetting('watermarkText', e.target.value)}
                  placeholder="e.g., CONFIDENTIAL"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-gray-700 uppercase"
                />
              </div>
            </div>

          </div>
        </form>

        <div className="p-4 bg-gray-50/80 border-t border-gray-100 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
