import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Check, ArrowRight, Shield, Globe, Phone, CheckCircle2, Send, KeyRound, Camera, RefreshCw, Sparkles, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const STEPS = [
  { id: 1, title: 'Personal Info' },
  { id: 2, title: 'Verification' },
  { id: 3, title: 'Account Password' },
  { id: 4, title: 'Wallet & Face ID' }
];

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showWalletPassword, setShowWalletPassword] = useState(false);
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

  // Step 4 Webcam Face ID States
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedFace, setCapturedFace] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
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
      walletPassword: '',
      confirmWalletPassword: '',
      country: '',
      termsAccepted: false,
    },
  });

  const password = watch('password');
  const walletPassword = watch('walletPassword');
  const email = watch('email');
  const phoneNumber = watch('phoneNumber');

  // Password requirements calculation
  const passwordStrength = {
    length: (password || '').length >= 8,
    upper: /[A-Z]/.test(password || ''),
    lower: /[a-z]/.test(password || ''),
    number: /[0-9]/.test(password || ''),
    special: /[^A-Za-z0-9]/.test(password || '')
  };
  const isPasswordStrong = Object.values(passwordStrength).every(Boolean);

  // 60-Second Resend Cooldown Timers
  const [emailCooldown, setEmailCooldown] = useState(0);
  const [mobileCooldown, setMobileCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (emailCooldown > 0) {
      timer = setInterval(() => setEmailCooldown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [emailCooldown]);

  useEffect(() => {
    let timer;
    if (mobileCooldown > 0) {
      timer = setInterval(() => setMobileCooldown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [mobileCooldown]);

  // Send Email OTP
  const handleSendEmailOtp = async () => {
    if (emailCooldown > 0) return;
    const isEmailValid = await trigger('email');
    if (!isEmailValid || !email) {
      toast.error('Please enter a valid email address first.');
      return;
    }

    setSendingEmailOtp(true);
    try {
      await authService.sendEmailOtp(email);
      setEmailOtpSent(true);
      setEmailCooldown(60);
      toast.success(`OTP verification code sent to email: ${email}`);
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
      toast.success('Email verified successfully! ✓');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid Email OTP code.');
    } finally {
      setVerifyingEmailOtp(false);
    }
  };

  // Send Mobile OTP
  const handleSendMobileOtp = async () => {
    if (mobileCooldown > 0) return;
    const isPhoneValid = await trigger('phoneNumber');
    if (!isPhoneValid || !phoneNumber) {
      toast.error('Please enter a valid phone number first.');
      return;
    }

    setSendingMobileOtp(true);
    try {
      await authService.sendMobileOtp(phoneNumber);
      setMobileOtpSent(true);
      setMobileCooldown(60);
      toast.success(`SMS OTP code sent to phone: ${phoneNumber}`);
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
      toast.success('Mobile phone verified successfully! ✓');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid Mobile OTP code.');
    } finally {
      setVerifyingMobileOtp(false);
    }
  };

  // Webcam Camera Controls
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 400, facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      toast.error('Unable to access camera. Please check camera permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const captureFacePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      context.drawImage(videoRef.current, 0, 0, 320, 240);
      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
      setCapturedFace(dataUrl);
      stopCamera();
      toast.success('Face ID biometric captured successfully! ✓');
    }
  };

  const retakeFacePhoto = () => {
    setCapturedFace(null);
    startCamera();
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
      return;
    }

    if (currentStep === 3) {
      fieldsToValidate = ['password', 'confirmPassword', 'termsAccepted'];
      const isStepValid = await trigger(fieldsToValidate);
      if (!isStepValid) return;

      if (!isPasswordStrong) {
        toast.error('Please ensure your password meets all strength requirements.');
        return;
      }
      setCurrentStep(4);
      startCamera();
    }
  };

  const prevStep = () => {
    if (currentStep === 4) stopCamera();
    setCurrentStep(prev => prev - 1);
  };

    // Final Registration onSubmit
  const onSubmit = async (data) => {
    if (!isEmailVerified || !isMobileVerified) {
      toast.error('Please verify both Email and Mobile phone numbers.');
      return;
    }

    if (!isPasswordStrong) {
      toast.error('Password does not meet requirements');
      return;
    }

    const walletPass = (data.walletPassword && data.walletPassword.trim().length >= 4) 
      ? data.walletPassword.trim() 
      : data.password;

    setIsLoading(true);
    try {
      const payload = {
        ...data,
        walletPassword: walletPass,
        faceData: capturedFace || null,
      };
      await authService.register(payload);
      toast.success('Registration successful! Wallet & Face ID configured.', { duration: 6000 });
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
          <p className="text-slate-500 mt-2">Secure document management & biometric login</p>
        </div>

        <div className="glass rounded-3xl p-8 md:p-12 shadow-2xl border border-white/60">
          
          {/* Progress Indicator */}
          <div className="mb-10 relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -translate-y-1/2 rounded-full z-0"></div>
            <div 
              className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 rounded-full z-0 transition-all duration-500"
              style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
            ></div>

            <div className="flex justify-between relative z-10">
              {STEPS.map((step) => {
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;
                
                return (
                  <div key={step.id} className="flex flex-col items-center">
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                        isCompleted 
                          ? 'bg-primary text-white shadow-md shadow-primary/30' 
                          : isCurrent 
                            ? 'bg-primary text-white ring-4 ring-primary/20 shadow-lg shadow-primary/40' 
                            : 'bg-white text-slate-400 border-2 border-slate-200'
                      }`}
                    >
                      {isCompleted ? <Check size={18} /> : step.id}
                    </div>
                    <span className={`text-xs font-medium mt-2 hidden sm:block ${isCurrent ? 'text-primary font-bold' : 'text-slate-400'}`}>
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            
            {/* STEP 1: Personal Info */}
            <div className={`space-y-6 transition-all duration-500 ${currentStep === 1 ? 'block opacity-100' : 'hidden opacity-0'}`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  placeholder="John"
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
                label="Country / Region"
                placeholder="United States"
                icon={Globe}
                error={errors.country?.message}
                {...register('country', { required: 'Country is required' })}
              />

              <div className="pt-4 flex justify-end">
                <Button type="button" onClick={nextStep} icon={ArrowRight} className="bg-primary shadow-lg shadow-primary/25">
                  Continue
                </Button>
              </div>
            </div>

            {/* STEP 2: Contact Details & Dual OTP Verification */}
            <div className={`space-y-6 transition-all duration-500 ${currentStep === 2 ? 'block opacity-100' : 'hidden opacity-0'}`}>
              
              {/* EMAIL CARD */}
              <div className="p-5 rounded-2xl bg-white/80 border border-slate-200/80 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Mail size={16} className="text-primary" /> Email Address Verification
                  </label>
                  {isEmailVerified && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-300">
                      <CheckCircle2 size={14} /> Email Verified
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="john.doe@example.com"
                      type="email"
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
                  </div>
                  {!isEmailVerified && (
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={handleSendEmailOtp}
                      isLoading={sendingEmailOtp}
                      disabled={emailCooldown > 0}
                      icon={Send}
                      className="whitespace-nowrap h-[42px] border-primary text-primary hover:bg-primary/10 disabled:opacity-50"
                    >
                      {emailCooldown > 0 ? `Resend in ${emailCooldown}s` : (emailOtpSent ? 'Resend OTP' : 'Send Email OTP')}
                    </Button>
                  )}
                </div>

                {emailOtpSent && !isEmailVerified && (
                  <div className="flex gap-2 pt-2 animate-fadeIn">
                    <Input
                      placeholder="Enter 6-digit Email OTP"
                      value={emailOtpInput}
                      onChange={(e) => setEmailOtpInput(e.target.value)}
                      maxLength={6}
                      icon={KeyRound}
                    />
                    <Button
                      type="button"
                      onClick={handleVerifyEmailOtp}
                      isLoading={verifyingEmailOtp}
                      className="whitespace-nowrap h-[42px] bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Verify Email
                    </Button>
                  </div>
                )}
              </div>

              {/* MOBILE PHONE CARD */}
              <div className="p-5 rounded-2xl bg-white/80 border border-slate-200/80 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Phone size={16} className="text-primary" /> Mobile Phone SMS Verification
                  </label>
                  {isMobileVerified && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-300">
                      <CheckCircle2 size={14} /> Mobile Verified
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="+919096510103"
                      type="tel"
                      disabled={isMobileVerified}
                      error={errors.phoneNumber?.message}
                      {...register('phoneNumber', { 
                        required: 'Phone number is required',
                        pattern: {
                          value: /^\+?[1-9]\d{1,14}$/,
                          message: 'Invalid phone format (e.g. +919881894151)'
                        }
                      })}
                    />
                  </div>
                  {!isMobileVerified && (
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={handleSendMobileOtp}
                      isLoading={sendingMobileOtp}
                      disabled={mobileCooldown > 0}
                      icon={Send}
                      className="whitespace-nowrap h-[42px] border-primary text-primary hover:bg-primary/10 disabled:opacity-50"
                    >
                      {mobileCooldown > 0 ? `Resend in ${mobileCooldown}s` : (mobileOtpSent ? 'Resend SMS' : 'Send Mobile OTP')}
                    </Button>
                  )}
                </div>

                {mobileOtpSent && !isMobileVerified && (
                  <div className="flex gap-2 pt-2 animate-fadeIn">
                    <Input
                      placeholder="Enter 6-digit Mobile OTP"
                      value={mobileOtpInput}
                      onChange={(e) => setMobileOtpInput(e.target.value)}
                      maxLength={6}
                      icon={KeyRound}
                    />
                    <Button
                      type="button"
                      onClick={handleVerifyMobileOtp}
                      isLoading={verifyingMobileOtp}
                      className="whitespace-nowrap h-[42px] bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Verify Mobile
                    </Button>
                  </div>
                )}
              </div>

              {/* USERNAME */}
              <Input
                label="Username (Optional)"
                placeholder="johndoe"
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

            {/* STEP 3: Account Password */}
            <div className={`space-y-6 transition-all duration-500 ${currentStep === 3 ? 'block opacity-100' : 'hidden opacity-0'}`}>
              <Input
                label="Account Password"
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
                <Button type="button" onClick={nextStep} icon={ArrowRight} className="bg-primary shadow-lg shadow-primary/25">
                  Continue to Wallet & Face ID
                </Button>
              </div>
            </div>

            {/* STEP 4: Wallet Password & Face Capturing */}
            <div className={`space-y-6 transition-all duration-500 ${currentStep === 4 ? 'block opacity-100' : 'hidden opacity-0'}`}>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3 text-blue-900 text-sm">
                <Sparkles className="text-primary flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-semibold">Fast Biometric & Wallet Authentication</p>
                  <p className="text-blue-700 text-xs mt-0.5">
                    Set up your Wallet Password and capture your Face ID to enable instant passwordless logins without entering email or phone numbers!
                  </p>
                </div>
              </div>

              {/* WALLET PASSWORD SECTION */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Wallet size={18} className="text-primary" /> Wallet Security Password
                </h3>
                
                <Input
                  label="Wallet Password / Security PIN"
                  type={showWalletPassword ? 'text' : 'password'}
                  placeholder="Enter wallet password (e.g. VaultPass99)"
                  icon={Lock}
                  error={errors.walletPassword?.message}
                  rightElement={
                    <button type="button" onClick={() => setShowWalletPassword(!showWalletPassword)} className="text-slate-400 hover:text-slate-600 focus:outline-none p-1">
                      {showWalletPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                  {...register('walletPassword', { 
                    required: 'Wallet password is required for fast login',
                    minLength: { value: 4, message: 'Wallet password must be at least 4 characters' }
                  })}
                />
              </div>

              {/* FACE ID CAPTURE SECTION */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 text-center">
                <h3 className="font-semibold text-slate-800 flex items-center justify-center gap-2">
                  <Camera size={18} className="text-primary" /> Face ID Biometric Enrolment
                </h3>

                <div className="relative w-full max-w-sm mx-auto h-56 bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-slate-300 shadow-inner">
                  {capturedFace ? (
                    <img src={capturedFace} alt="Captured Face Biometric" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                      />
                      {!cameraActive && (
                        <div className="text-center p-4 text-slate-400 space-y-2">
                          <Camera size={36} className="mx-auto opacity-50" />
                          <p className="text-xs">Camera is offline</p>
                        </div>
                      )}
                    </>
                  )}
                  <canvas ref={canvasRef} width="320" height="240" className="hidden" />
                </div>

                <div className="flex justify-center gap-3 pt-2">
                  {!cameraActive && !capturedFace && (
                    <Button type="button" variant="outline" onClick={startCamera} icon={Camera}>
                      Start Camera
                    </Button>
                  )}

                  {cameraActive && !capturedFace && (
                    <Button type="button" onClick={captureFacePhoto} icon={CheckCircle2} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      Capture Face Photo
                    </Button>
                  )}

                  {capturedFace && (
                    <Button type="button" variant="outline" onClick={retakeFacePhoto} icon={RefreshCw}>
                      Retake Snapshot
                    </Button>
                  )}
                </div>
                {capturedFace && (
                  <p className="text-xs text-emerald-600 font-medium flex items-center justify-center gap-1">
                    <CheckCircle2 size={14} /> Face ID Biometric Snapshot Saved
                  </p>
                )}
              </div>

              <div className="pt-6 flex justify-between">
                <Button type="button" variant="outline" onClick={prevStep}>Back</Button>
                <Button type="submit" isLoading={isLoading} className="shadow-lg shadow-primary/25 bg-emerald-600 hover:bg-emerald-700">
                  Complete Registration & Enable Wallet
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
