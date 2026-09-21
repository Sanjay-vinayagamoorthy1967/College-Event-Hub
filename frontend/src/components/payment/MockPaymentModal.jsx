import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FiX, FiCheckCircle, FiShield, FiSmartphone, FiDownload, FiInfo, FiCalendar, FiMapPin, FiClock } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { paymentService } from '../../services/paymentService';
import GradientButton from '../ui/GradientButton';

export default function MockPaymentModal({
  isOpen,
  onClose,
  amount,
  eventId,
  registrationData,
  eventTitle,
  studentName,
  usn,
  department,
  collegeName,
  eventDate,
  eventVenue,
  eventTime,
  eventPoster,
  onSuccess,
  onFailure,
  viewTicket = false,
  certificateNumber = '',
  secureToken = '',
  paidAt = ''
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(viewTicket);
  const [ticketInfo, setTicketInfo] = useState(viewTicket ? {
    certificateNumber,
    secureToken,
    fullName: studentName,
    usn,
    department,
    collegeName,
    paidAt: paidAt || new Date().toLocaleString()
  } : null);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isProcessing || paymentSuccess) return;
    toast.error('Payment cancelled. Registration was not completed.', { duration: 4000 });
    onClose();
  };

  const simulatePayment = () => {
    setIsProcessing(true);
    
    // Simulate opening the UPI app and processing payment for 5 seconds
    setTimeout(async () => {
      try {
        // 1. Call createOrder to generate a pending Payment record in the backend
        const orderData = await paymentService.createOrder(eventId, amount);
        if (!orderData.success) throw new Error('Order creation failed');
        
        const mockOrderId = orderData.data.order.id;
        const mockPaymentId = `mock_pay_${Date.now()}`;
        
        // 2. Call verification endpoint
        const verificationData = await paymentService.verifyPayment({
          razorpay_order_id: mockOrderId,
          razorpay_payment_id: mockPaymentId,
          razorpay_signature: 'mock_signature',
          registrationData
        });

        if (verificationData.success) {
          setTicketInfo({
            ...verificationData.registration,
            transactionId: mockPaymentId,
            paidAt: new Date(verificationData.registration.createdAt || Date.now()).toLocaleString()
          });
          setPaymentSuccess(true);
          toast.success('Payment verified successfully!');
        } else {
          throw new Error('Verification failed');
        }
      } catch (err) {
        console.error(err);
        setIsProcessing(false);
        toast.error('Payment failed. Please try again.', { duration: 4000 });
        if (onFailure) onFailure('Payment processing error');
      }
    }, 5000); // 5 seconds wait as requested
  };

  const downloadTicketPDF = async () => {
    const element = document.getElementById('ticket-pass');
    if (!element) return;
    setIsDownloading(true);
    toast.success('Generating ticket PDF...');
    try {
      const canvas = await html2canvas(element, {
        scale: 2, // high quality
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`Ticket_${eventTitle.replace(/\s+/g, '_')}.pdf`);
      toast.success('Ticket downloaded successfully!');
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate ticket PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const upiQrPath = import.meta.env.VITE_UPI_QR_PATH || '/upi_qr.png';
  const upiNumber = import.meta.env.VITE_UPI_NUMBER || '9786369744';
  const upiId = import.meta.env.VITE_UPI_ID || 'sanjay.v2382005@okicici';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-[#0B0B0F]/90 backdrop-blur-md"
        />

        {/* Modal Wrapper for scrolling support */}
        <div className="relative w-full max-w-4xl my-auto z-10">
          {paymentSuccess ? (
            /* Ticket Success Screen */
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white/95 rounded-[32px] border border-[#E5E7EB] shadow-2xl p-6 md:p-8 flex flex-col items-center"
            >
              {/* Confetti Check Success */}
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <FiCheckCircle className="w-9 h-9 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-black font-sora text-dark-900 mb-1">Registration Confirmed!</h2>
              <p className="text-sm text-dark-600 mb-6">Your payment was processed successfully. Here is your event pass.</p>

              {/* The Ticket Pass Container */}
              <div 
                id="ticket-pass"
                className="w-full max-w-lg bg-white rounded-3xl border border-[#E5E7EB] shadow-xl overflow-hidden p-6 text-dark-900 flex flex-col font-poppins relative"
                style={{ width: '450px' }} // Fixed width to ensure consistent PDF output
              >
                {/* Dotted separator style */}
                <div className="absolute left-0 right-0 top-[110px] border-b-2 border-dashed border-[#E5E7EB]"></div>
                
                {/* Top Section: College Branding */}
                <div className="flex items-center justify-between pb-6 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-500 to-secondary-500 flex items-center justify-center text-white font-extrabold text-sm font-sora shadow-sm">
                      CE
                    </div>
                    <span className="font-extrabold font-sora text-sm tracking-wider text-dark-950">COLLEGE EVENT HUB</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-200">
                    Paid Pass
                  </span>
                </div>

                {/* Gap for separator */}
                <div className="h-6"></div>

                {/* Middle Section: Event Info & Banner */}
                <div className="flex gap-4 items-start mb-6">
                  {eventPoster && (
                    <img 
                      src={eventPoster} 
                      alt={eventTitle} 
                      className="w-20 h-20 rounded-xl object-cover border border-[#E5E7EB]" 
                      onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(eventTitle)}&background=random&size=200`; }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-black font-sora text-dark-950 truncate leading-snug">{eventTitle}</h3>
                    <div className="flex flex-col gap-1 mt-1.5 text-xs text-dark-600 font-medium">
                      <span className="flex items-center gap-1"><FiCalendar className="text-primary-500 shrink-0" /> {formatDate(eventDate)}</span>
                      <span className="flex items-center gap-1"><FiMapPin className="text-primary-500 shrink-0" /> {eventVenue}</span>
                    </div>
                  </div>
                </div>

                {/* Student details grid */}
                <div className="grid grid-cols-2 gap-y-4 gap-x-2 border-t border-b border-[#F1F5F9] py-4 mb-6 text-xs bg-[#F8FAFC]/50 rounded-2xl px-4">
                  <div>
                    <p className="text-dark-500 font-bold uppercase tracking-wider text-[9px] mb-0.5">Student Name</p>
                    <p className="font-bold text-dark-900 truncate">{ticketInfo?.fullName || studentName}</p>
                  </div>
                  <div>
                    <p className="text-dark-500 font-bold uppercase tracking-wider text-[9px] mb-0.5">USN / ID</p>
                    <p className="font-bold text-dark-900 truncate">{ticketInfo?.usn || usn}</p>
                  </div>
                  <div>
                    <p className="text-dark-500 font-bold uppercase tracking-wider text-[9px] mb-0.5">Department</p>
                    <p className="font-bold text-dark-900 truncate">{ticketInfo?.department || department}</p>
                  </div>
                  <div>
                    <p className="text-dark-500 font-bold uppercase tracking-wider text-[9px] mb-0.5">College</p>
                    <p className="font-bold text-dark-900 truncate">{ticketInfo?.collegeName || collegeName}</p>
                  </div>
                </div>

                {/* Ticket Details & QR */}
                <div className="flex items-center gap-6">
                  {/* Left stats */}
                  <div className="flex-1 space-y-3.5 text-xs">
                    <div>
                      <p className="text-dark-500 font-bold uppercase tracking-wider text-[9px] mb-0.5">Registration ID</p>
                      <p className="font-mono text-dark-900 font-semibold">{ticketInfo?.registrationId || 'Pending'}</p>
                    </div>

                    <div>
                      <p className="text-dark-500 font-bold uppercase tracking-wider text-[9px] mb-0.5">Date & Time</p>
                      <p className="text-dark-950 font-bold">{ticketInfo?.paidAt || 'Not Available'}</p>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="bg-white p-2 rounded-2xl border border-[#E5E7EB] shrink-0">
                    <QRCodeSVG 
                      value={ticketInfo?.secureToken && ticketInfo?.registrationId ? JSON.stringify({ registrationId: ticketInfo.registrationId, token: ticketInfo.secureToken }) : 'Pending'}
                      size={100}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-lg mt-8">
                <GradientButton
                  variant="outline"
                  className="flex-1 py-3"
                  icon={FiDownload}
                  onClick={downloadTicketPDF}
                  loading={isDownloading}
                >
                  Download Ticket
                </GradientButton>
                <GradientButton
                  variant="gradient"
                  className="flex-1 py-3"
                  onClick={onSuccess}
                >
                  Go to Dashboard
                </GradientButton>
              </div>
            </motion.div>
          ) : (
            /* UPI Payment Checkout screen */
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] border border-[#E5E7EB] shadow-2xl overflow-hidden flex flex-col md:flex-row"
            >
              {/* Left Column: QR Scan & UPI details */}
              <div className="w-full md:w-5/12 bg-[#F8FAFC] border-b md:border-b-0 md:border-r border-[#E5E7EB] p-8 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                
                <div className="text-center relative z-10 w-full flex flex-col items-center">
                  <h3 className="text-xs font-bold text-dark-500 uppercase tracking-widest mb-1 font-sora">UPI QR Pay</h3>
                  <p className="text-lg font-bold text-dark-900 mb-6 truncate max-w-xs">{eventTitle}</p>
                  
                  <div className="bg-white p-4 rounded-3xl shadow-sm border border-[#E5E7EB] inline-block mb-6 relative group">
                    <div className="absolute inset-0 bg-primary-500/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all"></div>
                    <img 
                      src={upiQrPath} 
                      alt="UPI QR Code" 
                      className="w-48 h-48 rounded-xl relative z-10 object-contain"
                      onError={(e) => {
                        // Fallback API if custom QR is missing
                        e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=${upiId}&pn=Sanjay&am=${amount}&cu=INR`;
                      }}
                    />
                  </div>
                  
                  <p className="text-sm font-semibold text-dark-900 mb-0.5">UPI ID: {upiId}</p>
                  <p className="text-xs font-semibold text-dark-600 mb-4">UPI Number: {upiNumber}</p>
                  
                  <p className="text-[10px] font-bold text-dark-600 mb-1">Scan QR using any UPI app (GPay, PhonePe, Paytm)</p>
                  <div className="flex items-center justify-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                    <FiShield /> SECURE CHECKOUT
                  </div>
                </div>
              </div>

              {/* Right Column: Billing Info & Checkout Action */}
              <div className="w-full md:w-7/12 p-8 flex flex-col bg-white">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary-500">Checkout Bill</span>
                    <h3 className="text-2xl font-black font-sora text-dark-900 mt-0.5">Billing Summary</h3>
                  </div>
                  {!isProcessing && !paymentSuccess && (
                    <button
                      onClick={handleClose}
                      className="p-2 rounded-full hover:bg-dark-50 text-dark-400 hover:text-dark-900 transition-colors border border-[#E5E7EB]"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {isProcessing ? (
                  /* Processing state */
                  <div className="flex-1 flex flex-col items-center justify-center py-16">
                    <div className="relative w-20 h-20 mb-6">
                      <div className="absolute inset-0 border-4 border-dark-100 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-primary-500 rounded-full border-t-transparent animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <FiSmartphone className="text-2xl text-primary-500 animate-pulse" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold font-sora text-dark-900 mb-2">Verifying Payment...</h3>
                    <p className="text-dark-600 text-sm text-center">We are checking with your bank. This usually takes around 5 seconds. Please do not close this window.</p>
                  </div>
                ) : (
                  /* Billing Info form */
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="space-y-4">
                      {/* Fields display */}
                      <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-4 space-y-3.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-dark-500 font-bold uppercase tracking-wider text-[10px]">Student Name</span>
                          <span className="font-bold text-dark-900">{studentName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-dark-500 font-bold uppercase tracking-wider text-[10px]">USN / Student ID</span>
                          <span className="font-bold text-dark-900 font-mono">{usn}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-dark-500 font-bold uppercase tracking-wider text-[10px]">Department</span>
                          <span className="font-bold text-dark-900">{department}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-dark-500 font-bold uppercase tracking-wider text-[10px]">Event Name</span>
                          <span className="font-bold text-dark-900 truncate max-w-[200px]">{eventTitle}</span>
                        </div>
                      </div>

                      {/* Fee highlight */}
                      <div className="border border-primary-500/20 bg-gradient-to-r from-primary-500/5 to-secondary-500/5 rounded-2xl p-4 flex justify-between items-center">
                        <div>
                          <p className="text-xs font-bold text-dark-600">Total Event Fee</p>
                          <p className="text-xs text-dark-400 mt-0.5">Tax and service charges included</p>
                        </div>
                        <span className="text-3xl font-black font-sora text-dark-900">{formatCurrency(amount)}</span>
                      </div>
                    </div>

                    <div className="pt-6">
                      <GradientButton
                        variant="gradient"
                        className="w-full py-4 text-base tracking-wide"
                        onClick={simulatePayment}
                      >
                        I Have Paid - Confirm Payment
                      </GradientButton>
                      <p className="text-center text-[10px] text-dark-400 mt-3 flex items-center justify-center gap-1">
                        <FiInfo /> After making the payment via QR, click the confirm button to verify.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </AnimatePresence>
  );
}
