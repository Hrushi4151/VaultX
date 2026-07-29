import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Check, ArrowRight, Shield, Globe, Phone, CheckCircle2, Send, KeyRound, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const STEPS = [
  { id: 1, title: 'Personal Info' },
  { id: 2, title: 'Account Details & OTP' },
  { id: 3, title: 'Security' }
];

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Step 2 Dual OTP States
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpInput, setEmailOtpInput] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false);

  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [mobileOtpInput, setMobileOtpInput] = useState('');
  const [isMobileVerified, setIsMobileVerified] = useState(false);
  const [sendingMobileOtp, setSendingMobileOtp] = useState(false);
  const [verifyingMobileOtp, setVerifyingMobileOtp] = useState(false);

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      country: '',
      termsAccepted: false,
    },
  });

  const password = watch('password');
  const email = watch('email');
  const phoneNumber = watch('phoneNumber');

  const passwordStrength = {
    length: password?.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  };
  const isPasswordStrong = Object.values(passwordStrength).every(Boolean);

  // Send Email OTP
  const handleSendEmailOtp = async () => {
    const isEmailValid = await trigger('email');
    if (!isEmailValid || !email) {
      toast.error('Please enter a valid email address first.');
      return;
    }

    setSendingEmailOtp(true);
    try {
      const res = await authService.sendEmailOtp(email);
      setEmailOtpSent(true);
      const generatedOtp = res?.data?.otp || res?.otp;
      if (generatedOtp) {
        setEmailOtpInput(generatedOtp);
        toast.success(`Email OTP Code: ${generatedOtp}`, { duration: 8000, icon: '🔑' });
      } else {
        toast.success(`OTP verification code sent to email: ${email}`, { duration: 6000 });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send Email OTP.');
    } finally {
      setSendingEmailOtp(false);
    }
  };

  // Verify Email OTP
  const handleVerifyEmailOtp = async () => {
    if (!emailOtpInput || emailOtpInput.trim().length !== 6) {
      toast.error('Please enter the 6-digit Email OTP');
      return;
    }

    setVerifyingEmailOtp(true);
    try {
      await authService.verifyEmailOtp(email, emailOtpInput.trim());
      setIsEmailVerified(true);
      toast.success('Email verified successfully! ✓', { duration: 5000 });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid Email OTP code.');
    } finally {
      setVerifyingEmailOtp(false);
    }
  };

  // Send Mobile OTP
  const handleSendMobileOtp = async () => {
    const isPhoneValid = await trigger('phoneNumber');
    if (!isPhoneValid || !phoneNumber) {
      toast.error('Please enter a valid phone number first.');
      return;
    }

    setSendingMobileOtp(true);
    try {
      const res = await authService.sendMobileOtp(phoneNumber);
      setMobileOtpSent(true);
      const generatedOtp = res?.data?.otp || res?.otp;
      if (generatedOtp) {
        setMobileOtpInput(generatedOtp);
        toast.success(`Mobile SMS OTP Code: ${generatedOtp}`, { duration: 8000, icon: '📲' });
      } else {
        toast.success(`SMS OTP code sent to phone: ${phoneNumber}`, { duration: 6000 });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send Mobile OTP.');
    } finally {
      setSendingMobileOtp(false);
    }
  };

  // Verify Mobile OTP
  const handleVerifyMobileOtp = async () => {
    if (!mobileOtpInput || mobileOtpInput.trim().length !== 6) {
      toast.error('Please enter the 6-digit Mobile OTP');
      return;
    }

    setVerifyingMobileOtp(true);
    try {
      await authService.verifyMobileOtp(phoneNumber, mobileOtpInput.trim());
      setIsMobileVerified(true);
      toast.success('Mobile phone verified successfully! ✓', { duration: 5000 });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid Mobile OTP code.');
    } finally {
      setVerifyingMobileOtp(false);
    }
  };

  const nextStep = async () => {
    let fieldsToValidate = [];
    if (currentStep === 1) {
      fieldsToValidate = ['firstName', 'lastName', 'country'];
      const isStepValid = await trigger(fieldsToValidate);
      if (isStepValid) setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      fieldsToValidate = ['email', 'username', 'phoneNumber'];
      const isStepValid = await trigger(fieldsToValidate);
      if (!isStepValid) return;

      if (!isEmailVerified || !isMobileVerified) {
        toast.error('Please verify both your Email and Mobile Phone via OTP to proceed.');
        return;
      }

      setCurrentStep(3);
    }
  };

  const prevStep = () => setCurrentStep(prev => prev - 1);

  // Final Registration onSubmit (Creates DB Record)
  const onSubmit = async (data) => {
    if (!isEmailVerified || !isMobileVerified) {
      toast.error('Please verify both Email and Mobile phone numbers.');
      return;
    }

    if (!isPasswordStrong) {
      toast.error('Password does not meet requirements');
      return;
    }

    setIsLoading(true);
    try {
      await authService.register(data);
      toast.success('Registration successful! Account created and verified.', { duration: 6000 });
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      
      <div className="w-full max-w-2xl relative z-10">
        <div className="text-center mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-white font-bold text-xl mb-4 shadow-lg shadow-primary/30"
          >
            V
          </Link>
          <h2 className="text-3xl font-bold text-slate-800">Create your Enterprise Vault</h2>
          <p className="text-slate-500 mt-2">Secure document management starts here</p>
        </div>

        <div className="glass rounded-3xl p-8 md:p-12 shadow-2xl border border-white/60">
          
          {/* Progress Indicator */}
          <div className="mb-10 relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -translate-y-1/2 rounded-full z-0"></div>
            <div 
              className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 rounded-full z-0 transition-all duration-500"
              style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
            ></div>
            <div className="relative z-10 flex justify-between">
              {STEPS.map((step) => (
                <div key={step.id} className="flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-colors duration-300 ${
                    currentStep >= step.id ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {currentStep > step.id ? <Check size={16} /> : step.id}
                  </div>
                  <span className={`text-xs font-medium hidden md:block ${currentStep >= step.id ? 'text-primary' : 'text-slate-400'}`}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            
            {/* STEP 1: Personal Info */}
            <div className={`space-y-6 transition-all duration-500 ${currentStep === 1 ? 'block opacity-100' : 'hidden opacity-0'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="First Name"
                  placeholder="Jane"
                  icon={User}
                  error={errors.firstName?.message}
                  {...register('firstName', { required: 'First name is required' })}
                />
                <Input
                  label="Last Name"
                  placeholder="Doe"
                  icon={User}
                  error={errors.lastName?.message}
                  {...register('lastName', { required: 'Last name is required' })}
                />
              </div>
              <Input
                label="Country"
                placeholder="India"
                icon={Globe}
                error={errors.country?.message}
                {...register('country', { required: 'Country is required' })}
              />
              <div className="pt-4 flex justify-end">
                <Button type="button" onClick={nextStep} icon={ArrowRight}>Continue</Button>
              </div>
            </div>

            {/* STEP 2: Account Details & OTP Verification */}
            <div className={`space-y-6 transition-all duration-500 ${currentStep === 2 ? 'block opacity-100' : 'hidden opacity-0'}`}>
              
              {/* EMAIL SECTION */}
              <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <Mail size={18} className="text-primary" />
                    Email Address
                  </label>
                  {isEmailVerified && (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                      <CheckCircle2 size={15} className="text-emerald-600" />
                      Email Verified ✓
                    </span>
                  )}
                </div>

                <Input
                  type="email"
                  placeholder="hrushimore4151@gmail.com"
                  disabled={isEmailVerified}
                  error={errors.email?.message}
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                />

                {/* EMAIL OTP CONTROLS */}
                {!isEmailVerified && (
                  <div className="space-y-3 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSendEmailOtp}
                      isLoading={sendingEmailOtp}
                      disabled={sendingEmailOtp || !email}
                      className="w-full sm:w-auto text-xs py-2 px-4 border-primary text-primary hover:bg-primary/5 flex items-center justify-center gap-2"
                    >
                      <Send size={14} />
                      {emailOtpSent ? 'Resend Email OTP' : 'Send Email OTP'}
                    </Button>

                    {emailOtpSent && (
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 flex flex-col sm:flex-row items-center gap-3 animate-fadeIn">
                        <Input
                          placeholder="Enter 6-digit Email OTP"
                          value={emailOtpInput}
                          onChange={(e) => setEmailOtpInput(e.target.value)}
                          maxLength={6}
                          icon={KeyRound}
                          className="text-center font-mono tracking-widest bg-white"
                        />
                        <Button
                          type="button"
                          onClick={handleVerifyEmailOtp}
                          isLoading={verifyingEmailOtp}
                          className="w-full sm:w-auto text-xs py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white whitespace-nowrap shadow-md"
                        >
                          Verify Email OTP
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* PHONE NUMBER SECTION */}
              <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <Phone size={18} className="text-primary" />
                    Phone Number (SMS OTP)
                  </label>
                  {isMobileVerified && (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                      <CheckCircle2 size={15} className="text-emerald-600" />
                      Mobile Verified ✓
                    </span>
                  )}
                </div>

                <Input
                  type="tel"
                  placeholder="+919096510103"
                  disabled={isMobileVerified}
                  error={errors.phoneNumber?.message}
                  {...register('phoneNumber', { 
                    required: 'Phone number is required',
                    pattern: {
                      value: /^\+?[1-9]\d{1,14}$/,
                      message: 'Invalid phone number format (e.g., +919096510103)'
                    }
                  })}
                />

                {/* MOBILE OTP CONTROLS */}
                {!isMobileVerified && (
                  <div className="space-y-3 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSendMobileOtp}
                      isLoading={sendingMobileOtp}
                      disabled={sendingMobileOtp || !phoneNumber}
                      className="w-full sm:w-auto text-xs py-2 px-4 border-primary text-primary hover:bg-primary/5 flex items-center justify-center gap-2"
                    >
                      <Send size={14} />
                      {mobileOtpSent ? 'Resend Mobile SMS OTP' : 'Send Mobile SMS OTP'}
                    </Button>

                    {mobileOtpSent && (
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 flex flex-col sm:flex-row items-center gap-3 animate-fadeIn">
                        <Input
                          placeholder="Enter 6-digit Mobile OTP"
                          value={mobileOtpInput}
                          onChange={(e) => setMobileOtpInput(e.target.value)}
                          maxLength={6}
                          icon={KeyRound}
                          className="text-center font-mono tracking-widest bg-white"
                        />
                        <Button
                          type="button"
                          onClick={handleVerifyMobileOtp}
                          isLoading={verifyingMobileOtp}
                          className="w-full sm:w-auto text-xs py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white whitespace-nowrap shadow-md"
                        >
                          Verify Mobile OTP
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* USERNAME FIELD */}
              <Input
                label="Username (Optional)"
                placeholder="sai1234"
                icon={User}
                error={errors.username?.message}
                {...register('username', {
                  pattern: {
                    value: /^[a-zA-Z0-9_]{3,20}$/,
                    message: 'Username must be 3-20 characters, alphanumeric and underscore only'
                  }
                })}
              />

              {/* VERIFICATION SUMMARY NOTICE */}
              {(!isEmailVerified || !isMobileVerified) && (
                <div className="text-xs text-amber-800 bg-amber-50 p-3.5 rounded-xl border border-amber-200/80 flex items-center gap-2.5 shadow-sm">
                  <Shield size={18} className="text-amber-600 flex-shrink-0" />
                  <span>Verify both <strong>Email OTP</strong> and <strong>Mobile SMS OTP</strong> above to unlock the <strong>Continue</strong> button.</span>
                </div>
              )}

              <div className="pt-4 flex justify-between">
                <Button type="button" variant="outline" onClick={prevStep}>Back</Button>
                <Button 
                  type="button" 
                  onClick={nextStep} 
                  icon={ArrowRight} 
                  disabled={!isEmailVerified || !isMobileVerified}
                  className={isEmailVerified && isMobileVerified ? 'bg-primary shadow-lg shadow-primary/25' : 'opacity-50 cursor-not-allowed bg-slate-400'}
                >
                  Continue
                </Button>
              </div>
            </div>

            {/* STEP 3: Security */}
            <div className={`space-y-6 transition-all duration-500 ${currentStep === 3 ? 'block opacity-100' : 'hidden opacity-0'}`}>
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                icon={Lock}
                error={errors.password?.message}
                rightElement={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-600 focus:outline-none p-1">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
                {...register('password', { required: 'Password is required' })}
              />

              {/* Password Strength Indicator */}
              {password && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
                  <p className="font-medium text-slate-700 mb-2 flex items-center gap-2"><Shield size={16} className="text-primary"/> Password Requirements:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className={`flex items-center gap-2 ${passwordStrength.length ? 'text-green-600' : 'text-slate-500'}`}>
                      <Check size={14} className={passwordStrength.length ? 'opacity-100' : 'opacity-30'} /> Minimum 8 characters
                    </div>
                    <div className={`flex items-center gap-2 ${passwordStrength.upper ? 'text-green-600' : 'text-slate-500'}`}>
                      <Check size={14} className={passwordStrength.upper ? 'opacity-100' : 'opacity-30'} /> Uppercase letter
                    </div>
                    <div className={`flex items-center gap-2 ${passwordStrength.lower ? 'text-green-600' : 'text-slate-500'}`}>
                      <Check size={14} className={passwordStrength.lower ? 'opacity-100' : 'opacity-30'} /> Lowercase letter
                    </div>
                    <div className={`flex items-center gap-2 ${passwordStrength.number ? 'text-green-600' : 'text-slate-500'}`}>
                      <Check size={14} className={passwordStrength.number ? 'opacity-100' : 'opacity-30'} /> Number
                    </div>
                    <div className={`flex items-center gap-2 ${passwordStrength.special ? 'text-green-600' : 'text-slate-500'}`}>
                      <Check size={14} className={passwordStrength.special ? 'opacity-100' : 'opacity-30'} /> Special character
                    </div>
                  </div>
                </div>
              )}

              <Input
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                icon={Lock}
                error={errors.confirmPassword?.message}
                rightElement={
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-slate-400 hover:text-slate-600 focus:outline-none p-1">
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
                {...register('confirmPassword', { 
                  required: 'Please confirm your password',
                  validate: val => {
                    if (watch('password') != val) {
                      return "Passwords do not match";
                    }
                  }
                })}
              />

              <label className="flex items-start cursor-pointer group mt-4">
                <div className="relative flex items-center mt-0.5">
                  <input
                    type="checkbox"
                    className="sr-only"
                    {...register('termsAccepted', { required: 'You must accept the terms and conditions' })}
                  />
                  <div className={`w-5 h-5 border-2 rounded transition-colors flex items-center justify-center 
                    ${errors.termsAccepted ? 'border-red-500' : 'border-slate-300 bg-white group-hover:border-primary'} 
                    group-has-[:checked]:bg-primary group-has-[:checked]:border-primary`}>
                    <svg className="w-3.5 h-3.5 text-white hidden group-has-[:checked]:block" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <span className={`ml-3 text-sm ${errors.termsAccepted ? 'text-red-500' : 'text-slate-600 group-hover:text-slate-800'}`}>
                  I agree to the VaultX Terms of Service and Privacy Policy. I understand that my documents are encrypted and managed securely.
                </span>
              </label>

              <div className="pt-6 flex justify-between">
                <Button type="button" variant="outline" onClick={prevStep}>Back</Button>
                <Button type="submit" isLoading={isLoading} className="shadow-lg shadow-primary/25 bg-emerald-600 hover:bg-emerald-700">
                  Create Verified Account
                </Button>
              </div>
            </div>
          </form>
          
          <div className="mt-8 text-center text-sm text-slate-500 border-t border-slate-100 pt-6">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:text-blue-700 transition-colors">
              Sign in to your Vault
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
