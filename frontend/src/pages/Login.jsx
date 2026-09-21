import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiChevronRight, FiAlertCircle } from 'react-icons/fi';
import { GoogleLogin } from '@react-oauth/google';
import GlassCard from '../components/ui/GlassCard';
import GradientButton from '../components/ui/GradientButton';
import Input from '../components/ui/Input';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated, userType, googleLogin } = useAuth();
  const [role, setRole] = useState('student'); // 'student' | 'admin'
  const [subRole, setSubRole] = useState('student_internal'); // 'student_internal' | 'student_external'
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loginUsername, setLoginUsername] = useState(''); // For student_internal: username part before @shanmugha.edu.in

  // Access Denied Modal State
  const [showAccessDenied, setShowAccessDenied] = useState(false);

  const { register, handleSubmit, setValue, getValues, formState: { errors } } = useForm();

  // Auto-fill test credentials removed for production

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'admin') {
      setRole('admin');
    } else {
      setRole('student');
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(userType === 'admin' ? '/admin' : '/dashboard');
    }
  }, [isAuthenticated, userType, navigate]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    setErrorMsg('');
    const authType = role === 'admin' ? 'admin' : subRole;

    try {
      const success = await login(data.email, data.password, authType);
      if (success) {
        navigate(role === 'admin' ? '/admin' : '/dashboard');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="min-h-[85vh] flex items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Background shapes */}
      <div className="absolute top-20 left-20 w-80 h-80 bg-primary-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-secondary-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-lg z-10">
        <GlassCard className="p-8 md:p-10 border border-[#E5E7EB] shadow-xl bg-white/80">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black font-sora text-dark-900 leading-tight">
              WELCOME BACK
            </h2>
            <p className="text-xs text-dark-500 font-poppins mt-2">
              Please enter your details to sign into your account portal.
            </p>
          </div>

          {/* Role selector tab bars */}
          <div className="grid grid-cols-2 gap-2 mb-8 bg-dark-900/5 p-1 rounded-2xl border border-[#E5E7EB]">
            <button
              onClick={() => {
                setRole('student');
                setErrorMsg('');
              }}
              className={`py-2 text-xs font-bold font-sora rounded-xl transition-all ${
                role === 'student'
                  ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-md'
                  : 'text-dark-600 hover:text-dark-900'
              }`}
            >
              STUDENT
            </button>
            <button
              onClick={() => {
                setRole('admin');
                setErrorMsg('');
              }}
              className={`py-2 text-xs font-bold font-sora rounded-xl transition-all ${
                role === 'admin'
                  ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-md'
                  : 'text-dark-600 hover:text-dark-900'
              }`}
            >
              ADMIN
            </button>
          </div>

          {/* Sub role filters (Internal vs External) */}
          {role === 'student' && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                type="button"
                onClick={() => setSubRole('student_internal')}
                className={`py-2 px-3 border rounded-xl text-[10px] font-extrabold font-sora uppercase transition-all ${
                  subRole === 'student_internal'
                    ? 'border-primary-500 bg-primary-500/10 text-primary-600'
                    : 'border-[#E5E7EB] bg-transparent text-dark-500 hover:text-dark-900 hover:border-dark-300'
                }`}
              >
                Our Student
              </button>
              <button
                type="button"
                onClick={() => setSubRole('student_external')}
                className={`py-2 px-3 border rounded-xl text-[10px] font-extrabold font-sora uppercase transition-all ${
                  subRole === 'student_external'
                    ? 'border-primary-500 bg-primary-500/10 text-primary-600'
                    : 'border-[#E5E7EB] bg-transparent text-dark-500 hover:text-dark-900 hover:border-dark-300'
                }`}
              >
                Other Student
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 p-3.5 mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
              <FiAlertCircle className="flex-shrink-0 text-base" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
            <Input
              label={role === 'student' && subRole === 'student_internal' ? 'Official College Email' : role === 'admin' ? 'Admin Email' : 'Email Address'}
              name="email"
              type="email"
              icon={FiMail}
              placeholder={
                role === 'student' && subRole === 'student_internal'
                  ? 'e.g. e23cs021@shanmugha.edu.in'
                  : role === 'admin'
                  ? 'Enter admin email'
                  : 'Enter your email address'
              }
              error={errors.email}
              register={register}
              validation={{
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/i,
                  message: 'Please enter a valid email address'
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
            />

            <GradientButton
              type="submit"
              variant="gradient"
              size="lg"
              loading={submitting}
              className="mt-4"
              icon={FiChevronRight}
            >
              Sign In
            </GradientButton>
          </form>




          {role === 'student' && (
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
          )}

          {role === 'admin' && (
            <div className="text-center mt-6">
              <span className="text-xs text-dark-400 font-poppins">
                Don't have an admin account?{' '}
                <button
                  onClick={() => navigate('/register')}
                  className="text-primary-400 font-bold hover:underline"
                >
                  Sign Up
                </button>
              </span>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Access Denied Modal */}
      {showAccessDenied && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 md:p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                <FiAlertCircle size={32} />
              </div>
              <h3 className="text-xl font-bold font-sora text-dark-900 mb-4">Access Denied</h3>
              <p className="text-sm text-dark-600 mb-8 font-poppins">
                This application is restricted to Shanmugha Educational Institution students only. Please sign in using your official <span className="font-bold text-dark-900">@shanmugha.edu.in</span> Google account.
              </p>
              
              <div className="flex flex-col w-full gap-3">
                <button
                  onClick={() => setShowAccessDenied(false)}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md text-sm"
                >
                  Try Another Account
                </button>
                <button
                  onClick={() => setShowAccessDenied(false)}
                  className="text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors py-2"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
