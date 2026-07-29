import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import Button from '../../components/ui/Button';

export default function CreatePinPage() {
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const handlePinChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const prevInput = document.getElementById(`pin-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullPin = pin.join('');
    if (fullPin.length !== 6) {
      toast.error('Please enter a 6-digit PIN');
      return;
    }

    setIsLoading(true);
    try {
      await userService.createVaultPin(fullPin);
      
      // Update local user context to reflect PIN creation
      updateUser({ ...user, hasVaultPin: true });
      
      toast.success('Vault PIN created successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create PIN');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md relative z-10 glass rounded-3xl p-8 shadow-xl border border-white/50 text-center">
        
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Shield size={32} />
        </div>
        
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Create Vault PIN</h2>
        <p className="text-slate-500 text-sm mb-8">
          Protect your most sensitive documents with a secure 6-digit PIN. You will need this PIN to view encrypted files.
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex justify-between gap-2 max-w-xs mx-auto">
            {pin.map((digit, index) => (
              <input
                key={index}
                id={`pin-${index}`}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handlePinChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-bold rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                autoComplete="off"
              />
            ))}
          </div>

          <div className="bg-slate-50 rounded-xl p-4 text-left text-sm text-slate-600 border border-slate-100 flex items-start gap-3">
             <Lock className="text-primary shrink-0 mt-0.5" size={16} />
             <p>This PIN is encrypted and never stored in plain text. Make sure to remember it.</p>
          </div>

          <Button 
            type="submit" 
            className="w-full shadow-lg shadow-primary/25 h-12"
            isLoading={isLoading}
            disabled={pin.join('').length !== 6}
            icon={Check}
          >
            Save PIN & Continue
          </Button>
        </form>
      </div>
    </div>
  );
}
