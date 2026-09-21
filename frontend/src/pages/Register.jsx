import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { DEPARTMENTS, YEARS, TAMIL_NADU_COLLEGES } from '../utils/constants';
import { FiUser, FiMail, FiPhone, FiLock, FiBookOpen, FiFile, FiCheck, FiChevronRight, FiChevronLeft, FiCamera } from 'react-icons/fi';
import GlassCard from '../components/ui/GlassCard';
import GradientButton from '../components/ui/GradientButton';
import Input from '../components/ui/Input';
import { validatePhoneNumber } from '../utils/validators';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import { Html5Qrcode } from 'html5-qrcode';

function RegisterContent() {
  const navigate = useNavigate();
  const { register: registerUser, verifyOTP, isAuthenticated, googleLogin, loginWithBarcodeOTP } = useAuth();
  const [step, setStep] = useState(1);
  const [studentType, setStudentType] = useState(''); // 'student_internal' | 'student_external'
  const [submitting, setSubmitting] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(0);
  const [extractedSin, setExtractedSin] = useState('');
  const [manualSin, setManualSin] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [scannedStudentInfo, setScannedStudentInfo] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [tempAuthResponse, setTempAuthResponse] = useState(null);
  const [manualMode, setManualMode] = useState(false);
  const [scanFailed, setScanFailed] = useState(false);
  const [scanErrorMessage, setScanErrorMessage] = useState('');
  const [showAlreadyRegisteredModal, setShowAlreadyRegisteredModal] = useState(false);
  const lastScannedBarcodeRef = useRef('');
  const lastScannedTimeRef = useRef(0);
  const handleBarcodeSubmitRef = useRef(null); // prevents stale closure in camera callback
  // auto-derived: never editable by the user
  const autoEmail = extractedSin ? extractedSin.trim().toLowerCase() + '@shanmugha.edu.in' : '';

  const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const selectStudentType = (type) => {
    setStudentType(type);
    setStep(2);
  };



  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const response = await registerUser(data, studentType);
      if (response && response.success) {
        setUserEmail(response.email);
        setStep(4);
        setTimer(60);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error('Please enter a valid 6-digit OTP');
    setSubmitting(true);
    try {
      const result = await verifyOTP(userEmail, otp, studentType);
      if (result) {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#8B5CF6', '#EC4899', '#F59E0B']
        });

        if (result.requiresApproval) {
          navigate('/login');
        } else {
          navigate('/dashboard');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOTP = async () => {
    if (timer > 0) return;
    try {
      const { authService } = await import('../services/authService');
      const response = await authService.resendOTP(userEmail, studentType);
      if (response.success) {
        toast.success('OTP resent to your gmail');
        setTimer(60);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    }
  };


  const handleBarcodeSubmit = async (barcodeVal) => {
    if (!barcodeVal) return;
    processingScanRef.current = true;
    toast.dismiss();
    setSubmitting(true);

    const sinNo = barcodeVal.trim().toUpperCase();

    // Debugging logs
    console.log('Scanned Barcode:', barcodeVal);
    console.log('Decoded SIN:', sinNo);

    try {
      const { authService } = await import('../services/authService');

      // Only check: is this SIN already registered?
      const checkRes = await authService.checkRegistration(sinNo);
      console.log('Registration Status:', checkRes.registered ? 'Already Registered' : 'Not Registered');

      if (checkRes.registered) {
        // ── Already registered ──────────────────────────────────────────────
        toast.error('This College ID has already been registered. Please login.');
        setShowAlreadyRegisteredModal(true);
      } else {
        // ── Not registered → go directly to form ───────────────────────────
        const generatedEmail = sinNo.toLowerCase() + '@shanmugha.edu.in';

        // Clear every manual field so the form is empty
        setValue('name', '');
        setValue('gender', '');
        setValue('year', '');
        setValue('department', '');
        setValue('academicYear', '');
        setValue('phone', '');
        setValue('password', '');
        setValue('confirmPassword', '');

        // Auto-fill read-only fields only
        setExtractedSin(sinNo);
        setValue('registerNumber', sinNo);
        setValue('collegeName', 'Sri Shanmugha Educational Institution');
        setValue('email', generatedEmail);

        toast.success('College ID verified! Please fill out the registration form.');
        setScanFailed(false);
        setStep('internal_signup_form');
      }
    } catch (err) {
      // Network / server error only — never show 'not found' for unregistered SINs
      const status = err.response?.status;
      const errMsg = err.response?.data?.message || err.message || '';

      if (status === 400 || errMsg.toLowerCase().includes('already registered')) {
        // Server said already registered
        toast.error('This College ID has already been registered. Please login.');
        setShowAlreadyRegisteredModal(true);
      } else {
        // Genuine network / server error
        toast.error('Could not verify College ID. Please try again.');
        setScanFailed(true);
        setScanErrorMessage('Could not verify College ID. Please try again.');
      }
    } finally {
      setSubmitting(false);
      setCameraActive(false);
    }
  };
  // Keep ref in sync so the camera callback (which has a stale closure) always calls the latest version
  handleBarcodeSubmitRef.current = handleBarcodeSubmit;

  const handleSendOTP = async () => {
    const isValid = await trigger([
      'name',
      'gender',
      'year',
      'department',
      'academicYear',
      'phone',
      'password',
      'confirmPassword'
    ]);
    if (!isValid) {
      toast.error('Please fill all required registration details correctly first.');
      return;
    }

    setSubmitting(true);
    try {
      const data = watch();
      const payload = {
        name: data.name,
        registerNumber: data.registerNumber,
        department: data.department,
        year: data.year,
        gender: data.gender,
        email: data.email,
        phone: data.phone,
        password: data.password,
        type: 'student_internal'
      };

      const { authService } = await import('../services/authService');
      const response = await authService.register(payload, 'student_internal');
      if (response.success) {
        setOtpSent(true);
        setTimer(60);
        toast.success('OTP sent successfully to your college email!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyInternalOTP = async () => {
    if (!otpInput.trim()) return;
    setSubmitting(true);
    try {
      const email = watch('email');
      const { authService } = await import('../services/authService');
      const response = await authService.verifyOTP(email, otpInput, 'student_internal');
      if (response.token) {
        setTempAuthResponse(response);
        setOtpVerified(true);
        toast.success('OTP verified successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalRegister = async (data) => {
    if (!otpVerified || !tempAuthResponse) {
      toast.error('Please verify your email OTP first.');
      return;
    }
    try {
      loginWithBarcodeOTP(tempAuthResponse.token, tempAuthResponse.user);
      toast.success('Registration completed successfully!');
    } catch (err) {
      toast.error(err.message || 'Registration failed.');
    }
  };

  const html5QrcodeRef = useRef(null);
  const processingScanRef = useRef(false);



  // Hard-kills the camera: stops the Html5Qrcode instance AND
  // releases every underlying MediaStreamTrack so the browser
  // camera indicator turns off immediately.
  const stopCameraHard = async (scanner) => {
    try {
      if (scanner && scanner.isScanning) {
        await scanner.stop();
      }
    } catch (_) { /* already stopped */ }

    // Kill every live video track in the page
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(t => t.stop());
    } catch (_) { /* permission denied or no stream — ignore */ }

    // Also stop any <video> elements still holding a srcObject
    document.querySelectorAll('video').forEach(v => {
      if (v.srcObject) {
        v.srcObject.getTracks().forEach(t => t.stop());
        v.srcObject = null;
      }
      v.load();
    });

    html5QrcodeRef.current = null;
  };

  const barcodeReaderRef = useCallback((node) => {
    if (node !== null) {
      try {
        if (!html5QrcodeRef.current) {
          const html5Qrcode = new Html5Qrcode(node.id);
          html5QrcodeRef.current = html5Qrcode;

          html5Qrcode.start(
            { facingMode: "environment" },
            {
              fps: 5,                          // lower FPS → fewer decode callbacks
              qrbox: { width: 250, height: 150 }
            },
            (result) => {
              // ── Processing lock — accept only the very first decode ──
              if (processingScanRef.current) return;
              processingScanRef.current = true;

              // Stop & destroy the camera immediately, then handle the result
              stopCameraHard(html5Qrcode).then(() => {
                if (handleBarcodeSubmitRef.current) {
                  handleBarcodeSubmitRef.current(result);
                }
              });
            },
            (_err) => { /* scan-frame errors are expected — silence them */ }
          ).catch(err => {
            console.error("Failed to start camera:", err);
          });
        }
      } catch (err) {
        console.error("Scanner initialization failed:", err);
      }
    } else {
      // Node unmounted — kill everything
      if (html5QrcodeRef.current) {
        stopCameraHard(html5QrcodeRef.current);
      }
    }
  }, []);


  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { type: 'spring', damping: 20 } },
    exit: { opacity: 0, x: -50, transition: { ease: 'easeInOut', duration: 0.2 } }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="absolute top-20 left-20 w-80 h-80 bg-primary-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-secondary-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-2xl z-10">
        <GlassCard className="p-8 md:p-10 border border-[#E5E7EB] shadow-xl bg-white/80 overflow-hidden">
          {/* Header step progress bar */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#E5E7EB]">
            <div>
              <h2 className="text-2xl font-black font-sora text-dark-900 leading-tight">STUDENT PORTAL SIGNUP</h2>
              <p className="text-[10px] text-dark-500 font-bold uppercase mt-1">
                Step {
                  step === 'scan_barcode' ? 1 : 
                  step === 'internal_signup_form' ? 2 : 
                  (step > 3 ? 3 : step)
                } of {
                  studentType === 'student_internal' ? 2 : 3
                }
              </p>
            </div>
            {(step > 1 || step === 'scan_barcode' || step === 'internal_signup_form') && (
              <button
                onClick={() => {
                  if (step === 4) {
                    setStep(3); // Go back to edit email if needed
                  } else if (step === 'internal_signup_form') {
                    setStep('scan_barcode');
                    setScannedStudentInfo(null);
                    setOtpSent(false);
                    setOtpVerified(false);
                    setOtpInput('');
                    setCameraActive(true);
                    processingScanRef.current = false;
                  } else if (step === 'scan_barcode') {
                    setStep(1);
                    setStudentType('');
                  } else if (step === 2) {
                    if (studentType === 'student_internal') {
                      setStep('scan_barcode');
                    } else {
                      setStep(1);
                      setStudentType('');
                    }
                  } else if (step === 3) {
                    if (studentType === 'student_internal') {
                      setStep('scan_barcode');
                    } else {
                      setStep(2);
                    }
                  } else {
                    setStep(step - 1);
                  }
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-dark-600 hover:text-dark-900 border border-[#E5E7EB] px-3.5 py-2 rounded-xl bg-dark-900/5 transition-all focus:outline-none"
              >
                <FiChevronLeft /> Back
              </button>
            )}
          </div>

          {/* Registration Checklist Banner for Internal Students */}
          {studentType === 'student_internal' && step !== 1 && step !== 'scan_barcode' && (
            <div className="mb-6 p-4 bg-primary-50/50 rounded-2xl border border-primary-100 flex flex-wrap gap-4 items-center justify-between text-[11px] animate-fade-in">
              <div className="flex items-center gap-1 text-emerald-600 font-bold">
                <span>✓ Scan Barcode</span>
              </div>
              <div className="flex items-center gap-1 text-emerald-600 font-bold">
                <span>✓ Scanned SIN: <span className="font-mono">{extractedSin}</span></span>
              </div>
              <div className="flex items-center gap-1 text-emerald-600 font-bold">
                <span>✓ Email: <span className="font-mono text-dark-700">{extractedSin.toLowerCase()}@shanmugha.edu.in</span></span>
              </div>
              <div className="flex items-center gap-1 text-dark-500 font-bold">
                <span className={otpVerified ? "text-emerald-600" : (otpSent ? "text-amber-500" : "")}>
                  {otpVerified ? "✓ Verify OTP" : "○ Verify OTP"}
                </span>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* STEP 1: Select affiliation */}
            {step === 1 && (
              <motion.div
                key="step1"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-col gap-6"
              >
                <p className="text-sm font-semibold text-dark-600 text-center font-poppins mb-2">
                  Please select your college affiliation to proceed with the registration template.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div
                    onClick={() => {
                      setStudentType('student_internal');
                      setStep('scan_barcode');
                      setCameraActive(true);
                    }}
                    className="bg-white p-6 rounded-[25px] border border-[#E5E7EB] hover:border-primary-500 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col items-center text-center group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-primary-500/10 border border-primary-500/20 text-primary-400 flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform">
                      🏫
                    </div>
                    <h3 className="font-bold font-sora text-dark-900 text-base mb-2">Sri Shanmugha College Student</h3>
                    <p className="text-xs text-dark-500 font-poppins leading-relaxed">
                      Scan your official college ID card barcode to verify and proceed.
                    </p>
                  </div>

                  <div
                    onClick={() => selectStudentType('student_external')}
                    className="bg-white p-6 rounded-[25px] border border-[#E5E7EB] hover:border-primary-500 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col items-center text-center group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-secondary-500/10 border border-secondary-500/20 text-secondary-400 flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform">
                      🌐
                    </div>
                    <h3 className="font-bold font-sora text-dark-900 text-base mb-2">Other College Student</h3>
                    <p className="text-xs text-dark-500 font-poppins leading-relaxed">
                      For students from external universities or affiliated institutes. Requires college photo ID card upload.
                    </p>
                  </div>

                  <div
                    onClick={() => selectStudentType('admin')}
                    className="bg-white p-6 rounded-[25px] border border-[#E5E7EB] hover:border-emerald-500 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col items-center text-center group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform">
                      🛡️
                    </div>
                    <h3 className="font-bold font-sora text-dark-900 text-base mb-2">Administrator</h3>
                    <p className="text-xs text-dark-500 font-poppins leading-relaxed">
                      For college staff and event managers to organize and oversee events on the platform.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP: Scan College ID Card Barcode */}
            {step === 'scan_barcode' && (
              <motion.div
                key="stepScanBarcode"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-col gap-6 items-center text-center font-poppins w-full"
              >
                <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center text-3xl">
                  🏷️
                </div>
                <div>
                  <h3 className="text-xl font-bold font-sora text-dark-900 mb-2">Scan College ID Card Barcode</h3>
                  <p className="text-sm text-dark-600 max-w-md leading-relaxed">
                    Scan the barcode printed on the student's official college ID card to automatically identify the student.
                  </p>
                </div>

                {scanFailed ? (
                  <div className="bg-red-50/50 border border-red-200 rounded-3xl p-8 text-center space-y-4 max-w-md w-full animate-in fade-in zoom-in duration-200 shadow-md">
                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xl mx-auto">
                      ❌
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-dark-900 text-sm font-sora">{scanErrorMessage}</h4>
                      <p className="text-xs text-dark-500 font-poppins leading-relaxed">
                        {scanErrorMessage && (scanErrorMessage.includes('already exists') || scanErrorMessage.includes('already registered'))
                          ? 'This student ID has already been registered in the portal. Please log in to your account.'
                          : 'The barcode could not be recognized or does not belong to a genuine unregistered college ID.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setScanFailed(false);
                        setScanErrorMessage('');
                        setManualSin('');
                        setManualMode(false);
                        lastScannedBarcodeRef.current = '';
                        lastScannedTimeRef.current = 0;
                        processingScanRef.current = false;
                      }}
                      className="w-full py-3 bg-dark-900 hover:bg-dark-800 text-white font-bold rounded-2xl text-xs transition-all text-center focus:outline-none"
                    >
                      Scan Again
                    </button>
                  </div>
                ) : manualMode ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleBarcodeSubmit(manualSin);
                    }}
                    className="bg-slate-50 p-6 rounded-2xl border border-[#E5E7EB] text-left space-y-3 w-full max-w-md shadow-inner animate-in fade-in duration-200"
                  >
                    <label className="block text-xs font-bold text-dark-600 uppercase">Enter Barcode Manually</label>
                    <input
                      type="text"
                      placeholder="Enter SIN Number (e.g. E23CS048)"
                      value={manualSin}
                      onChange={(e) => setManualSin(e.target.value)}
                      className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm bg-white text-dark-900 font-bold"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setManualMode(false)}
                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-dark-600 font-bold rounded-xl text-xs transition-all focus:outline-none"
                      >
                        Use Camera
                      </button>
                      <GradientButton
                        type="submit"
                        variant="gradient"
                        disabled={submitting || !manualSin.trim()}
                        className="flex-1 py-2.5"
                      >
                        {submitting ? 'Verifying...' : 'Submit'}
                      </GradientButton>
                    </div>
                  </form>
                ) : (
                  <div className="w-full max-w-md space-y-4">
                    <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-slate-50 p-2 shadow-inner">
                      <div id="barcode-reader" ref={barcodeReaderRef} className="w-full"></div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setManualMode(true)}
                      className="text-xs text-primary-600 hover:text-primary-700 font-bold underline transition-all focus:outline-none"
                    >
                      Can't scan? Use USB scanner / Enter manually
                    </button>
                  </div>
                )}
              </motion.div>
            )}

             {/* STEP: Internal Student Signup Form */}
            {step === 'internal_signup_form' && (
              <motion.div
                key="internalSignupForm"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="w-full text-left font-poppins"
              >
                <div className="mb-6">
                  <h3 className="text-xl font-bold font-sora text-dark-900 mb-1">Student Registration Form</h3>
                  <p className="text-xs text-dark-500">
                    Fill in your details below. Fields marked with <span className="text-red-500 font-bold">*</span> are required.
                  </p>
                </div>

                <form onSubmit={handleSubmit(handleFinalRegister)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* 1. Full Name — manual, required */}
                    <div>
                      <label className="block text-xs font-bold text-dark-600 uppercase mb-1.5">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter your full name"
                        {...register('name', { required: 'Full Name is required' })}
                        className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm text-dark-900"
                      />
                      {errors.name && <p className="mt-1 text-xs text-red-500 font-medium">{errors.name.message}</p>}
                    </div>

                    {/* 2. SIN Number — auto-filled, read-only */}
                    <div>
                      <label className="block text-xs font-bold text-dark-600 uppercase mb-1.5">
                        SIN Number <span className="text-[10px] font-normal text-dark-400 normal-case">(Auto-filled)</span>
                      </label>
                      <input
                        type="text"
                        readOnly
                        tabIndex={-1}
                        {...register('registerNumber')}
                        className="w-full px-4 py-3 border border-[#E5E7EB] bg-slate-50 rounded-xl text-sm text-dark-500 font-mono cursor-not-allowed select-none"
                      />
                    </div>

                    {/* 3. Gender — manual, required */}
                    <div>
                      <label className="block text-xs font-bold text-dark-600 uppercase mb-1.5">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register('gender', { required: 'Gender is required' })}
                        className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white text-dark-900 font-semibold"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      {errors.gender && <p className="mt-1 text-xs text-red-500 font-medium">{errors.gender.message}</p>}
                    </div>

                    {/* 4. Year — manual, required */}
                    <div>
                      <label className="block text-xs font-bold text-dark-600 uppercase mb-1.5">
                        Year <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register('year', { required: 'Year is required' })}
                        className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white text-dark-900 font-semibold"
                      >
                        <option value="">Select Year</option>
                        <option value="1">I Year</option>
                        <option value="2">II Year</option>
                        <option value="3">III Year</option>
                        <option value="4">IV Year</option>
                      </select>
                      {errors.year && <p className="mt-1 text-xs text-red-500 font-medium">{errors.year.message}</p>}
                    </div>

                    {/* 5. Department — manual, required */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-dark-600 uppercase mb-1.5">
                        Department <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register('department', { required: 'Department is required' })}
                        className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white text-dark-900 font-semibold"
                      >
                        <option value="">Select Department</option>
                        <option value="Computer Science and Engineering">Computer Science and Engineering</option>
                        <option value="Information Technology">Information Technology</option>
                        <option value="Artificial Intelligence and Data Science">Artificial Intelligence and Data Science</option>
                        <option value="Electronics and Communication Engineering">Electronics and Communication Engineering</option>
                        <option value="Electrical and Electronics Engineering">Electrical and Electronics Engineering</option>
                        <option value="Mechanical Engineering">Mechanical Engineering</option>
                        <option value="Civil Engineering">Civil Engineering</option>
                        <option value="MBA">MBA</option>
                        <option value="MCA">MCA</option>
                      </select>
                      {errors.department && <p className="mt-1 text-xs text-red-500 font-medium">{errors.department.message}</p>}
                    </div>

                    {/* 6. Academic Year — manual, required */}
                    <div>
                      <label className="block text-xs font-bold text-dark-600 uppercase mb-1.5">
                        Academic Year <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 2023-2027"
                        {...register('academicYear', { required: 'Academic Year is required' })}
                        className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm text-dark-900"
                      />
                      {errors.academicYear && <p className="mt-1 text-xs text-red-500 font-medium">{errors.academicYear.message}</p>}
                    </div>

                    {/* 7. Phone Number — manual, required */}
                    <div>
                      <label className="block text-xs font-bold text-dark-600 uppercase mb-1.5">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter 10-digit mobile number"
                        {...register('phone', {
                          required: 'Phone number is required',
                          validate: validatePhoneNumber
                        })}
                        className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm text-dark-900"
                      />
                      {errors.phone && <p className="mt-1 text-xs text-red-500 font-medium">{errors.phone.message}</p>}
                    </div>

                    {/* 8. College Name — auto-filled, read-only */}
                    <div>
                      <label className="block text-xs font-bold text-dark-600 uppercase mb-1.5">
                        College Name <span className="text-[10px] font-normal text-dark-400 normal-case">(Auto-filled)</span>
                      </label>
                      <input
                        type="text"
                        readOnly
                        tabIndex={-1}
                        {...register('collegeName')}
                        className="w-full px-4 py-3 border border-[#E5E7EB] bg-slate-50 rounded-xl text-sm text-dark-500 cursor-not-allowed select-none"
                      />
                    </div>

                    {/* 9. College Email — auto-filled, read-only */}
                    <div>
                      <label className="block text-xs font-bold text-dark-600 uppercase mb-1.5">
                        College Email <span className="text-[10px] font-normal text-dark-400 normal-case">(Auto-filled)</span>
                      </label>
                      <input
                        type="email"
                        readOnly
                        tabIndex={-1}
                        {...register('email')}
                        className="w-full px-4 py-3 border border-[#E5E7EB] bg-slate-50 rounded-xl text-sm text-dark-500 font-mono cursor-not-allowed select-none"
                      />
                    </div>

                    {/* 10. Password — manual, required */}
                    <div>
                      <label className="block text-xs font-bold text-dark-600 uppercase mb-1.5">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } })}
                        className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm text-dark-900"
                      />
                      {errors.password && <p className="mt-1 text-xs text-red-500 font-medium">{errors.password.message}</p>}
                    </div>

                    {/* 11. Confirm Password — manual, required */}
                    <div>
                      <label className="block text-xs font-bold text-dark-600 uppercase mb-1.5">
                        Confirm Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        {...register('confirmPassword', {
                          required: 'Please confirm your password',
                          validate: (val) => watch('password') === val || 'Passwords do not match'
                        })}
                        className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm text-dark-900"
                      />
                      {errors.confirmPassword && <p className="mt-1 text-xs text-red-500 font-medium">{errors.confirmPassword.message}</p>}
                    </div>
                  </div>

                  {/* OTP Verification Block */}
                  <div className="bg-slate-50 border border-[#E5E7EB] p-6 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <h4 className="font-bold text-dark-900 text-sm">College Email Verification</h4>
                        <p className="text-[11px] text-dark-500 mt-0.5">
                          OTP will be sent to: <span className="font-semibold text-primary-600 font-mono">{watch('email')}</span>
                        </p>
                      </div>
                      {!otpSent ? (
                        <button
                          type="button"
                          onClick={handleSendOTP}
                          disabled={submitting}
                          className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white font-bold py-2 px-5 rounded-xl text-xs transition-all shadow-md focus:outline-none"
                        >
                          {submitting ? 'Sending...' : 'Send OTP'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendOTP}
                          disabled={submitting || timer > 0}
                          className="bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 disabled:text-slate-400 text-dark-600 font-bold py-2 px-4 rounded-xl text-xs transition-all focus:outline-none"
                        >
                          {timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
                        </button>
                      )}
                    </div>

                    {otpSent && (
                      <div className="flex items-end gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-dark-600 uppercase mb-1.5">Enter OTP Code</label>
                          <input
                            type="number"
                            placeholder="Enter 6-digit OTP"
                            value={otpInput}
                            onChange={(e) => setOtpInput(e.target.value)}
                            disabled={otpVerified}
                            className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
                          />
                        </div>
                        {!otpVerified ? (
                          <button
                            type="button"
                            onClick={handleVerifyInternalOTP}
                            disabled={submitting || !otpInput.trim()}
                            className="bg-dark-900 hover:bg-dark-800 disabled:bg-dark-900/40 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-all focus:outline-none"
                          >
                            {submitting ? 'Verifying...' : 'Verify OTP'}
                          </button>
                        ) : (
                          <div className="bg-emerald-100 text-emerald-700 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 whitespace-nowrap">
                            <FiCheck /> OTP Verified ✓
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <GradientButton
                    type="submit"
                    variant="gradient"
                    size="lg"
                    disabled={!otpVerified || submitting}
                    className="w-full"
                    icon={FiCheck}
                  >
                    Register
                  </GradientButton>
                </form>
              </motion.div>
            )}



            {/* STEP 2: Basic & College Details */}
            {step === 2 && (
              <motion.div
                key="step2"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <form onSubmit={handleSubmit((d) => setStep(3))} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    name="name"
                    icon={FiUser}
                    placeholder="Enter your name"
                    error={errors.name}
                    register={register}
                    required="Name is required"
                  />

                  {studentType !== 'admin' && (
                    studentType === 'student_internal' ? (
                      <>
                        <Input
                          label="Register Number (SIN)"
                          name="registerNumber"
                          icon={FiBookOpen}
                          placeholder="e.g. E23CS021"
                          error={errors.registerNumber}
                          register={register}
                          required="Register number is required"
                          readOnly={!!extractedSin}
                        />
                        {extractedSin && (
                          <Input
                            label="College Name"
                            name="collegeName"
                            icon={FiBookOpen}
                            readOnly={true}
                            register={register}
                          />
                        )}
                      </>
                    ) : (
                      <div className="relative w-full">
                        <Input
                          label="College Name"
                          name="collegeName"
                          icon={FiBookOpen}
                          placeholder="Enter college university name"
                          error={errors.collegeName}
                          register={register}
                          required="College name is required"
                          list="college-list"
                        />
                        <datalist id="college-list">
                          {TAMIL_NADU_COLLEGES.map((college, idx) => (
                            <option key={idx} value={college} />
                          ))}
                        </datalist>
                      </div>
                    )
                  )}

                  {studentType !== 'admin' && (
                    <>
                      {/* Dropdowns */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1.5 text-dark-600">Department</label>
                        <select
                          {...register('department', { required: 'Department is required' })}
                          className="input-field py-3.5 bg-white border-[#E5E7EB]"
                        >
                          <option value="">Select Department</option>
                          {DEPARTMENTS.map((dept, i) => (
                            <option key={i} value={dept}>{dept}</option>
                          ))}
                        </select>
                        {errors.department && <p className="mt-1 text-xs text-red-500 font-medium">{errors.department.message}</p>}
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1.5 text-dark-600">Academic Year</label>
                        <select
                          {...register('year', { required: 'Year is required' })}
                          className="input-field py-3.5 bg-white border-[#E5E7EB]"
                        >
                          <option value="">Select Year</option>
                          {YEARS.map((yr, i) => (
                            <option key={i} value={yr}>{yr} Year</option>
                          ))}
                        </select>
                        {errors.year && <p className="mt-1 text-xs text-red-500 font-medium">{errors.year.message}</p>}
                      </div>
                    </>
                  )}

                  {/* Gender Selector */}
                  <div className="mb-4 col-span-2">
                    <label className="block text-sm font-medium mb-1.5 text-dark-600">Gender</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['Male', 'Female', 'Other'].map((g, idx) => (
                        <label
                          key={idx}
                          className="flex items-center justify-center gap-2 border border-[#E5E7EB] py-3 rounded-2xl cursor-pointer hover:bg-dark-900/5 transition-all text-xs font-semibold text-dark-900"
                        >
                          <input
                            type="radio"
                            value={g}
                            {...register('gender', { required: 'Gender is required' })}
                            className="accent-primary-500"
                          />
                          <span>{g}</span>
                        </label>
                      ))}
                    </div>
                    {errors.gender && <p className="mt-1 text-xs text-red-500 font-medium">{errors.gender.message}</p>}
                  </div>

                  <div className="col-span-2 mt-4">
                    <GradientButton type="submit" variant="gradient" className="w-full" icon={FiChevronRight}>
                      Next Step
                    </GradientButton>
                  </div>
                </form>
              </motion.div>
            )}

            {/* STEP 3: Contact & Security Credentials */}
            {step === 3 && (
              <motion.div
                key="step3"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Phone Number"
                      name="phone"
                      type="tel"
                      icon={FiPhone}
                      placeholder="e.g. 9876543210"
                      error={errors.phone}
                      register={register}
                      validation={{
                        validate: validatePhoneNumber
                      }}
                    />

                    <Input
                      label="Email Address"
                      name="email"
                      type="text"
                      icon={FiMail}
                      placeholder="Enter your email address"
                      error={errors.email}
                      register={register}
                      readOnly={studentType === 'student_internal'}
                      autoComplete="new-email"
                      validation={{
                        required: "Email is required",
                        validate: (val) => {
                          if (!val || !val.includes('@')) {
                            return 'Please enter a valid email address containing @.';
                          }
                          return true;
                        }
                      }}
                    />

                    <Input
                      label="Password"
                      name="password"
                      type="password"
                      icon={FiLock}
                      placeholder="••••••••"
                      error={errors.password}
                      register={register}
                      required="Password is required"
                      autoComplete="new-password"
                    />

                    <Input
                      label="Confirm Password"
                      name="confirmPassword"
                      type="password"
                      icon={FiLock}
                      placeholder="••••••••"
                      error={errors.confirmPassword}
                      register={register}
                      validation={{
                        required: "Please confirm your password",
                        validate: (val) => {
                          if (watch('password') != val) {
                            return "Passwords do no match";
                          }
                        }
                      }}
                      autoComplete="new-password"
                    />

                    {studentType === 'student_internal' && (
                      <div className="col-span-2">
                        <label className="block text-sm font-medium mb-1.5 text-dark-600">Gender</label>
                        <div className="grid grid-cols-3 gap-3">
                          {['Male', 'Female', 'Other'].map((g, idx) => (
                            <label
                              key={idx}
                              className="flex items-center justify-center gap-2 border border-[#E5E7EB] py-3 rounded-2xl cursor-pointer hover:bg-dark-900/5 transition-all text-xs font-semibold text-dark-900"
                            >
                              <input
                                type="radio"
                                value={g}
                                {...register('gender', { required: 'Gender is required' })}
                                className="accent-primary-500"
                              />
                              <span>{g}</span>
                            </label>
                          ))}
                        </div>
                        {errors.gender && <p className="mt-1 text-xs text-red-500 font-medium">{errors.gender.message}</p>}
                      </div>
                    )}
                  </div>

                  <GradientButton
                    type="submit"
                    variant="gradient"
                    size="lg"
                    loading={submitting}
                    className="mt-6 w-full"
                    icon={FiCheck}
                  >
                    Finish Registration
                  </GradientButton>


                </form>
              </motion.div>
            )}

            {/* STEP 4: OTP Verification */}
            {step === 4 && (
              <motion.div
                key="step4"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <form onSubmit={handleVerifyOTP} className="flex flex-col gap-6 text-center">
                  <div className="mb-2">
                    <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                      <FiMail />
                    </div>
                    <h3 className="text-xl font-bold font-sora text-dark-900 mb-2">Verify your email</h3>
                    <p className="text-sm text-dark-600">
                      We've sent a 6-digit verification code to <br />
                      <span className="font-bold text-dark-900">{userEmail}</span>
                    </p>
                  </div>

                  <div>
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="Enter 6-digit OTP"
                      className="w-full text-center text-2xl tracking-[0.5em] font-mono py-4 border border-[#E5E7EB] rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-dark-900/5 placeholder-dark-300"
                      required
                    />
                  </div>

                  <GradientButton
                    type="submit"
                    variant="gradient"
                    size="lg"
                    loading={submitting}
                    className="w-full"
                    icon={FiCheck}
                    disabled={otp.length !== 6}
                  >
                    Verify Email & Login
                  </GradientButton>

                  <div className="mt-2">
                    <p className="text-xs text-dark-500">
                      Didn't receive the code?{' '}
                      {timer > 0 ? (
                        <span className="font-bold text-dark-400">Resend in {timer}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOTP}
                          className="font-bold text-primary-600 hover:text-primary-700 transition-colors"
                        >
                          Resend OTP
                        </button>
                      )}
                    </p>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </div>

      {/* Already Registered Modal Dialog */}
      {showAlreadyRegisteredModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center animate-in fade-in zoom-in duration-200">
            {/* Icon */}
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <span className="text-3xl">🎓</span>
            </div>

            {/* Title */}
            <h3 className="text-xl font-black font-sora text-dark-900 mb-2">Already Registered</h3>

            {/* Message */}
            <p className="text-sm text-dark-500 font-poppins leading-relaxed mb-6">
              You are already registered. Please login with your account.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-bold rounded-2xl text-sm hover:opacity-90 transition-all shadow-lg focus:outline-none"
              >
                Login Now
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAlreadyRegisteredModal(false);
                  setScanFailed(false);
                  setScanErrorMessage('');
                  setManualSin('');
                  setManualMode(false);
                  lastScannedBarcodeRef.current = '';
                  lastScannedTimeRef.current = 0;
                  processingScanRef.current = false;
                  setCameraActive(true);
                }}
                className="w-full py-3 bg-dark-100 hover:bg-dark-200 text-dark-700 font-bold rounded-2xl text-sm transition-all focus:outline-none"
              >
                Scan Another Barcode
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Error Boundary Component for Register
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error in Register:", error, errorInfo);
    this.setState({ error });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[85vh] flex items-center justify-center px-6 py-12">
          <div className="max-w-md w-full bg-white dark:bg-dark-900 border border-red-500/20 p-8 rounded-3xl text-center shadow-xl">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">⚠️</span>
            </div>
            <h3 className="text-xl font-bold font-sora text-dark-900 mb-2">Something went wrong.</h3>
            <p className="text-sm text-dark-600 mb-6 font-poppins">
              Something went wrong. Please refresh the page.
            </p>
            {this.state.error && (
              <pre className="text-left bg-slate-100 dark:bg-slate-800 p-4 rounded-xl text-red-600 dark:text-red-400 font-mono text-xs overflow-auto max-h-40 mb-6 border border-red-500/10">
                {this.state.error.toString() + "\n" + this.state.error.stack}
              </pre>
            )}
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

export default function Register() {
  return (
    <ErrorBoundary>
      <RegisterContent />
    </ErrorBoundary>
  );
}
