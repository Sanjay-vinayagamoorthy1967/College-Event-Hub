import React, { useState, useEffect, Component } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { FiMail, FiLock, FiChevronRight, FiChevronLeft, FiCamera, FiAlertCircle } from 'react-icons/fi';
import GlassCard from '../components/ui/GlassCard';
import GradientButton from '../components/ui/GradientButton';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';
import { Html5QrcodeScanner } from 'html5-qrcode';

// Error Boundary Component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[85vh] flex items-center justify-center px-6 py-12">
          <div className="max-w-md w-full bg-white dark:bg-dark-900 border border-red-500/20 p-8 rounded-3xl text-center shadow-xl">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiAlertCircle size={32} />
            </div>
            <h3 className="text-xl font-bold font-sora text-dark-900 mb-2">Something went wrong.</h3>
            <p className="text-sm text-dark-600 mb-6 font-poppins">
              Something went wrong. Please refresh the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md text-sm"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function InternalLoginContent() {
  const navigate = useNavigate();
  const { loginWithBarcodeOTP, isAuthenticated } = useAuth();
  const [step, setStep] = useState('scan_barcode'); // 'scan_barcode' | 'verify_otp'
  const [submitting, setSubmitting] = useState(false);
  const [manualSin, setManualSin] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [scannedSin, setScannedSin] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [scannerError, setScannerError] = useState('');
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Camera Barcode Scanner Lifecycle Hook
  useEffect(() => {
    let scanner = null;
    if (cameraActive && step === 'scan_barcode') {
      try {
        scanner = new Html5QrcodeScanner('barcode-reader-login', {
          qrbox: { width: 250, height: 150 },
          fps: 10,
        });

        scanner.render(
          (result) => {
            scanner.clear().catch(e => console.error(e));
            setCameraActive(false);
            handleBarcodeLoginSubmit(result);
          },
          (err) => {
            // Silenced console scan errors
          }
        );
      } catch (err) {
        console.error("Failed to initialize scanner:", err);
        setScannerError("Camera scanner initialization failed. Please enter the barcode ID manually below.");
        setCameraActive(false);
      }
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(err => console.error("Failed to clear scanner", err));
      }
    };
  }, [cameraActive, step]);

  const handleBarcodeLoginSubmit = async (barcodeVal) => {
    const val = (barcodeVal || '').trim();
    if (!val) return;

    setSubmitting(true);
    setScannerError('');
    try {
      const response = await authService.loginBarcode(val);
      if (response.success) {
        setScannedSin(val);
        const email = val.toLowerCase() + '@shanmugha.edu.in';
        setGeneratedEmail(email);
        toast.success('Student identified. OTP sent successfully!');
        setStep('verify_otp');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message;
      if (errMsg.includes('Student not found')) {
        toast.error('Student not found. Please register/sign up first.');
      } else {
        toast.error(errMsg || 'Verification failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyLoginOtp = async (data) => {
    setSubmitting(true);
    try {
      const response = await authService.verifyLoginOTP(generatedEmail, data.otp);
      if (response.success) {
        loginWithBarcodeOTP(response.token, response.user);
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="absolute top-20 left-20 w-80 h-80 bg-primary-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-secondary-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-lg z-10">
        <GlassCard className="p-8 md:p-10 border border-[#E5E7EB] shadow-xl bg-white/80 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-[#E5E7EB]">
            <div>
              <h2 className="text-2xl font-black font-sora text-dark-900 leading-tight">INTERNAL STUDENT LOGIN</h2>
              <p className="text-[10px] text-dark-500 font-bold uppercase mt-1">
                {step === 'scan_barcode' ? 'Step 1 of 2' : 'Step 2 of 2'}
              </p>
            </div>
            {step === 'verify_otp' && (
              <button
                onClick={() => {
                  setStep('scan_barcode');
                  setScannedSin('');
                  setGeneratedEmail('');
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-dark-600 hover:text-dark-900 border border-[#E5E7EB] px-3.5 py-2 rounded-xl bg-dark-900/5 transition-all focus:outline-none"
              >
                <FiChevronLeft /> Back
              </button>
            )}
          </div>

          {/* Checklist Banner */}
          {step === 'verify_otp' && (
            <div className="mb-6 p-4 bg-primary-50/50 rounded-2xl border border-primary-100 flex flex-col gap-2 text-[11px]">
              <div className="flex items-center gap-1 text-emerald-600 font-bold">
                <span>✓ Scan Barcode</span>
              </div>
              <div className="flex items-center gap-1 text-emerald-600 font-bold">
                <span>✓ Scanned SIN: <span className="font-mono">{scannedSin}</span></span>
              </div>
              <div className="flex items-center gap-1 text-emerald-600 font-bold">
                <span>✓ Email: <span className="font-mono text-dark-700">{generatedEmail}</span></span>
              </div>
              <div className="flex items-center gap-1 text-dark-500 font-bold">
                <span className="text-emerald-600">✓ Verify OTP</span>
              </div>
            </div>
          )}

          {/* Step 1: Scan Barcode */}
          {step === 'scan_barcode' && (
            <div className="flex flex-col gap-6 items-center text-center font-poppins">
              <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center text-3xl">
                🏷️
              </div>
              <div>
                <h3 className="text-lg font-bold font-sora text-dark-900 mb-1">Scan College ID Card</h3>
                <p className="text-xs text-dark-600 max-w-sm leading-relaxed">
                  Scan your barcode or enter your Register Number manually to automatically generate email and verify via OTP.
                </p>
              </div>

              {scannerError && (
                <div className="w-full p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs font-semibold flex items-center gap-2 text-left">
                  <FiAlertCircle className="flex-shrink-0 text-base" />
                  <span>{scannerError}</span>
                </div>
              )}

              <div className="w-full space-y-4">
                {/* USB Barcode form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleBarcodeLoginSubmit(manualSin);
                  }}
                  className="bg-slate-50 p-6 rounded-2xl border border-[#E5E7EB] text-left space-y-3"
                >
                  <label className="block text-xs font-bold text-dark-600 uppercase">USB Scanner Input</label>
                  <p className="text-[10px] text-dark-500 leading-normal">
                    Focus the field below and scan your ID card.
                  </p>
                  <input
                    type="text"
                    placeholder="Click here & scan..."
                    value={manualSin}
                    onChange={(e) => setManualSin(e.target.value)}
                    className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm bg-white"
                    autoFocus
                  />
                  <GradientButton
                    type="submit"
                    variant="gradient"
                    disabled={submitting || !manualSin.trim()}
                    className="w-full py-2.5 flex items-center justify-center gap-2"
                  >
                    {submitting ? 'Identifying...' : 'Submit ID Barcode'}
                  </GradientButton>
                </form>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-[#E5E7EB]"></div>
                  <span className="flex-shrink mx-4 text-dark-400 text-[10px] font-bold uppercase">or use camera</span>
                  <div className="flex-grow border-t border-[#E5E7EB]"></div>
                </div>

                {/* Camera Toggle */}
                {!cameraActive ? (
                  <GradientButton
                    type="button"
                    variant="secondary"
                    onClick={() => setCameraActive(true)}
                    className="w-full py-3 flex items-center justify-center gap-2"
                    icon={FiCamera}
                  >
                    Start Camera Barcode Scanner
                  </GradientButton>
                ) : (
                  <div className="space-y-4 w-full">
                    <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-slate-50 p-2 shadow-inner">
                      <div id="barcode-reader-login" className="w-full"></div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCameraActive(false)}
                      className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-xs font-bold rounded-xl transition-all"
                    >
                      Cancel Camera Scanning
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Verify OTP */}
          {step === 'verify_otp' && (
            <form onSubmit={handleSubmit(handleVerifyLoginOtp)} className="flex flex-col gap-4 font-poppins">
              <div className="text-center mb-4">
                <p className="text-xs text-dark-600">
                  Please enter the 6-digit verification code sent to:
                </p>
                <p className="text-xs font-bold text-dark-900 font-mono mt-1">{generatedEmail}</p>
              </div>

              <Input
                label="Verification Code (OTP)"
                name="otp"
                type="text"
                placeholder="Enter 6-digit OTP"
                icon={FiLock}
                error={errors.otp}
                register={register}
                validation={{
                  required: "OTP code is required",
                  pattern: {
                    value: /^\d{6}$/,
                    message: "OTP must be exactly 6 digits"
                  }
                }}
              />

              <GradientButton
                type="submit"
                variant="gradient"
                size="lg"
                disabled={submitting}
                className="w-full py-3.5 mt-2 flex items-center justify-center gap-2"
              >
                {submitting ? 'Verifying OTP...' : 'Verify & Log In'}
                <FiChevronRight />
              </GradientButton>
            </form>
          )}

          <div className="text-center mt-6">
            <span className="text-xs text-dark-400 font-poppins">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/register')}
                className="text-primary-400 font-bold hover:underline"
              >
                Sign Up
              </button>
            </span>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

export default function InternalLogin() {
  return (
    <ErrorBoundary>
      <InternalLoginContent />
    </ErrorBoundary>
  );
}
