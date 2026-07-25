import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/adminService';
import { registrationService } from '../services/registrationService';
import { paymentService } from '../services/paymentService';
import { formatDate, formatCurrency } from '../utils/helpers';
import { FiCalendar, FiClock, FiMapPin, FiAward, FiDollarSign, FiBookmark, FiInfo, FiBell, FiDownload, FiCheckCircle, FiSearch, FiFileText } from 'react-icons/fi';
import { FaQrcode } from 'react-icons/fa';
import GlassCard from '../components/ui/GlassCard';
import StatusBadge from '../components/ui/StatusBadge';
import GradientButton from '../components/ui/GradientButton';
import QRDownload from '../components/ui/QRDownload';
import MockPaymentModal from '../components/payment/MockPaymentModal';
import { generateCertificatePDF } from '../utils/certificateGenerator';
import toast from 'react-hot-toast';

export default function StudentDashboard() {
  const { user, isAuthenticated, userType } = useAuth();
  const [activeTab, setActiveTab] = useState('events'); // 'events' | 'payments' | 'certs' | 'notifications'
  const [registrations, setRegistrations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQRReg, setSelectedQRReg] = useState(null); // Registration object for QR modal
  const [selectedQREvent, setSelectedQREvent] = useState(null); // Event title
  const [selectedTicketReg, setSelectedTicketReg] = useState(null); // Registration for ticket view
  const [certNumberInput, setCertNumberInput] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Auto-refresh the dashboard every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Refresh events and data to ensure time-based status changes are reflected
      if (isAuthenticated) {
        loadDashboardData();
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [isAuthenticated, userType]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Parallel loading
      const [regData, payData, certData, notifData] = await Promise.allSettled([
        registrationService.getMyRegistrations(),
        paymentService.getPaymentHistory(),
        adminService.getMyCertificates(),
        adminService.getMyNotifications()
      ]);

      if (regData.status === 'fulfilled' && regData.value.success) {
        setRegistrations(regData.value.data || []);
      }
      if (payData.status === 'fulfilled' && payData.value.success) {
        setPayments(payData.value.data || []);
      }
      if (certData.status === 'fulfilled' && certData.value.success) {
        setCertificates(certData.value.data || []);
      }
      if (notifData.status === 'fulfilled' && notifData.value.success) {
        setNotifications(notifData.value.data || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
      case 'completed':
      case 'present':
      case 'issued':
      case 'released':
      case 'generated':
        return 'emerald';
      case 'pending':
        return 'amber';
      case 'rejected':
      case 'failed':
      case 'absent':
      case 'not_eligible':
        return 'rose';
      default:
        return 'slate';
    }
  };

  const handleDownloadCertificateByReg = async (reg) => {
    const cert = certificates.find(c => c.registrationId === reg._id || c.certificateNumber === reg.certificateNumber);
    if (cert) {
      downloadCertificate(cert);
    } else {
      const tempCert = {
        certificateNumber: reg.certificateNumber,
        studentId: { name: reg.fullName || user?.name, collegeName: reg.collegeName },
        eventId: reg.eventId ? {
          _id: reg.eventId._id || reg.eventId,
          title: reg.eventId.title || 'Unknown Event',
          date: reg.eventId.date || Date.now(),
          organizer: reg.eventId.organizer || '',
          coordinators: reg.eventId.coordinators || []
        } : { title: 'Unknown Event', date: Date.now() },
        verificationCode: reg.secureToken || 'VERIFY-MOCK'
      };
      downloadCertificate(tempCert);
    }
  };

  const downloadReceipt = (payment) => {
    toast.success('Downloading receipt for ' + (payment.razorpayPaymentId || payment.transactionId || 'Payment'));
  };

  const downloadCertificate = async (certificate) => {
    toast.success('Generating certificate PDF...');
    try {
      await generateCertificatePDF(certificate);
      toast.success('Certificate downloaded successfully!');
    } catch (err) {
      toast.error('Failed to generate certificate');
    }
  };

  const handleVerifyAndDownloadCert = async (e) => {
    e.preventDefault();
    const query = certNumberInput.trim().toLowerCase();
    if (!query) {
      toast.error('Please enter a certificate number');
      return;
    }

    const matchedCert = certificates.find(
      c => c.certificateNumber.toLowerCase() === query
    );

    if (matchedCert) {
      downloadCertificate(matchedCert);
      return;
    }

    // Check registrations for locked state
    const matchedReg = registrations.find(
      r => r.certificateNumber && r.certificateNumber.toLowerCase() === query
    );

    if (matchedReg) {
      if (matchedReg.certificateStatus !== 'released') {
        toast.error(
          'Your certificate is not available yet. Please wait until the event has been completed and certificates have been released.',
          { duration: 6000 }
        );
      } else {
        toast.error('Certificate details mismatch. Please contact admin support.');
      }
    } else {
      toast.error('Invalid Certificate Number. Please check and try again.');
    }
  };

  const handleMarkNotificationRead = async (id) => {
    try {
      await adminService.markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => (n._id === id || n.id === id) ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      console.warn('Failed to mark notification read in backend:', err.message);
      setNotifications(prev =>
        prev.map(n => (n._id === id || n.id === id) ? { ...n, isRead: true } : n)
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-sora text-dark-900 tracking-tight">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-500">{user?.name?.split(' ')[0]}</span>! 👋
          </h1>
          <p className="mt-2 text-dark-600 text-lg">Here's an overview of your college events journey.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
        {['events', 'payments', 'certs', 'notifications'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                : 'bg-white text-dark-600 hover:bg-dark-50 border border-[#E5E7EB]'
            }`}
          >
            {tab === 'events' ? 'My Events' : tab === 'payments' ? 'Payment History' : tab === 'certs' ? 'My Certificates' : 'Notifications'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'events' && (
            <div className="space-y-6">
              {registrations.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[32px] border border-[#E5E7EB] shadow-sm">
                  <FiCalendar className="w-16 h-16 text-dark-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-dark-900 mb-2">No Registered Events</h3>
                  <p className="text-dark-500 mb-6">You haven't registered for any events yet.</p>
                  <GradientButton variant="gradient" onClick={() => window.location.href='/events'}>
                    Explore Events
                  </GradientButton>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {registrations.map((reg) => (
                    <GlassCard key={reg._id} variant="light" className="relative p-6">
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Event Date Block */}
                        <div className="hidden md:flex flex-col items-center justify-center bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl w-24 h-24 shrink-0 shadow-sm">
                          <span className="text-sm font-bold text-dark-500 uppercase tracking-wider">
                            {reg.eventId?.date ? new Date(reg.eventId.date).toLocaleString('default', { month: 'short' }) : 'N/A'}
                          </span>
                          <span className="text-3xl font-black font-sora text-primary-600 leading-none my-1">
                            {reg.eventId?.date ? new Date(reg.eventId.date).getDate() : '-'}
                          </span>
                        </div>

                        {/* Event Details */}
                        <div className="flex-1 space-y-4">
                          <div>
                            <h3 className="text-xl font-bold font-sora text-dark-900 line-clamp-1">{reg.eventId?.title || 'Deleted Event'}</h3>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-dark-600 font-medium">
                              <span className="flex items-center gap-1.5"><FiMapPin className="text-primary-500" /> {reg.eventId?.venue || 'N/A'}</span>
                              <span className="flex items-center gap-1.5"><FiClock className="text-primary-500" /> {reg.eventId?.time || 'N/A'}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-[#F8FAFC] p-2 rounded-xl border border-[#E5E7EB]">
                              <p className="text-dark-500 text-[10px] font-semibold mb-1">Registration</p>
                              <StatusBadge status={reg.status} variant={getStatusColor(reg.status)} />
                            </div>
                            <div className="bg-[#F8FAFC] p-2 rounded-xl border border-[#E5E7EB]">
                              <p className="text-dark-500 text-[10px] font-semibold mb-1">Payment</p>
                              <StatusBadge status={reg.paymentStatus} variant={getStatusColor(reg.paymentStatus)} />
                            </div>
                            <div className="bg-[#F8FAFC] p-2 rounded-xl border border-[#E5E7EB]">
                              <p className="text-dark-500 text-[10px] font-semibold mb-1">Attendance</p>
                              <StatusBadge status={reg.attendanceStatus} variant={getStatusColor(reg.attendanceStatus)} />
                            </div>
                             <div className="bg-[#F8FAFC] p-2 rounded-xl border border-[#E5E7EB]">
                              <p className="text-dark-500 text-[10px] font-semibold mb-1">Certificate</p>
                              <StatusBadge 
                                status={['released', 'generated'].includes(reg.certificateStatus) ? 'Generated' : 'Pending'} 
                                variant={getStatusColor(reg.certificateStatus)} 
                              />
                            </div>
                          </div>

                          {/* Extra info cards */}
                          <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-3 text-xs space-y-2">
                            <div className="flex justify-between">
                              <span className="text-dark-500 font-bold uppercase tracking-wider text-[9px]">Registration ID</span>
                              <span className="font-semibold text-dark-900 font-mono text-[10px]">{reg._id}</span>
                            </div>
                            {['released', 'generated'].includes(reg.certificateStatus) && (
                              <div className="flex justify-between mt-2 pt-2 border-t border-[#E5E7EB]">
                                <span className="text-dark-500 font-bold uppercase tracking-wider text-[9px]">Certificate Number</span>
                                <span className="font-bold text-primary-600 font-mono text-[10px]">{reg.certificateNumber}</span>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-3 pt-2">
                            {reg.paymentStatus === 'completed' || reg.paymentStatus === 'not_required' ? (
                              <div className="flex gap-2 w-full">
                                {reg.attendanceStatus === 'present' ? (
                                  <>
                                    <GradientButton 
                                      variant="outline" 
                                      className="flex-1 text-xs" 
                                      icon={FiFileText}
                                      onClick={() => setSelectedTicketReg(reg)}
                                    >
                                      Ticket Pass
                                    </GradientButton>
                                    {reg.certificateStatus === 'released' && (
                                      <GradientButton 
                                        variant="gradient" 
                                        className="flex-1 text-xs" 
                                        icon={FiDownload}
                                        onClick={() => handleDownloadCertificateByReg(reg)}
                                      >
                                        Download Cert
                                      </GradientButton>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <GradientButton 
                                      variant="outline" 
                                      className="flex-1 text-xs" 
                                      icon={FaQrcode}
                                      onClick={() => {
                                        setSelectedQRReg(reg);
                                        setSelectedQREvent(reg.eventId.title);
                                      }}
                                    >
                                      QR Code
                                    </GradientButton>
                                    <GradientButton 
                                      variant="gradient" 
                                      className="flex-1 text-xs" 
                                      icon={FiFileText}
                                      onClick={() => setSelectedTicketReg(reg)}
                                    >
                                      Ticket Pass
                                    </GradientButton>
                                  </>
                                )}
                              </div>
                            ) : (
                              <GradientButton 
                                variant="gradient" 
                                className="w-full"
                                onClick={() => window.location.href=`/events/${reg.eventId._id}`} // Let them retry payment
                              >
                                Complete Payment
                              </GradientButton>
                            )}
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="bg-white rounded-[32px] border border-[#E5E7EB] shadow-sm overflow-hidden">
              <div className="p-6 border-b border-[#E5E7EB] bg-[#F8FAFC]">
                <h3 className="text-lg font-bold font-sora text-dark-900">Payment History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-dark-50 text-dark-500 text-sm uppercase tracking-wider font-bold">
                      <th className="p-4 pl-6 border-b border-[#E5E7EB]">Event</th>
                      <th className="p-4 border-b border-[#E5E7EB]">Amount</th>
                      <th className="p-4 border-b border-[#E5E7EB]">Date</th>
                      <th className="p-4 border-b border-[#E5E7EB]">Transaction ID</th>
                      <th className="p-4 border-b border-[#E5E7EB]">Status</th>
                      <th className="p-4 pr-6 border-b border-[#E5E7EB]">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-dark-500">No payments found.</td>
                      </tr>
                    ) : (
                      payments.map((payment) => (
                        <tr key={payment._id} className="hover:bg-dark-50/50 transition-colors">
                          <td className="p-4 pl-6 font-semibold text-dark-900 border-b border-[#E5E7EB]">{payment.eventId.title}</td>
                          <td className="p-4 font-bold text-dark-900 border-b border-[#E5E7EB]">{formatCurrency(payment.amount)}</td>
                          <td className="p-4 text-dark-600 border-b border-[#E5E7EB]">{formatDate(payment.paidAt || payment.createdAt)}</td>
                          <td className="p-4 text-dark-500 font-mono text-sm border-b border-[#E5E7EB]">{payment.razorpayPaymentId || '-'}</td>
                          <td className="p-4 border-b border-[#E5E7EB]"><StatusBadge status={payment.status} variant={getStatusColor(payment.status)} /></td>
                          <td className="p-4 pr-6 border-b border-[#E5E7EB]">
                            {payment.status === 'completed' && (
                              <button onClick={() => downloadReceipt(payment)} className="text-primary-600 hover:text-primary-700 font-semibold text-sm flex items-center gap-1">
                                <FiDownload /> Receipt
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'certs' && (
            <div className="space-y-8">
              {/* Certificate Verification Form */}
              <GlassCard variant="light" className="p-6 max-w-xl mx-auto border border-[#E5E7EB]">
                <h3 className="text-lg font-bold font-sora text-dark-900 mb-2 flex items-center gap-2">
                  <FiAward className="text-primary-500" /> Verify & Download Certificate
                </h3>
                <p className="text-xs text-dark-600 mb-6">Enter your Certificate Number (e.g., CERT-2026-000001) to validate and generate your official certificate pass.</p>
                
                <form onSubmit={handleVerifyAndDownloadCert} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={certNumberInput}
                    onChange={(e) => setCertNumberInput(e.target.value)}
                    placeholder="Enter Certificate Number (CERT-2026-...)"
                    className="flex-1 px-4 py-2.5 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm bg-white"
                  />
                  <GradientButton variant="gradient" type="submit" icon={FiDownload}>
                    Verify & Download
                  </GradientButton>
                </form>
              </GlassCard>

              {/* Certificates list */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {registrations.length === 0 ? (
                  <div className="col-span-full text-center py-20 bg-white rounded-[32px] border border-[#E5E7EB] shadow-sm">
                    <FiAward className="w-16 h-16 text-dark-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-dark-900 mb-2">No Registered Events</h3>
                    <p className="text-dark-500">You haven't registered for any events yet.</p>
                  </div>
                ) : (
                  registrations.map((reg) => {
                    const matchedCert = certificates.find(c => {
                      const cEventId = c.eventId?._id?.toString() || c.eventId?.toString();
                      const rEventId = reg.eventId?._id?.toString() || reg.eventId?.toString();
                      return cEventId === rEventId;
                    });
                    
                    const eventTitle = reg.eventId?.title || 'Unknown Event';
                    const isPresent = reg.attendanceStatus === 'present';
                    const hasCert = !!matchedCert || ['released', 'generated'].includes(reg.certificateStatus);
                    
                    // Construct a cert object if matchedCert is not present but certificateNumber exists on registration
                    const displayCert = matchedCert || (hasCert ? {
                      certificateNumber: reg.certificateNumber,
                      studentId: { name: reg.fullName || user?.name, collegeName: reg.collegeName },
                      eventId: reg.eventId ? {
                        _id: reg.eventId._id || reg.eventId,
                        title: reg.eventId.title || 'Unknown Event',
                        date: reg.eventId.date || Date.now(),
                        organizer: reg.eventId.organizer || '',
                        coordinators: reg.eventId.coordinators || []
                      } : { title: 'Unknown Event', date: Date.now() },
                      verificationCode: reg.secureToken || 'VERIFY-MOCK',
                      issuedAt: reg.updatedAt
                    } : null);

                    return (
                      <GlassCard key={reg._id} variant="light" className="flex flex-col h-full border border-[#E5E7EB] justify-between">
                        {displayCert ? (
                          <>
                            <div className="h-32 bg-gradient-to-br from-emerald-600 to-teal-500 rounded-t-3xl relative overflow-hidden flex flex-col items-center justify-center p-6 text-center">
                              <FiCheckCircle className="w-10 h-10 text-white mb-1.5 animate-pulse" />
                              <h4 className="text-white font-sora font-bold text-base leading-tight line-clamp-2">✅ {eventTitle}</h4>
                            </div>
                            <div className="p-6 flex-1 flex flex-col justify-between">
                              <div className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-dark-500 font-bold uppercase tracking-wider text-[9px]">Issued Date</span>
                                  <span className="font-bold text-dark-900">{formatDate(displayCert.issuedAt || displayCert.generatedAt || displayCert.createdAt || Date.now())}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-dark-500 font-bold uppercase tracking-wider text-[9px]">Cert No.</span>
                                  <span className="font-mono font-bold text-dark-950">{displayCert.certificateNumber}</span>
                                </div>
                              </div>
                              <GradientButton 
                                variant="gradient" 
                                className="w-full mt-4" 
                                icon={FiDownload}
                                onClick={() => downloadCertificate(displayCert)}
                              >
                                Download PDF
                              </GradientButton>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="h-32 bg-gradient-to-br from-rose-50 to-rose-100 rounded-t-3xl relative overflow-hidden flex flex-col items-center justify-center p-6 text-center border-b border-rose-150">
                              <FiXCircle className="w-10 h-10 text-rose-500 mb-1.5" />
                              <h4 className="text-rose-900 font-sora font-bold text-base leading-tight line-clamp-2">❌ {eventTitle}</h4>
                            </div>
                            <div className="p-6 flex-1 flex flex-col justify-center items-center text-center">
                              <p className="text-xs text-rose-600 font-bold bg-rose-50 px-3 py-1.5 rounded-full border border-rose-200">
                                Attendance not marked / Certificate unavailable
                              </p>
                            </div>
                          </>
                        )}
                      </GlassCard>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white rounded-[32px] border border-[#E5E7EB] shadow-sm overflow-hidden max-w-3xl mx-auto">
              <div className="p-6 border-b border-[#E5E7EB] bg-[#F8FAFC] flex justify-between items-center">
                <h3 className="text-lg font-bold font-sora text-dark-900 flex items-center gap-2">
                  <FiBell className="text-primary-500" /> Notifications Feed
                </h3>
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <button 
                    onClick={() => {
                      notifications.forEach(n => {
                        if (!n.isRead) handleMarkNotificationRead(n._id || n.id);
                      });
                      toast.success('Marked all as read');
                    }}
                    className="text-xs text-primary-600 hover:text-primary-700 font-bold"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="divide-y divide-[#E5E7EB]">
                {notifications.length === 0 ? (
                  <div className="p-12 text-center text-dark-500">
                    <FiBell className="w-12 h-12 text-dark-300 mx-auto mb-2" />
                    <p>No notifications yet.</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif._id || notif.id}
                      onClick={() => !notif.isRead && handleMarkNotificationRead(notif._id || notif.id)}
                      className={`p-5 transition-all flex gap-4 items-start cursor-pointer hover:bg-dark-50/30 ${
                        notif.isRead ? 'opacity-60 bg-white' : 'bg-primary-500/5 font-semibold'
                      }`}
                    >
                      <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                        notif.isRead ? 'bg-dark-100 text-dark-500' : 'bg-primary-100 text-primary-600'
                      }`}>
                        {notif.type === 'certificate' ? <FiAward /> : notif.type === 'payment' ? <FiDollarSign /> : <FiInfo />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center gap-2">
                          <h4 className="text-sm font-bold text-dark-900 leading-tight">{notif.title}</h4>
                          <span className="text-[10px] text-dark-400 font-bold shrink-0">{formatDate(notif.createdAt)}</span>
                        </div>
                        <p className="text-xs text-dark-600 mt-1 leading-normal">{notif.message}</p>
                      </div>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-1.5 animate-pulse" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <QRDownload 
        isOpen={!!selectedQRReg}
        onClose={() => setSelectedQRReg(null)}
        registration={selectedQRReg}
        eventTitle={selectedQREvent}
      />

      <MockPaymentModal
        isOpen={!!selectedTicketReg}
        onClose={() => setSelectedTicketReg(null)}
        amount={0}
        eventTitle={selectedTicketReg?.eventId?.title}
        registrationId={selectedTicketReg?._id}
        studentName={selectedTicketReg?.fullName}
        usn={selectedTicketReg?.usn}
        department={selectedTicketReg?.department}
        collegeName={selectedTicketReg?.collegeName}
        eventDate={selectedTicketReg?.eventId?.date}
        eventVenue={selectedTicketReg?.eventId?.venue}
        eventTime={selectedTicketReg?.eventId?.time}
        eventPoster={selectedTicketReg?.eventId?.poster}
        viewTicket={true}
        certificateNumber={selectedTicketReg?.certificateNumber}
        secureToken={selectedTicketReg?.secureToken}
        paidAt={new Date(selectedTicketReg?.createdAt).toLocaleString()}
        onSuccess={() => setSelectedTicketReg(null)}
      />
    </div>
  );
}
