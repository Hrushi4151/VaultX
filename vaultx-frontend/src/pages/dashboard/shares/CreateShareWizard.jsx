import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, Shield, FileText, Globe, Clock, Lock, Eye, Copy, QrCode, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import documentService from '../../../services/documentService';
import shareService from '../../../services/shareService';

const STEPS = ['Content', 'Permissions', 'Security', 'Limits', 'Review', 'Finish'];

export default function CreateShareWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalShareData, setFinalShareData] = useState(null);

  const [vaultDocs, setVaultDocs] = useState([]);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    targetType: 'DOCUMENT',
    documentIds: [],
    allowDownload: true,
    allowPrint: false,
    allowCopy: false,
    password: '',
    expiryType: 'NEVER',
    maxDownloads: 'UNLIMITED'
  });

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await documentService.getActiveDocuments(0, 50);
        setVaultDocs(res.data.content);
      } catch (err) {
        toast.error('Failed to load documents');
      }
    };
    fetchDocs();
  }, []);

  const handleNext = () => {
    if (currentStep === 0) {
      if (!formData.name) { toast.error('Please name this share link'); return; }
      if (formData.documentIds.length === 0) { toast.error('Please select at least one document'); return; }
    }
    if (currentStep < STEPS.length - 1) setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Parse expiry
    let expiresAt = null;
    if (formData.expiryType !== 'NEVER') {
      const now = new Date();
      if (formData.expiryType === '1H') now.setHours(now.getHours() + 1);
      if (formData.expiryType === '24H') now.setHours(now.getHours() + 24);
      if (formData.expiryType === '7D') now.setDate(now.getDate() + 7);
      expiresAt = now.toISOString();
    }

    // Parse downloads
    let maxDls = null;
    if (formData.maxDownloads !== 'UNLIMITED') {
      maxDls = parseInt(formData.maxDownloads);
    }

    const payload = {
      name: formData.name,
      targetType: formData.targetType,
      documentIds: formData.documentIds,
      password: formData.password || null,
      expiresAt: expiresAt,
      maxDownloads: maxDls,
      allowDownload: formData.allowDownload,
      allowPrint: formData.allowPrint,
      allowCopy: formData.allowCopy
    };

    try {
      const res = await shareService.createShare(payload);
      setFinalShareData(res.data);
      setCurrentStep(5); // Move to Finish step
      toast.success('Secure link generated successfully!');
    } catch (err) {
      toast.error('Failed to generate link');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8 px-4 sm:px-12 relative overflow-x-auto pb-4">
      <div className="absolute top-1/2 left-12 right-12 h-0.5 bg-gray-100 -z-10 -translate-y-1/2 min-w-max" />
      <div 
        className="absolute top-1/2 left-12 h-0.5 bg-primary -z-10 -translate-y-1/2 transition-all duration-300"
        style={{ width: `calc(${(currentStep / (STEPS.length - 1)) * 100}% - 3rem)` }}
      />
      {STEPS.map((step, idx) => (
        <div key={step} className="flex flex-col items-center gap-2 min-w-[60px]">
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-colors border-2
            ${currentStep > idx ? 'bg-primary border-primary text-white' : 
              currentStep === idx ? 'bg-white border-primary text-primary shadow-[0_0_0_4px_rgba(37,99,235,0.1)]' : 
              'bg-white border-gray-200 text-gray-400'}`}
          >
            {currentStep > idx ? <Check className="w-4 h-4" /> : idx + 1}
          </div>
          <span className={`text-[10px] sm:text-xs font-medium ${currentStep >= idx ? 'text-gray-800' : 'text-gray-400'}`}>
            {step}
          </span>
        </div>
      ))}
    </div>
  );

  const renderStep1Content = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Link Name</label>
        <input 
          type="text" 
          value={formData.name}
          onChange={e => setFormData({...formData, name: e.target.value})}
          placeholder="e.g. Q3 Financials for Auditors"
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-primary outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-3">Select Documents from Vault</label>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 h-[300px] overflow-y-auto space-y-2 shadow-sm">
          {vaultDocs.map(doc => (
            <div 
              key={doc.id}
              onClick={() => {
                const selected = formData.documentIds.includes(doc.id);
                setFormData({
                  ...formData,
                  documentIds: selected ? formData.documentIds.filter(id => id !== doc.id) : [...formData.documentIds, doc.id]
                });
              }}
              className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                formData.documentIds.includes(doc.id) 
                  ? 'bg-primary/5 border-primary shadow-[0_0_0_1px_rgba(37,99,235,1)]' 
                  : 'bg-white border-gray-100 hover:border-primary/30 hover:bg-gray-50'
              }`}
            >
              <FileText className={`w-5 h-5 ${formData.documentIds.includes(doc.id) ? 'text-primary' : 'text-gray-400'}`} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">{doc.displayName}</p>
                <p className="text-xs text-gray-500">{(doc.fileSize/1024/1024).toFixed(2)} MB</p>
              </div>
              {formData.documentIds.includes(doc.id) && <Check className="w-5 h-5 text-primary" />}
            </div>
          ))}
          {vaultDocs.length === 0 && <p className="text-center text-gray-500 mt-10">No documents found in vault.</p>}
        </div>
      </div>
    </div>
  );

  const renderStep2Permissions = () => (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-bold text-gray-800">Allow Downloading</h4>
            <p className="text-sm text-gray-500 mt-1">Recipients can download a copy (single file or ZIP).</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={formData.allowDownload} onChange={e => setFormData({...formData, allowDownload: e.target.checked})} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
        
        <hr className="border-gray-100" />
        
        <div className="flex items-start justify-between opacity-50 cursor-not-allowed">
          <div>
            <h4 className="font-bold text-gray-800">Allow Printing (PDF only)</h4>
            <p className="text-sm text-gray-500 mt-1">Coming soon. Viewer applies DRM flags.</p>
          </div>
          <label className="relative inline-flex items-center cursor-not-allowed">
            <input type="checkbox" disabled checked={formData.allowPrint} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderStep3Security = () => (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Password Protection</h3>
        <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
          Require a password before anyone can view or download the contents of this link.
        </p>
        
        <input 
          type="password" 
          placeholder="Enter a strong password (optional)"
          value={formData.password}
          onChange={e => setFormData({...formData, password: e.target.value})}
          className="w-full max-w-md mx-auto block px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary outline-none text-center font-medium"
        />
        {formData.password && (
          <p className="text-success text-xs font-bold mt-3">Password protection is ENABLED</p>
        )}
      </div>
    </div>
  );

  const renderStep4Limits = () => (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-4"><Clock className="w-5 h-5"/> Expiration Date</h4>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: '1H', label: '1 Hour' },
            { id: '24H', label: '24 Hours' },
            { id: '7D', label: '7 Days' },
            { id: 'NEVER', label: 'Never Expires' }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setFormData({...formData, expiryType: opt.id})}
              className={`p-3 rounded-xl border font-semibold text-sm ${formData.expiryType === opt.id ? 'bg-primary/10 border-primary text-primary' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-primary/30'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-4"><Download className="w-5 h-5"/> Max Downloads</h4>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: '1', label: '1 Download' },
            { id: '5', label: '5 Downloads' },
            { id: '10', label: '10 Downloads' },
            { id: 'UNLIMITED', label: 'Unlimited' }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setFormData({...formData, maxDownloads: opt.id})}
              className={`p-3 rounded-xl border font-semibold text-sm ${formData.maxDownloads === opt.id ? 'bg-primary/10 border-primary text-primary' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-primary/30'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep5Review = () => (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">Review Share Settings</h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-gray-500 font-medium">Link Name</span>
            <span className="font-bold text-gray-800">{formData.name}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-gray-500 font-medium">Documents</span>
            <span className="font-bold text-primary">{formData.documentIds.length} files selected</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-gray-500 font-medium">Security</span>
            <span className="font-bold text-gray-800">{formData.password ? 'Password Protected' : 'Public (Anyone with link)'}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-gray-500 font-medium">Expiry</span>
            <span className="font-bold text-gray-800">{formData.expiryType}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-gray-500 font-medium">Downloads</span>
            <span className="font-bold text-gray-800">{formData.allowDownload ? `Allowed (${formData.maxDownloads})` : 'Disabled (View Only)'}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep6Finish = () => {
    if (!finalShareData) return null;
    const url = `${window.location.origin}/share/${finalShareData.token}`;

    return (
      <div className="max-w-xl mx-auto text-center space-y-6 animate-in zoom-in duration-300">
        <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800">Your Link is Ready!</h3>
        <p className="text-gray-500 mb-8 max-w-sm mx-auto">Share this link or QR code with your recipients. They do not need a VaultX account to access it.</p>
        
        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 flex items-center gap-3">
          <Globe className="w-5 h-5 text-gray-400" />
          <input type="text" readOnly value={url} className="bg-transparent flex-1 outline-none text-gray-600 font-medium truncate" />
          <button 
            onClick={() => {
              navigator.clipboard.writeText(url);
              toast.success('Copied!');
            }}
            className="p-2 bg-white rounded-lg border border-gray-200 text-gray-600 hover:text-primary hover:border-primary/50 shadow-sm transition-colors"
          >
            <Copy className="w-5 h-5" />
          </button>
        </div>

        <div className="flex justify-center mt-8 p-6 bg-white border border-gray-100 rounded-2xl shadow-sm inline-block mx-auto">
          <QRCodeSVG value={url} size={150} level="H" includeMargin />
          <p className="text-xs text-gray-500 font-bold mt-4 flex items-center justify-center gap-1">
            <QrCode className="w-3 h-3" /> SCAN ME
          </p>
        </div>

        <div className="pt-8">
          <button onClick={() => navigate('/dashboard/shares')} className="btn-primary px-8 py-3 rounded-xl shadow-md font-bold">
            Done, Return to Dashboard
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col pb-8">
      
      <div className="flex items-center gap-4 mb-6">
        {currentStep < 5 && (
          <button onClick={() => navigate('/dashboard/shares')} className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors shadow-sm">
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="page-title">Generate Share Link</h1>
          <p className="page-subtitle mt-0.5">Securely distribute your documents outside of VaultX.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden">
        
        {currentStep < 5 && (
          <div className="pt-8 pb-4">
            {renderStepIndicator()}
          </div>
        )}

        <div className={`flex-1 overflow-y-auto p-4 sm:p-8 ${currentStep === 5 ? 'bg-white flex items-center justify-center' : 'bg-gray-50/50'}`}>
          {currentStep === 0 && renderStep1Content()}
          {currentStep === 1 && renderStep2Permissions()}
          {currentStep === 2 && renderStep3Security()}
          {currentStep === 3 && renderStep4Limits()}
          {currentStep === 4 && renderStep5Review()}
          {currentStep === 5 && renderStep6Finish()}
        </div>

        {currentStep < 5 && (
          <div className="p-6 bg-white border-t border-gray-100 flex items-center justify-between">
            <button 
              onClick={handleBack}
              disabled={currentStep === 0}
              className="px-6 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-0"
            >
              Back
            </button>
            
            {currentStep < 4 ? (
              <button 
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium bg-primary text-white hover:bg-primary-dark transition-colors shadow-sm"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold bg-success text-white hover:bg-success/90 transition-colors shadow-md disabled:opacity-70"
              >
                {isSubmitting ? 'Generating...' : 'Generate Secure Link'}
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
