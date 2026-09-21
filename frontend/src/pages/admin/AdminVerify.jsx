import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import GlassCard from '../../components/ui/GlassCard';
import GradientButton from '../../components/ui/GradientButton';
import { FiCheck, FiMail } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

export default function AdminVerify() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { verifyOTP } = useAuth();

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Email is required');
    if (otp.length !== 6) return toast.error('OTP must be 6 digits');

    setSubmitting(true);
    try {
      const success = await verifyOTP(email, otp, 'admin');
      if (success) {
        navigate('/admin/dashboard');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email) return toast.error('Please enter your email first');
    try {
      await api.post('/auth/resend-otp', { email, type: 'admin' });
      toast.success('OTP resent to your email');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-50 px-6 py-12 relative overflow-hidden">
      <div className="absolute top-20 left-20 w-80 h-80 bg-primary-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-secondary-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-md z-10">
        <GlassCard className="p-8 md:p-10 border border-[#E5E7EB] shadow-xl bg-white/80">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black font-sora text-dark-900">Admin Verification</h2>
            <p className="text-dark-600 mt-2 text-sm">Verify your admin account using the OTP sent to your email.</p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-dark-900 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-dark-400">
                  <FiMail />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full pl-10 pr-4 py-3 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-dark-900 mb-2">6-Digit OTP</label>
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
              disabled={otp.length !== 6 || !email}
            >
              Verify & Login
            </GradientButton>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={handleResend}
                className="text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors"
              >
                Resend OTP
              </button>
            </div>
            
            <div className="text-center mt-2 border-t pt-4">
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="text-sm text-dark-600 hover:text-dark-900 transition-colors"
              >
                Back to Login
              </button>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
