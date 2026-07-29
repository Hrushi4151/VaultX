import { Settings, Save, Server, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  
  const handleSave = (e) => {
    e.preventDefault();
    toast.success('System settings updated securely');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-8">
      
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2"><Settings className="w-6 h-6 text-primary"/> System Configuration</h1>
        <p className="text-sm text-gray-500 mt-1">Manage global enterprise settings</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Core Settings */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4"><Server className="w-5 h-5"/> Platform Configuration</h2>
          
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Application Name</label>
              <input type="text" defaultValue="VaultX Enterprise" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Support Email</label>
              <input type="email" defaultValue="admin@vaultx.com" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Default Storage Quota (GB)</label>
              <input type="number" defaultValue="5" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Maximum Upload Size (MB)</label>
              <input type="number" defaultValue="100" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary outline-none" />
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4"><Shield className="w-5 h-5 text-amber-500"/> Enterprise Security</h2>
          
          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer">
              <div>
                <span className="block font-bold text-gray-800">Enable Maintenance Mode</span>
                <span className="text-xs text-gray-500">Locks out all non-admin users from the platform.</span>
              </div>
              <input type="checkbox" className="w-5 h-5 rounded text-primary" />
            </label>
            
            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer">
              <div>
                <span className="block font-bold text-gray-800">Allow New Registrations</span>
                <span className="text-xs text-gray-500">Let new users sign up via the public register page.</span>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-primary" />
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="flex items-center gap-2 px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/30">
            <Save className="w-5 h-5" /> Save Configuration
          </button>
        </div>

      </form>
    </div>
  );
}
