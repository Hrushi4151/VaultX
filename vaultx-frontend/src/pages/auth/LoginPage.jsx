import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data) => {
    try {
      await login(data.email, data.password, data.rememberMe);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left side — Illustration */}
      <div className="hidden lg:flex w-1/2 bg-primary relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 z-0 opacity-20">
          <svg className="absolute w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>
        
        <div className="z-10 mt-12">
          <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
            Secure Digital Document <br /> Management Platform
          </h1>
          <p className="text-blue-100 text-lg max-w-md">
            Enterprise-grade security meets modern simplicity. Access your documents from anywhere with peace of mind.
          </p>
        </div>

        {/* Abstract Illustration Placeholder */}
        <div className="z-10 relative h-96 w-full max-w-lg mx-auto">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute inset-0 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl flex items-center justify-center overflow-hidden transform hover:scale-[1.02] transition-transform duration-500">
             <div className="grid grid-cols-2 gap-4 p-8 w-full">
                <div className="h-24 bg-white/20 rounded-xl animate-pulse" style={{ animationDelay: '0ms' }}></div>
                <div className="h-24 bg-white/20 rounded-xl animate-pulse" style={{ animationDelay: '150ms' }}></div>
                <div className="h-32 bg-white/20 rounded-xl animate-pulse col-span-2" style={{ animationDelay: '300ms' }}></div>
             </div>
          </div>
        </div>

        <div className="z-10 flex items-center gap-4 text-blue-200 text-sm font-medium">
          <div className="flex -space-x-3">
             <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-primary flex items-center justify-center text-xs">JD</div>
             <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-primary flex items-center justify-center text-xs">AS</div>
             <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-primary flex items-center justify-center text-xs">MK</div>
          </div>
          <p>Trusted by 10,000+ enterprises</p>
        </div>
      </div>

      {/* Right side — Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 relative">
        {/* Mobile background blob */}
        <div className="lg:hidden absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl"></div>
        
        <div className="w-full max-w-md relative z-10 glass rounded-2xl p-8 shadow-xl border border-white/50">
          <div className="mb-10 text-center">
            <Link 
              to="/" 
              className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-white font-bold text-xl mb-6 shadow-lg shadow-primary/30 hover:-translate-y-1 transition-transform"
            >
              V
            </Link>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Welcome back</h2>
            <p className="text-slate-500">Enter your credentials to access your vault</p>
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

            <div className="space-y-1">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                icon={Lock}
                error={errors.password?.message}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 focus:outline-none p-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
                {...register('password', { required: 'Password is required' })}
              />
              
              <div className="flex items-center justify-between mt-2">
                <label className="flex items-center cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      className="sr-only"
                      {...register('rememberMe')}
                    />
                    <div className="w-4 h-4 border-2 border-slate-300 rounded bg-white group-hover:border-primary transition-colors flex items-center justify-center peer-checked:bg-primary peer-checked:border-primary">
                      <svg className="w-3 h-3 text-white hidden group-has-[:checked]:block" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <span className="ml-2 text-sm text-slate-600 group-hover:text-slate-800 transition-colors">
                    Remember me
                  </span>
                </label>
                
                <Link 
                  to="/forgot-password" 
                  className="text-sm font-medium text-primary hover:text-blue-700 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-lg shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
              isLoading={isLoading}
              icon={ArrowRight}
            >
              Sign in to VaultX
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary hover:text-blue-700 transition-colors">
              Create an enterprise account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
