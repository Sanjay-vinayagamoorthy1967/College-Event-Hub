import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';
import { adminService } from '../services/adminService';

export const drawCertificateToCanvas = async (certificate, templateConfig) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1123;
  canvas.height = 794;
  const ctx = canvas.getContext('2d');

  // 1. Draw background template
  if (templateConfig && templateConfig.templateUrl) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = templateConfig.templateUrl;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
    ctx.drawImage(img, 0, 0, 1123, 794);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1123, 794);
  }

  const resolvedData = {
    participant_name: certificate.studentId?.name || '',
    college_name: certificate.studentId?.collegeName || 'Sri Shanmugha College',
    department: certificate.studentId?.department || 'CSE',
    event_name: certificate.eventId?.title || 'Event',
    event_date: certificate.eventId?.date ? new Date(certificate.eventId.date).toLocaleDateString('en-GB') : '',
    venue: certificate.eventId?.venue || 'Campus',
    position: certificate.position || 'Winner',
    certificate_number: certificate.certificateNumber || 'CERT-000',
    issue_date: certificate.issuedAt ? new Date(certificate.issuedAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
    coordinator_name: certificate.eventId?.coordinators?.[0]?.name || 'Dr. V. Samkala',
    organization_name: certificate.eventId?.organizer || 'SSCET',
    qr_code: certificate.certificateNumber || 'CERT-000'
  };

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '#000000');
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0];
  };

  // 2. Draw placeholders
  const list = templateConfig?.placeholders || [];
  for (const ph of list) {
    const key = ph.id || ph.name.replace(/[{}]/g, '');
    const value = resolvedData[key] || ph.name;

    ctx.save();
    const centerX = ph.x + ph.w / 2;
    const centerY = ph.y + ph.h / 2;
    ctx.translate(centerX, centerY);
    if (ph.rotation) {
      ctx.rotate((ph.rotation * Math.PI) / 180);
    }

    if (ph.name === '{{qr_code}}' || ph.id === 'qr_code') {
      try {
        const qrPayload = JSON.stringify({
          certNo: certificate.certificateNumber || '',
          studentId: certificate.studentId?._id || certificate.studentId || '',
          eventId: certificate.eventId?._id || certificate.eventId || '',
          token: certificate.verificationCode || ''
        });
        const qrDataUrl = await QRCode.toDataURL(qrPayload, { width: 150, margin: 1 });
        const qrImg = new Image();
        qrImg.src = qrDataUrl;
        await new Promise((resolve) => {
          qrImg.onload = resolve;
        });
        ctx.drawImage(qrImg, -ph.w / 2, -ph.h / 2, ph.w, ph.h);
      } catch (qrErr) {
        console.error('QR code generation failed:', qrErr);
      }
    } else {
      const fontStyle = `${ph.italic ? 'italic' : ''} ${ph.bold ? 'bold' : ''}`.trim();
      ctx.font = `${fontStyle} ${ph.fontSize}px ${ph.font || 'Times New Roman'}`;
      ctx.fillStyle = ph.color || '#000000';
      ctx.textAlign = ph.align || 'center';
      ctx.textBaseline = 'middle';

      let textX = 0;
      if (ph.align === 'left') textX = -ph.w / 2;
      if (ph.align === 'right') textX = ph.w / 2;

      ctx.fillText(String(value), textX, 0, ph.w);
    }
    ctx.restore();
  }

  // 3. Draw custom texts
  for (const ct of (templateConfig?.customTexts || [])) {
    ctx.save();
    const centerX = ct.x + ct.w / 2;
    const centerY = ct.y + ct.h / 2;
    ctx.translate(centerX, centerY);
    if (ct.rotation) {
      ctx.rotate((ct.rotation * Math.PI) / 180);
    }

    const fontStyle = `${ct.italic ? 'italic' : ''} ${ct.bold ? 'bold' : ''}`.trim();
    ctx.font = `${fontStyle} ${ct.fontSize}px ${ct.font || 'Arial'}`;
    ctx.fillStyle = ct.color || '#000000';
    ctx.textAlign = ct.align || 'center';
    ctx.textBaseline = 'middle';

    let textX = 0;
    if (ct.align === 'left') textX = -ct.w / 2;
    if (ct.align === 'right') textX = ct.w / 2;

    ctx.fillText(String(ct.text), textX, 0, ct.w);
    ctx.restore();
  }

  // 4. Draw custom images
  for (const ci of (templateConfig?.customImages || [])) {
    try {
      ctx.save();
      const centerX = ci.x + ci.w / 2;
      const centerY = ci.y + ci.h / 2;
      ctx.translate(centerX, centerY);
      if (ci.rotation) {
        ctx.rotate((ci.rotation * Math.PI) / 180);
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = ci.url;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      ctx.drawImage(img, -ci.w / 2, -ci.h / 2, ci.w, ci.h);
      ctx.restore();
    } catch (imgErr) {
      console.error('Failed to draw custom image:', imgErr);
    }
  }

  return canvas;
};

export const generateCertificatePDF = async (certificate) => {
  const eventId = certificate.eventId?._id || certificate.eventId;
  let templateConfig = null;
  if (eventId) {
    try {
      const res = await adminService.getTemplate(eventId);
      if (res && res.success && res.data) {
        templateConfig = res.data;
      }
    } catch (err) {
      console.warn('Failed to load certificate template configuration:', err);
    }
  }

  if (!templateConfig || !templateConfig.templateUrl) {
    throw new Error('Please upload a certificate template for this event before generating certificates.');
  }

  toast.loading('Generating certificate PDF...', { id: 'pdf_loading' });
  try {
    const canvas = await drawCertificateToCanvas(certificate, templateConfig);
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    doc.addImage(imgData, 'JPEG', 0, 0, 297, 210);
    doc.save(`${certificate.certificateNumber || 'Certificate'}.pdf`);
    toast.success('Certificate PDF Downloaded!', { id: 'pdf_loading' });
  } catch (err) {
    console.error(err);
    toast.error('PDF generation failed.', { id: 'pdf_loading' });
  }
};

export const generateCertificateImage = async (certificate) => {
  const eventId = certificate.eventId?._id || certificate.eventId;
  let templateConfig = null;
  if (eventId) {
    try {
      const res = await adminService.getTemplate(eventId);
      if (res && res.success && res.data) {
        templateConfig = res.data;
      }
    } catch (err) {
      console.warn('Failed to load certificate template configuration:', err);
    }
  }

  if (!templateConfig || !templateConfig.templateUrl) {
    throw new Error('Please upload a certificate template for this event before generating certificates.');
  }

  toast.loading('Generating certificate Image...', { id: 'image_loading' });
  try {
    const canvas = await drawCertificateToCanvas(certificate, templateConfig);
    const imgData = canvas.toDataURL('image/png');

    const link = document.createElement('a');
    link.download = `${certificate.certificateNumber || 'Certificate'}.png`;
    link.href = imgData;
    link.click();
    toast.success('Certificate Image Downloaded!', { id: 'image_loading' });
  } catch (err) {
    console.error(err);
    toast.error('Image generation failed.', { id: 'image_loading' });
  }
};
