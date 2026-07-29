import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: '' }
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await authService.forgotPassword(data.email);
      setIsSuccess(true);
      toast.success('Reset link sent if the email exists.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md relative z-10 glass rounded-3xl p-8 shadow-xl border border-white/50">
        <Link to="/login" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-primary transition-colors mb-6">
          <ArrowLeft size={16} className="mr-2" /> Back to Login
        </Link>

        {!isSuccess ? (
          <>
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Forgot Password</h2>
              <p className="text-slate-500 text-sm">Enter your email address and we'll send you a link to reset your password.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Input
                label="Email address"
                type="email"
                placeholder="you@company.com"
                icon={Mail}
                error={errors.email?.message}
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
              />

              <Button 
                type="submit" 
                className="w-full h-12 shadow-lg shadow-primary/25"
                isLoading={isLoading}
                icon={ArrowRight}
              >
                Send Reset Link
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-blue-100 text-primary rounded-full flex items-center justify-center mb-6 mx-auto">
              <Mail size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Check your email</h2>
            <p className="text-slate-500 mb-8 text-sm">We've sent a password reset link to your email address if it exists in our system. The link will expire in 15 minutes.</p>
          </div>
        )}
      </div>
    </div>
  );
}
