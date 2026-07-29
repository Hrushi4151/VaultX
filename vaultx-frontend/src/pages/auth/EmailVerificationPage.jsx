import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowRight, Loader } from 'lucide-react';
import { authService } from '../../services/authService';
import Button from '../../components/ui/Button';

export default function EmailVerificationPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('Verifying your email...');
  const verifyAttempted = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing verification link.');
      return;
    }

    if (verifyAttempted.current) return;
    verifyAttempted.current = true;

    const verifyToken = async () => {
      try {
        const response = await authService.verifyEmail(token);
        setStatus('success');
        setMessage(response.message || 'Email verified successfully! You can now access your VaultX account.');
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Verification failed. The link may have expired or is invalid.');
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md relative z-10 glass rounded-3xl p-8 shadow-xl border border-white/50 text-center">
        
        {status === 'loading' && (
          <div className="flex flex-col items-center py-8">
            <Loader className="w-16 h-16 text-primary animate-spin mb-6" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Verifying Email</h2>
            <p className="text-slate-500">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center py-8 animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
              <CheckCircle size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Email Verified!</h2>
            <p className="text-slate-500 mb-8">{message}</p>
            <Link to="/login" className="w-full">
              <Button className="w-full shadow-lg shadow-primary/25" icon={ArrowRight}>
                Continue to Login
              </Button>
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center py-8 animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
              <XCircle size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Verification Failed</h2>
            <p className="text-slate-500 mb-8">{message}</p>
            <Link to="/login" className="w-full">
              <Button variant="outline" className="w-full">
                Back to Login
              </Button>
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
