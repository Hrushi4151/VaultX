import { useState } from 'react';
import { Lock, Key, ShieldCheck, AlertCircle, X, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import userService from '../../services/userService';
import Button from '../ui/Button';

export default function VaultPinUnlockModal({ isOpen, onClose, onSuccess, title = "Confidential Document Locked" }) {
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setErrorMsg('');

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`pin-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const prevInput = document.getElementById(`pin-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const pinStr = pin.join('');
    if (pinStr.length < 6) {
      setErrorMsg('Please enter all 6 digits of your Vault PIN');
      return;
    }

    setIsVerifying(true);
    setErrorMsg('');
    try {
      await userService.verifyPin(pinStr);
      setIsSuccess(true);
      toast.success('Vault PIN Verified! Confidential Document Unlocked ✓');
      setTimeout(() => {
        setIsSuccess(false);
        setPin(['', '', '', '', '', '']);
        onSuccess();
        onClose();
      }, 700);
    } catch (err) {
      setErrorMsg('Incorrect 6-digit Vault PIN. Please try again.');
      toast.error('Invalid Vault PIN');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative space-y-6">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
        >
          <X size={18} />
        </button>

        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto shadow-inner">
            {isSuccess ? <CheckCircle2 size={32} className="text-emerald-500 animate-bounce" /> : <Lock size={32} />}
          </div>
          <h3 className="text-xl font-bold text-slate-800">{title}</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Enter your 6-digit Vault Document PIN to access confidential file contents.
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex justify-center gap-2 sm:gap-3">
            {pin.map((digit, idx) => (
              <input
                key={idx}
                id={`pin-input-${idx}`}
                type="password"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-2xl border-2 transition-all focus:outline-none ${
                  errorMsg 
                    ? 'border-red-400 bg-red-50 text-red-700 animate-shake' 
                    : digit 
                    ? 'border-purple-600 bg-purple-50/50 text-purple-900 shadow-sm' 
                    : 'border-slate-200 bg-slate-50 text-slate-800 focus:border-purple-600 focus:bg-white'
                }`}
              />
            ))}
          </div>

          {errorMsg && (
            <p className="text-xs font-semibold text-red-500 text-center flex items-center justify-center gap-1.5 animate-fadeIn">
              <AlertCircle size={14} /> {errorMsg}
            </p>
          )}

          <Button 
            type="submit" 
            isLoading={isVerifying} 
            icon={ShieldCheck} 
            className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/25"
          >
            Unlock Confidential Document
          </Button>
        </form>
      </div>
    </div>
  );
}
