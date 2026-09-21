import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { FiDownload, FiX, FiCheckCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'motion/react';
import GradientButton from './GradientButton';
import toast from 'react-hot-toast';

export default function QRDownload({ isOpen, onClose, registration, eventTitle }) {
  const qrRef = useRef(null);

  if (!isOpen || !registration) return null;

  const handleDownloadPNG = async () => {
    if (!qrRef.current) return;
    try {
      const canvas = await html2canvas(qrRef.current, { scale: 3, backgroundColor: '#FFFFFF' });
      const link = document.createElement('a');
      link.download = `QR_${registration.usn}_${eventTitle.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('QR Code downloaded as PNG');
    } catch (error) {
      toast.error('Failed to download QR Code');
    }
  };

  const handleDownloadPDF = async () => {
    if (!qrRef.current) return;
    try {
      const canvas = await html2canvas(qrRef.current, { scale: 3, backgroundColor: '#FFFFFF' });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = 100; // 100mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const x = (pdfWidth - imgWidth) / 2;
      const y = 50;

      pdf.setFontSize(22);
      pdf.setTextColor(15, 23, 42); // dark-900
      pdf.text('Event Entry Pass', pdfWidth / 2, 30, { align: 'center' });

      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);

      pdf.setFontSize(12);
      pdf.setTextColor(71, 85, 105); // dark-600
      pdf.text(`Name: ${registration.fullName}`, pdfWidth / 2, y + imgHeight + 15, { align: 'center' });
      pdf.text(`USN: ${registration.usn}`, pdfWidth / 2, y + imgHeight + 22, { align: 'center' });
      pdf.text(`Event: ${eventTitle}`, pdfWidth / 2, y + imgHeight + 29, { align: 'center' });

      pdf.save(`Entry_Pass_${registration.usn}.pdf`);
      toast.success('QR Code downloaded as PDF');
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#0B0B0F]/80 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-sm bg-white rounded-[32px] border border-[#E5E7EB] shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-[#E5E7EB] bg-[#F8FAFC]">
            <h3 className="text-xl font-bold font-sora text-dark-900">Your Entry Pass</h3>
            <button onClick={onClose} className="text-dark-400 hover:text-dark-900 transition-colors">
              <FiX className="w-6 h-6" />
            </button>
          </div>

          {/* QR Container */}
          <div className="p-8 flex flex-col items-center bg-[#F0F9FF]">
            <div 
              ref={qrRef} 
              className="bg-white p-6 rounded-3xl shadow-lg border border-[#BAE6FD] flex flex-col items-center"
            >
              <QRCodeSVG
                value={registration.qrData || JSON.stringify({
                  registrationId: registration._id,
                  token: registration.secureToken || 'default_token'
                })}
                size={200}
                level="M"
                includeMargin={false}
                fgColor="#0F172A" // dark-900
              />
              <div className="mt-4 text-center">
                <p className="font-bold text-dark-900">{registration.fullName}</p>
                <p className="text-sm font-semibold text-primary-600">{registration.usn}</p>
              </div>
            </div>
            
            {registration.attendanceStatus === 'present' && (
              <div className="mt-4 flex items-center gap-2 text-emerald-600 font-bold bg-emerald-100 px-4 py-2 rounded-full">
                <FiCheckCircle /> Attendance Marked
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-6 bg-white flex flex-col gap-3">
            <GradientButton variant="gradient" onClick={handleDownloadPNG} icon={FiDownload} className="w-full">
              Download PNG
            </GradientButton>
            <GradientButton variant="secondary" onClick={handleDownloadPDF} icon={FiDownload} className="w-full">
              Download PDF Ticket
            </GradientButton>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
