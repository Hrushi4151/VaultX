import { useState, useEffect } from 'react';
import { Monitor, Smartphone, Globe, Clock, Trash2, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import userService from '../../services/userService';
import DashboardLayout from '../../layouts/DashboardLayout';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await userService.getSessions();
      setSessions(response.data);
    } catch (error) {
      toast.error('Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const terminateSession = async (id) => {
    try {
      await userService.terminateSession(id);
      toast.success('Session terminated');
      setSessions(sessions.filter(s => s.id !== id));
    } catch (error) {
      toast.error('Failed to terminate session');
    }
  };

  const getDeviceIcon = (os) => {
    if (os?.toLowerCase().includes('windows') || os?.toLowerCase().includes('mac')) return <Monitor size={20} className="text-slate-400" />;
    if (os?.toLowerCase().includes('ios') || os?.toLowerCase().includes('android')) return <Smartphone size={20} className="text-slate-400" />;
    return <Globe size={20} className="text-slate-400" />;
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Active Sessions</h1>
          <p className="text-slate-500 mt-1">Manage and revoke your active sessions across devices.</p>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex gap-3 text-orange-800">
          <ShieldAlert className="shrink-0 mt-0.5" size={20} />
          <div className="text-sm">
            <p className="font-semibold mb-1">Security Recommendation</p>
            <p>If you notice any suspicious activity or devices you don't recognize, terminate the session immediately and change your password.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-xl"></div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className={`glass rounded-xl p-5 border flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between transition-all ${session.currentSession ? 'border-primary shadow-md' : 'border-slate-200'}`}>
                
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${session.currentSession ? 'bg-blue-100' : 'bg-slate-100'}`}>
                    {getDeviceIcon(session.operatingSystem)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-800">{session.operatingSystem || 'Unknown OS'}</h3>
                      {session.currentSession && <Badge variant="primary" className="text-xs py-0.5">Current Session</Badge>}
                    </div>
                    <div className="text-sm text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="flex items-center gap-1"><Globe size={14}/> {session.browser || 'Unknown Browser'}</span>
                      <span className="flex items-center gap-1"><MapPinIcon size={14}/> {session.ipAddress}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                      <Clock size={12}/> Last active: {new Date(session.lastActiveTime).toLocaleString()}
                    </div>
                  </div>
                </div>

                {!session.currentSession && (
                  <Button 
                    variant="outline" 
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 w-full sm:w-auto"
                    onClick={() => terminateSession(session.id)}
                    icon={Trash2}
                  >
                    Terminate
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function MapPinIcon({size, className}) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  );
}
