import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiSearch, FiAward, FiDownload, FiCheckCircle, FiAlertTriangle, FiEye, FiImage, FiGrid, FiArrowUpRight, FiX } from 'react-icons/fi';
import { adminService } from '../services/adminService';
import { registrationService } from '../services/registrationService';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/helpers';
import GlassCard from '../components/ui/GlassCard';
import GradientButton from '../components/ui/GradientButton';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';
import { generateCertificatePDF, generateCertificateImage, drawCertificateToCanvas } from '../utils/certificateGenerator';

export default function Certificates() {
  const { isAuthenticated, user } = useAuth();
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [searching, setSearching] = useState(false);
  
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewCert, setPreviewCert] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [scale, setScale] = useState(0.6);
  const modalContainerRef = useRef(null);

  useEffect(() => {
    const codeParam = searchParams.get('code');
    if (codeParam) {
      setCode(codeParam);
      handleVerify(codeParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated) {
      loadGalleryData();
    }
  }, [isAuthenticated]);

  // Adjust preview modal scale based on screen size
  useEffect(() => {
    if (previewCert) {
      const handleResize = () => {
        if (modalContainerRef.current) {
          const containerWidth = modalContainerRef.current.clientWidth;
          const calculatedScale = Math.min(1, (containerWidth - 32) / 1123);
          setScale(calculatedScale);
        }
      };
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [previewCert]);

  const loadGalleryData = async () => {
    setLoading(true);
    try {
      // Fetch registrations and released certificates in parallel
      const [regsRes, certsRes] = await Promise.all([
        registrationService.getMyRegistrations(),
        adminService.getMyCertificates()
      ]);

      const registrations = regsRes.data || [];
      const certificates = certsRes.data || [];

      // Filter to approved registrations (representing participation)
      const participatedRegs = registrations.filter(r => r.status === 'approved');

      // Map registrations to gallery items
      const items = participatedRegs.map(reg => {
        // Find matching released certificate
        const matchedCert = certificates.find(c => c.eventId?._id === reg.eventId?._id);
        
        return {
          id: reg._id,
          registration: reg,
          certificate: matchedCert || null,
          eventName: reg.eventId?.title || 'Unknown Event',
          participantName: reg.fullName,
          status: matchedCert ? 'Generated' : 'Pending',
          issueDate: matchedCert ? matchedCert.issuedAt || matchedCert.approvedAt : reg.updatedAt,
          certificateNumber: matchedCert ? matchedCert.certificateNumber : '',
          templateUrl: reg.eventId?.certificateTemplatePath || '',
          eventId: reg.eventId?._id
        };
      });

      // Sort by issue/update date latest first
      items.sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));
      setGalleryItems(items);
    } catch (err) {
      console.warn('Failed to load gallery items:', err);
      toast.error('Failed to load certificate gallery');
      setGalleryItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (verifyCode) => {
    const targetCode = verifyCode || code;
    if (!targetCode) return;

    setSearching(true);
    setVerificationResult(null);

    try {
      const res = await adminService.verifyCertificate(targetCode);
      setVerificationResult({
        success: true,
        certificate: res.data || res.certificate
      });
      toast.success('Certificate genuineness verified!');
    } catch (err) {
      console.warn('Certificate verification failed:', err.message);
      setVerificationResult({
        success: false,
        message: 'Certificate Verification Code not found in our registry database.'
      });
      toast.error('Invalid Verification Code.');
    } finally {
      setSearching(false);
    }
  };

  const handleOpenPreview = async (item) => {
    if (!item.certificate) return;
    toast.loading('Loading preview...', { id: 'preview_loading' });
    try {
      const res = await adminService.getTemplate(item.eventId);
      if (res && res.success && res.data) {
        setPreviewTemplate(res.data);
        setPreviewCert(item.certificate);
        toast.dismiss('preview_loading');
      } else {
        throw new Error('Template layout not found');
      }
    } catch (err) {
      toast.error('Failed to load certificate preview', { id: 'preview_loading' });
    }
  };

  const triggerVerifyCard = (certNo) => {
    setCode(certNo);
    handleVerify(certNo);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownloadPDF = async (cert) => {
    try {
      await generateCertificatePDF(cert);
    } catch (err) {
      toast.error(err.message || 'Failed to download PDF');
    }
  };

  const handleDownloadImage = async (cert) => {
    try {
      await generateCertificateImage(cert);
    } catch (err) {
      toast.error(err.message || 'Failed to download image');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 relative z-10 flex flex-col gap-12">
      {/* Title */}
      <div className="text-center">
        <span className="text-xs font-bold text-secondary-500 uppercase tracking-widest font-sora mb-2 block">Verifiable Credentials</span>
        <h1 className="text-3xl md:text-5xl font-black font-sora text-dark-800">
          CERTIFICATE <span className="gradient-text">GALLERY</span>
        </h1>
        <p className="text-dark-500 text-sm md:text-base font-poppins mt-2 max-w-xl mx-auto">
          Verify public credential hashes or access, view, and claim your event participation certificates below.
        </p>
      </div>

      {/* Verification Code Search Panel */}
      <GlassCard hover={false} className="max-w-xl mx-auto w-full p-8 border-white/10 shadow-2xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify();
          }}
          className="flex flex-col gap-4"
        >
          <Input
            label="Certificate Verification Code / Number"
            name="verificationCode"
            placeholder="e.g. CERT-2026-000001"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            icon={FiSearch}
          />
          <GradientButton
            type="submit"
            variant="gradient"
            size="lg"
            loading={searching}
            disabled={!code}
          >
            Verify Credential Genuineness
          </GradientButton>
        </form>
      </GlassCard>

      {/* Verification Lookup Result Display */}
      {verificationResult && (
        <GlassCard hover={false} className={`max-w-xl mx-auto w-full p-6 border transition-all ${
          verificationResult.success ? 'border-emerald-500/30 bg-emerald-50' : 'border-red-500/30 bg-red-50'
        }`}>
          <div className="flex gap-4">
            <div className={`text-4xl ${verificationResult.success ? 'text-emerald-500' : 'text-red-500'}`}>
              {verificationResult.success ? <FiCheckCircle /> : <FiAlertTriangle />}
            </div>
            <div>
              <h4 className="font-bold text-dark-800 font-sora text-base">
                {verificationResult.success ? 'Genuineness Confirmed' : 'Verification Denied'}
              </h4>
              
              {verificationResult.success ? (
                <div className="mt-2 text-xs text-dark-600 font-poppins flex flex-col gap-1.5 leading-relaxed">
                  <p>Our official records confirm that this certificate has been issued legitimately.</p>
                  <p className="mt-2 text-dark-800 font-bold">Issued to: {verificationResult.certificate?.studentId?.name}</p>
                  <p className="text-dark-800 font-bold">Event: {verificationResult.certificate?.eventId?.title}</p>
                  <p className="text-dark-800 font-bold">Certificate Number: {verificationResult.certificate?.certificateNumber}</p>
                  <p className="text-dark-500">Date Issued: {formatDate(verificationResult.certificate?.issuedAt)}</p>
                </div>
              ) : (
                <p className="text-xs text-dark-600 font-poppins mt-2 leading-relaxed">
                  {verificationResult.message}
                </p>
              )}
            </div>
          </div>
        </GlassCard>
      )}

      {/* Certificate Gallery Listing */}
      {isAuthenticated && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 pb-2 border-b border-gray-150 dark:border-white/5">
            <FiGrid className="text-primary-500 text-xl" />
            <div>
              <h3 className="text-xl font-bold font-sora text-dark-800 dark:text-white">Your Certificate Records</h3>
              <p className="text-xs text-dark-500">Official gallery showing credentials for events you have participated in.</p>
            </div>
          </div>

          {loading ? (
            <div className="min-h-[30vh] flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : galleryItems.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-dark-900 border border-gray-150 dark:border-white/5 shadow-md rounded-3xl p-8 max-w-md mx-auto flex flex-col items-center gap-4">
              <FiAward className="text-5xl text-dark-300" />
              <div>
                <p className="text-dark-800 dark:text-white font-bold text-sm">You don't have any certificates yet.</p>
                <p className="text-dark-400 text-xs mt-1">Participate in campus events and get attendance marked to claim certificates.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {galleryItems.map((item) => (
                <GlassCard key={item.id} hover={true} className="flex flex-col justify-between border-gray-200/60 dark:border-white/5 bg-white dark:bg-dark-900 shadow-lg rounded-3xl overflow-hidden p-0">
                  
                  {/* Thumbnail Preview Area */}
                  <div className="aspect-[1.414/1] w-full bg-gray-100 dark:bg-dark-800 relative flex items-center justify-center border-b border-gray-150 dark:border-white/5 overflow-hidden group">
                    {item.templateUrl ? (
                      item.templateUrl.toLowerCase().endsWith('.pdf') ? (
                        <div className="flex flex-col items-center gap-2 p-4 text-center">
                          <FiAward className="text-5xl text-primary-500" />
                          <span className="text-xs font-semibold text-dark-700 dark:text-white">Template Loaded (PDF)</span>
                        </div>
                      ) : (
                        <img 
                          src={item.templateUrl} 
                          alt={item.eventName} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        />
                      )
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-dark-300">
                        <FiAward className="text-5xl" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">No Preview Available</span>
                      </div>
                    )}
                    
                    {/* Status Pill overlay */}
                    <div className="absolute top-4 right-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md ${
                        item.status === 'Generated' 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-amber-500 text-white animate-pulse'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 flex flex-col gap-4 flex-1">
                    <div>
                      <h4 className="text-base font-bold font-sora text-dark-900 dark:text-white line-clamp-1 leading-snug mb-1">
                        {item.eventName}
                      </h4>
                      <p className="text-xs text-dark-500 font-poppins">Recipient: <strong className="text-dark-700 dark:text-white">{item.participantName}</strong></p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-t border-gray-100 dark:border-white/5 pt-3.5 text-[11px] font-poppins">
                      <div>
                        <span className="text-dark-400 block font-semibold">Issue Date</span>
                        <span className="text-dark-700 dark:text-white font-medium">
                          {item.status === 'Generated' ? formatDate(item.issueDate) : 'Pending'}
                        </span>
                      </div>
                      <div>
                        <span className="text-dark-400 block font-semibold">Credential Code</span>
                        <span className="text-dark-700 dark:text-white font-mono truncate block">
                          {item.status === 'Generated' ? item.certificateNumber : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-6 bg-gray-50/50 dark:bg-dark-800/40 border-t border-gray-150 dark:border-white/5 flex flex-col gap-2.5">
                    {item.status === 'Generated' ? (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleOpenPreview(item)}
                            className="flex items-center justify-center gap-1.5 py-2 px-3 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-dark-800 hover:bg-gray-100 text-xs font-bold text-dark-700 dark:text-white transition-all shadow-sm"
                          >
                            <FiEye /> View
                          </button>
                          <button
                            onClick={() => triggerVerifyCard(item.certificateNumber)}
                            className="flex items-center justify-center gap-1.5 py-2 px-3 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-dark-800 hover:bg-gray-100 text-xs font-bold text-dark-700 dark:text-white transition-all shadow-sm"
                          >
                            <FiArrowUpRight /> Verify
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <GradientButton
                            variant="secondary"
                            size="sm"
                            icon={FiDownload}
                            onClick={() => handleDownloadPDF(item.certificate)}
                          >
                            PDF
                          </GradientButton>
                          <button
                            onClick={() => handleDownloadImage(item.certificate)}
                            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-secondary-500 hover:bg-secondary-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-secondary-500/10"
                          >
                            <FiImage /> Image
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[11px] uppercase tracking-wider rounded-xl">
                        Certificate Not Available Yet
                      </div>
                    )}
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Canva-style Responsive Preview Modal */}
      {previewCert && previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity duration-300">
          <div className="relative bg-white dark:bg-dark-900 w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-150 dark:border-white/5">
              <div>
                <h3 className="text-lg font-bold font-sora text-dark-900 dark:text-white">
                  Certificate Preview
                </h3>
                <p className="text-xs text-dark-500 font-mono mt-0.5">{previewCert.certificateNumber}</p>
              </div>
              <button
                onClick={() => {
                  setPreviewCert(null);
                  setPreviewTemplate(null);
                }}
                className="p-1.5 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-100 text-dark-600 dark:text-white"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            {/* Modal Body (Scrollable Container containing Scaled Canva Render) */}
            <div 
              ref={modalContainerRef}
              className="flex-1 overflow-auto p-6 bg-gray-100 dark:bg-dark-955 flex items-center justify-center min-h-[50vh]"
            >
              <div 
                className="relative bg-white shadow-2xl border border-gray-300 overflow-hidden transform origin-center transition-all flex-shrink-0"
                style={{
                  width: '1123px',
                  height: '794px',
                  backgroundImage: `url(${previewTemplate.templateUrl})`,
                  backgroundSize: '100% 100%',
                  transform: `scale(${scale})`
                }}
              >
                {/* Overlay Placeholders */}
                {(previewTemplate.placeholders || []).map((ph) => {
                  const key = ph.id || ph.name.replace(/[{}]/g, '');
                  
                  // Map resolved data
                  const resolvedVal = {
                    participant_name: previewCert.studentId?.name || '',
                    college_name: previewCert.studentId?.collegeName || 'Sri Shanmugha College',
                    department: previewCert.studentId?.department || 'CSE',
                    event_name: previewCert.eventId?.title || 'Event',
                    event_date: previewCert.eventId?.date ? new Date(previewCert.eventId.date).toLocaleDateString('en-GB') : '',
                    venue: previewCert.eventId?.venue || 'Campus',
                    position: previewCert.position || 'Winner',
                    certificate_number: previewCert.certificateNumber || 'CERT-000',
                    issue_date: previewCert.issuedAt ? new Date(previewCert.issuedAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
                    coordinator_name: previewCert.eventId?.coordinators?.[0]?.name || 'Dr. V. Samkala',
                    organization_name: previewCert.eventId?.organizer || 'SSCET',
                    qr_code: previewCert.certificateNumber || 'CERT-000'
                  }[key] || ph.name;

                  if (ph.id === 'qr_code' || ph.name === '{{qr_code}}') {
                    return (
                      <div
                        key={ph.id}
                        className="absolute flex items-center justify-center bg-white p-1 border border-gray-150"
                        style={{
                          left: `${ph.x}px`,
                          top: `${ph.y}px`,
                          width: `${ph.w}px`,
                          height: `${ph.h}px`,
                          transform: ph.rotation ? `rotate(${ph.rotation}deg)` : 'none'
                        }}
                      >
                        {/* Mock QR display inside preview */}
                        <div className="w-full h-full bg-gray-250 flex flex-col items-center justify-center p-2 text-center text-[8px] font-bold text-dark-500">
                          <span>QR CODE</span>
                          <span className="text-[6px] mt-0.5 truncate max-w-full font-mono">{previewCert.certificateNumber}</span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={ph.id}
                      className="absolute flex items-center"
                      style={{
                        left: `${ph.x}px`,
                        top: `${ph.y}px`,
                        width: `${ph.w}px`,
                        height: `${ph.h}px`,
                        fontFamily: ph.font || 'Times New Roman',
                        fontSize: `${ph.fontSize}px`,
                        color: ph.color || '#000000',
                        fontWeight: ph.bold ? 'bold' : 'normal',
                        fontStyle: ph.italic ? 'italic' : 'normal',
                        justifyContent: ph.align === 'center' ? 'center' : ph.align === 'right' ? 'flex-end' : 'flex-start',
                        textAlign: ph.align || 'left',
                        transform: ph.rotation ? `rotate(${ph.rotation}deg)` : 'none'
                      }}
                    >
                      {resolvedVal}
                    </div>
                  );
                })}

                {/* Overlay Custom Texts */}
                {(previewTemplate.customTexts || []).map((ct) => (
                  <div
                    key={ct.id}
                    className="absolute flex items-center"
                    style={{
                      left: `${ct.x}px`,
                      top: `${ct.y}px`,
                      width: `${ct.w}px`,
                      height: `${ct.h}px`,
                      fontFamily: ct.font || 'Arial',
                      fontSize: `${ct.fontSize}px`,
                      color: ct.color || '#000000',
                      fontWeight: ct.bold ? 'bold' : 'normal',
                      fontStyle: ct.italic ? 'italic' : 'normal',
                      justifyContent: ct.align === 'center' ? 'center' : ct.align === 'right' ? 'flex-end' : 'flex-start',
                      textAlign: ct.align || 'left',
                      transform: ct.rotation ? `rotate(${ct.rotation}deg)` : 'none'
                    }}
                  >
                    {ct.text}
                  </div>
                ))}

                {/* Overlay Custom Images */}
                {(previewTemplate.customImages || []).map((ci) => (
                  <div
                    key={ci.id}
                    className="absolute"
                    style={{
                      left: `${ci.x}px`,
                      top: `${ci.y}px`,
                      width: `${ci.w}px`,
                      height: `${ci.h}px`,
                      transform: ci.rotation ? `rotate(${ci.rotation}deg)` : 'none'
                    }}
                  >
                    <img src={ci.url} alt="custom decoration" className="w-full h-full object-contain" />
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-dark-800 border-t border-gray-150 dark:border-white/5 flex flex-wrap items-center justify-end gap-3">
              <button
                onClick={() => handleDownloadImage(previewCert)}
                className="flex items-center gap-1.5 px-4 py-2 bg-secondary-500 hover:bg-secondary-650 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                <FiImage /> Download Image
              </button>
              <GradientButton
                variant="gradient"
                size="md"
                icon={FiDownload}
                onClick={() => handleDownloadPDF(previewCert)}
              >
                Download PDF
              </GradientButton>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
