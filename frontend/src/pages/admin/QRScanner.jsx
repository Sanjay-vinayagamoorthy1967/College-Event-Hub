import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { adminService } from '../../services/adminService';
import { eventService } from '../../services/eventService';
import { FiCheckCircle, FiXCircle, FiUsers, FiClock, FiFileText, FiCamera, FiCornerDownRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import GradientButton from '../../components/ui/GradientButton';
import GlassCard from '../../components/ui/GlassCard';

export default function QRScanner() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [scanMode, setScanMode] = useState('barcode'); // 'barcode' | 'qr'
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [scannedAttendees, setScannedAttendees] = useState([]);
  const [manualSinNo, setManualSinNo] = useState('');
  const [submittingManual, setSubmittingManual] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await eventService.getAllEvents({ all: true });
      if (response.success && response.data.length > 0) {
        setEvents(response.data);
        setSelectedEventId(response.data[0]._id);
        loadScannedList(response.data[0]._id);
      }
    } catch (err) {
      toast.error('Failed to load events');
    }
  };

  const loadScannedList = async (eventId) => {
    if (!eventId) return;
    try {
      const response = await adminService.getEventAttendance(eventId);
      if (response.success) {
        // Filter those who are marked present
        const presentList = response.data.filter(r => r.attendanceStatus === 'present');
        // Sort by scan time descending
        presentList.sort((a, b) => new Date(b.markedAt || b.updatedAt) - new Date(a.markedAt || a.updatedAt));
        setScannedAttendees(presentList);
      }
    } catch (err) {
      console.warn('Failed to load scanned attendees:', err.message);
    }
  };

  const handleEventChange = (e) => {
    const eventId = e.target.value;
    setSelectedEventId(eventId);
    setScanResult(null);
    loadScannedList(eventId);
  };

  useEffect(() => {
    if (scannerActive && selectedEventId) {
      const scanner = new Html5QrcodeScanner('reader', {
        qrbox: { width: 250, height: 250 },
        fps: 10,
      });

      scanner.render(success, error);

      async function success(result) {
        if (loading) return;
        scanner.clear();
        setScannerActive(false);
        setLoading(true);

        try {
          let response;
          if (scanMode === 'barcode') {
            // Barcode scan
            response = await adminService.scanAttendance(selectedEventId, {
              barcodeValue: result,
              mode: 'barcode'
            });
          } else {
            // QR scan
            response = await adminService.scanAttendance(selectedEventId, {
              qrValue: result,
              mode: 'qr'
            });
          }

          if (response.success) {
            toast.success(response.message || 'Attendance marked successfully.');
            setScanResult({
              success: true,
              message: response.message || 'Attendance marked successfully.',
              data: response.data
            });
            loadScannedList(selectedEventId);
          }
        } catch (err) {
          const errMsg = err.response?.data?.message || err.message || 'Scan failed';
          toast.error(errMsg);
          setScanResult({
            success: false,
            message: errMsg
          });
        } finally {
          setLoading(false);
        }
      }

      function error(err) {
        // Silenced scanner feedback loop errors
      }

      return () => {
        scanner.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner. ", error);
        });
      };
    }
  }, [scannerActive, selectedEventId, scanMode, loading]);

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEventId) {
      toast.error('Please select an event first');
      return;
    }
    const sinNo = manualSinNo.trim();
    if (!sinNo) {
      toast.error('Please enter a Register Number / SIN_NO');
      return;
    }

    setSubmittingManual(true);
    setScanResult(null);
    try {
      const response = await adminService.scanAttendance(selectedEventId, {
        barcodeValue: sinNo,
        mode: 'barcode'
      });

      if (response.success) {
        toast.success(response.message || 'Attendance marked successfully.');
        setScanResult({
          success: true,
          message: response.message || 'Attendance marked successfully.',
          data: response.data
        });
        setManualSinNo('');
        loadScannedList(selectedEventId);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Verification failed';
      toast.error(errMsg);
      setScanResult({
        success: false,
        message: errMsg
      });
    } finally {
      setSubmittingManual(false);
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setScannerActive(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold font-sora text-dark-900 tracking-tight">
          Smart Attendance System
        </h1>
        <p className="text-dark-600 mt-2">
          Verify and mark attendance automatically for Internal Students (Barcode) and External Participants (QR Code).
        </p>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="w-full md:max-w-md">
          <label className="block text-sm font-semibold text-dark-900 mb-2">Selected Event</label>
          <select
            value={selectedEventId}
            onChange={handleEventChange}
            className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white font-medium text-sm text-dark-800"
          >
            {events.map(event => (
              <option key={event._id} value={event._id}>{event.title}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-dark-900">Attendance Mode</span>
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={() => {
                setScanMode('barcode');
                setScannerActive(false);
                setScanResult(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                scanMode === 'barcode'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-dark-600 hover:text-dark-900'
              }`}
            >
              Barcode (Internal)
            </button>
            <button
              onClick={() => {
                setScanMode('qr');
                setScannerActive(false);
                setScanResult(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                scanMode === 'qr'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-dark-600 hover:text-dark-900'
              }`}
            >
              QR Code (External)
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Scanner control panel */}
        <div className="lg:col-span-1 space-y-6">
          <GlassCard variant="light" className="p-6 border border-[#E5E7EB] h-full flex flex-col justify-center min-h-[380px]">
            <h3 className="text-lg font-bold font-sora text-dark-900 mb-4 text-center flex items-center justify-center gap-2">
              <FiCamera className="text-primary-500 animate-pulse" /> Camera Scanner Viewport
            </h3>
            
            {!scannerActive && !scanResult && !loading && (
              <div className="py-10 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-14 h-14 bg-primary-500/10 rounded-full flex items-center justify-center text-primary-600">
                  <FiCamera className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-dark-900">Scanner Ready</h4>
                  <p className="text-xs text-dark-500 max-w-[220px] mx-auto mt-1">
                    {scanMode === 'barcode'
                      ? 'Align the ID card barcode inside the scanner camera frame.'
                      : 'Scan the participant ticket QR code entry pass.'}
                  </p>
                </div>
                <GradientButton variant="gradient" onClick={() => setScannerActive(true)} className="w-full">
                  Activate Camera Scanner
                </GradientButton>
              </div>
            )}

            {scannerActive && !scanResult && (
              <div className="space-y-4">
                <div className="w-full overflow-hidden rounded-2xl border border-[#E5E7EB] bg-dark-50 p-2 shadow-inner">
                  <div id="reader" className="w-full"></div>
                </div>
                <button
                  type="button"
                  onClick={() => setScannerActive(false)}
                  className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-xs font-bold rounded-xl transition-all"
                >
                  Deactivate Camera
                </button>
              </div>
            )}

            {loading && (
              <div className="py-16 flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="font-semibold text-dark-600 text-sm">Processing Scan...</p>
              </div>
            )}

            {scanResult && !loading && (
              <div className="py-4 flex flex-col items-center text-center space-y-4">
                {scanResult.success ? (
                  <>
                    <FiCheckCircle className="w-14 h-14 text-emerald-500" />
                    <div>
                      <h2 className="text-lg font-bold text-dark-900">Access Granted</h2>
                      <p className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block mt-1">
                        Attendance Marked
                      </p>
                    </div>
                    <div className="bg-[#F8FAFC] text-dark-800 p-4 rounded-2xl w-full border border-[#E5E7EB] text-xs space-y-1.5 text-left">
                      <p className="font-bold text-dark-900 flex justify-between">
                        <span>Name:</span> <span className="font-semibold">{scanResult.data.studentName}</span>
                      </p>
                      <p className="text-dark-600 flex justify-between font-mono">
                        <span>SIN / USN:</span> <span>{scanResult.data.usn}</span>
                      </p>
                      <p className="text-dark-600 flex justify-between">
                        <span>College:</span> <span className="truncate max-w-[150px]">{scanResult.data.college}</span>
                      </p>
                      <p className="text-dark-600 flex justify-between">
                        <span>Type:</span>
                        <span className={`font-bold text-[9px] px-1.5 py-0.5 rounded uppercase ${
                          scanResult.data.participantType === 'INTERNAL' 
                            ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                            : 'bg-orange-50 text-orange-600 border border-orange-200'
                        }`}>
                          {scanResult.data.participantType}
                        </span>
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <FiXCircle className="w-14 h-14 text-rose-500" />
                    <div>
                      <h2 className="text-lg font-bold text-dark-900">Verification Failed</h2>
                      <p className="text-[10px] text-rose-600 font-semibold bg-rose-50 px-2.5 py-0.5 rounded-full inline-block mt-1">
                        Access Denied
                      </p>
                    </div>
                    <div className="bg-rose-50/50 text-rose-900 p-4 rounded-2xl w-full border border-rose-100 text-xs">
                      <p className="font-semibold">{scanResult.message}</p>
                    </div>
                  </>
                )}

                <GradientButton variant="gradient" onClick={resetScanner} className="w-full">
                  Scan Next Ticket
                </GradientButton>
              </div>
            )}
          </GlassCard>

          {/* Manual Barcode Input Fallback (only for Internal Barcode mode) */}
          {scanMode === 'barcode' && !scannerActive && (
            <GlassCard variant="light" className="p-6 border border-[#E5E7EB]">
              <h4 className="text-sm font-bold font-sora text-dark-900 mb-2 flex items-center gap-1">
                <FiCornerDownRight className="text-primary-500" /> Manual Barcode Entry
              </h4>
              <p className="text-[10px] text-dark-500 mb-4">
                If the camera scanner has trouble reading the barcode, manually enter the student's Register Number / SIN_NO.
              </p>
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. SIN230145"
                  value={manualSinNo}
                  onChange={(e) => setManualSinNo(e.target.value)}
                  className="flex-1 px-3 py-2 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-xs bg-white"
                />
                <button
                  type="submit"
                  disabled={submittingManual || !manualSinNo}
                  className="px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-bold hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {submittingManual ? 'Verifying...' : 'Submit'}
                </button>
              </form>
            </GlassCard>
          )}
        </div>

        {/* Live Scanned Table */}
        <div className="lg:col-span-2">
          <GlassCard variant="light" className="border border-[#E5E7EB] overflow-hidden flex flex-col h-full min-h-[380px]">
            <div className="p-6 border-b border-[#E5E7EB] bg-[#F8FAFC] flex justify-between items-center">
              <h3 className="text-lg font-bold font-sora text-dark-900 flex items-center gap-2">
                <FiUsers className="text-primary-500" /> Scanned Attendance Feed
              </h3>
              <span className="px-3 py-1 rounded-full bg-primary-100 text-primary-700 font-bold text-xs">
                {scannedAttendees.length} Present
              </span>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-dark-50 text-dark-500 text-xs uppercase tracking-wider font-bold">
                    <th className="p-4 pl-6 border-b border-[#E5E7EB]">Student</th>
                    <th className="p-4 border-b border-[#E5E7EB]">Register No / USN</th>
                    <th className="p-4 border-b border-[#E5E7EB]">College</th>
                    <th className="p-4 border-b border-[#E5E7EB]">Type</th>
                    <th className="p-4 pr-6 border-b border-[#E5E7EB]">Scan Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {scannedAttendees.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-12 text-center text-dark-500">
                        <FiUsers className="w-12 h-12 text-dark-300 mx-auto mb-2" />
                        No scanned attendees yet. Select an event and activate scanner to begin.
                      </td>
                    </tr>
                  ) : (
                    scannedAttendees.map((attendee) => (
                      <tr key={attendee._id} className="hover:bg-dark-50/50 transition-colors text-xs">
                        <td className="p-4 pl-6 border-b border-[#E5E7EB]">
                          <div className="font-bold text-dark-900">{attendee.fullName}</div>
                          <div className="text-[10px] text-dark-500">{attendee.email}</div>
                        </td>
                        <td className="p-4 border-b border-[#E5E7EB] font-mono font-bold text-dark-900">
                          {attendee.usn}
                        </td>
                        <td className="p-4 border-b border-[#E5E7EB] font-medium text-dark-900">
                          {attendee.collegeName}
                        </td>
                        <td className="p-4 border-b border-[#E5E7EB]">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                            attendee.studentType === 'StudentInternal'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-orange-50 text-orange-700 border border-orange-200'
                          }`}>
                            {attendee.studentType === 'StudentInternal' ? 'INTERNAL' : 'EXTERNAL'}
                          </span>
                        </td>
                        <td className="p-4 pr-6 border-b border-[#E5E7EB] text-dark-500 font-medium">
                          {new Date(attendee.markedAt || attendee.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
