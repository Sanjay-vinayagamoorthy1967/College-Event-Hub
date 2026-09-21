import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { eventService } from '../../services/eventService';
import { FiCheck, FiCheckSquare, FiAward, FiToggleLeft, FiToggleRight, FiX } from 'react-icons/fi';
import GradientButton from '../../components/ui/GradientButton';
import toast from 'react-hot-toast';

export default function CertificateManagement() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await eventService.getAllEvents({ all: true });
      if (data.success) {
        setEvents(data.data);
        if (data.data.length > 0) {
          setSelectedEventId(data.data[0]._id);
          loadEligibleStudents(data.data[0]._id);
        } else {
          setSelectedEventId('all');
          loadEligibleStudents('all');
        }
      }
    } catch (err) {
      toast.error('Failed to load events');
    }
  };

  const loadEligibleStudents = async (eventId) => {
    if (!eventId) return;
    setLoading(true);
    try {
      const data = eventId === 'all'
        ? await adminService.getEligibleStudents('all')
        : await adminService.getEventAttendance(eventId);
      if (data.success) {
        setEligibleStudents(data.data);
      }
    } catch (err) {
      toast.error('Failed to load students list');
    } finally {
      setLoading(false);
      setSelectedStudentIds([]); // Reset selections on load
    }
  };

  const handleEventChange = (e) => {
    const eventId = e.target.value;
    setSelectedEventId(eventId);
    loadEligibleStudents(eventId);
  };

  const handleAttendanceToggle = async (registrationId, currentStatus) => {
    const nextStatus = currentStatus === 'present' ? 'absent' : 'present';
    try {
      const data = await adminService.markAttendanceEventWise(registrationId, nextStatus);
      if (data.success) {
        toast.success(`Attendance marked as ${nextStatus === 'present' ? 'Present' : 'Absent'}`);
        // Refresh student list
        loadEligibleStudents(selectedEventId);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update attendance');
    }
  };

  const handleApprove = async (registrationId) => {
    if (selectedEventId === 'all') {
      toast.error('Please select a specific event first.');
      return;
    }
    try {
      const data = await adminService.generateCertificateForEvent(selectedEventId, { registrationId });
      if (data.success) {
        toast.success('Certificate generated successfully');
        loadEligibleStudents(selectedEventId);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed');
    }
  };

  const handleBulkApprove = async () => {
    if (!selectedEventId || selectedEventId === 'all') {
      toast.error('Please select a specific event first.');
      return;
    }
    setApproving(true);
    try {
      const data = await adminService.generateCertificateForEvent(selectedEventId, { registrationIds: selectedStudentIds });
      if (data.success) {
        toast.success(data.message);
        loadEligibleStudents(selectedEventId);
        setSelectedStudentIds([]); // Clear selection
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk generation failed');
    } finally {
      setApproving(false);
    }
  };

  const selectableStudents = eligibleStudents.filter(
    s => s.attendanceStatus === 'present' && !['released', 'generated'].includes(s.certificateStatus)
  );
  const pendingCount = selectableStudents.length;

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedStudentIds(selectableStudents.map(s => s._id));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleSelectStudent = (id) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(studentId => studentId !== id) : [...prev, id]
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-sora text-dark-900">Attendance & Certificate Release</h1>
          <p className="text-dark-600 mt-1">Mark attendance and generate event certificates independently.</p>
        </div>
        
        {selectedEventId !== 'all' && pendingCount > 0 && (
          <GradientButton 
            variant="gradient" 
            onClick={handleBulkApprove} 
            loading={approving}
            icon={FiCheckSquare}
          >
            {selectedStudentIds.length > 0 
              ? `Generate Selected (${selectedStudentIds.length})`
              : `Generate All Pending (${pendingCount})`
            }
          </GradientButton>
        )}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E5E7EB] space-y-6">
        <div className="max-w-md">
          <label className="block text-sm font-semibold text-dark-900 mb-2">Select Event</label>
          <select
            value={selectedEventId}
            onChange={handleEventChange}
            className="w-full px-4 py-2 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            <option value="all">All Events</option>
            {events.map(event => (
              <option key={event._id} value={event._id}>{event.title}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#E5E7EB]">
            <table className="w-full text-left text-sm">
              <thead className="bg-dark-50 text-dark-600 font-bold uppercase tracking-wider border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-6 py-4 w-12 text-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                      checked={selectedStudentIds.length === pendingCount && pendingCount > 0}
                      onChange={handleSelectAll}
                      disabled={pendingCount === 0 || selectedEventId === 'all'}
                    />
                  </th>
                  <th className="px-6 py-4">Participant</th>
                  <th className="px-6 py-4">Event</th>
                  <th className="px-6 py-4">College</th>
                  <th className="px-6 py-4">Attendance Status</th>
                  <th className="px-6 py-4">Cert Status</th>
                  <th className="px-6 py-4 text-right sticky right-0 bg-dark-50 z-10 shadow-[-4px_0_10px_rgba(0,0,0,0.03)]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {eligibleStudents.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-dark-500">
                      <FiAward className="w-12 h-12 mx-auto text-dark-300 mb-2" />
                      <p>No registrations found.</p>
                      <p className="text-xs mt-1">Registered participants will appear here.</p>
                    </td>
                  </tr>
                ) : (
                  eligibleStudents.map((reg) => {
                    const hasCertificate = ['released', 'generated'].includes(reg.certificateStatus);
                    const isPresent = reg.attendanceStatus === 'present';
                    
                    return (
                      <tr key={reg._id} className={`group hover:bg-dark-50/50 ${selectedStudentIds.includes(reg._id) ? 'bg-primary-50/20' : ''}`}>
                        <td className="px-6 py-4 text-center">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            checked={selectedStudentIds.includes(reg._id)}
                            onChange={() => handleSelectStudent(reg._id)}
                            disabled={!isPresent || hasCertificate || selectedEventId === 'all'}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-dark-900">{reg.fullName || reg.studentId?.name}</p>
                          <p className="text-dark-500 text-xs font-mono">{reg.usn || reg.studentId?.registerNumber}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2 py-1 bg-primary-50 text-primary-700 text-xs font-bold rounded-md">
                            {reg.eventId?.title || 'Unknown Event'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-dark-900">{reg.collegeName}</p>
                          <p className="text-dark-500 text-xs">{reg.department}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              isPresent
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {reg.attendanceStatus || 'absent'}
                            </span>
                            <button
                              onClick={() => handleAttendanceToggle(reg._id, reg.attendanceStatus)}
                              className="text-primary-600 hover:text-primary-700 text-xl transition-all"
                              title="Toggle Attendance"
                            >
                              {isPresent ? <FiToggleRight className="text-emerald-500" size={24} /> : <FiToggleLeft className="text-dark-400" size={24} />}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            hasCertificate
                              ? 'bg-primary-100 text-primary-800' 
                              : 'bg-slate-100 text-slate-800'
                          }`}>
                            {hasCertificate ? 'Released' : 'Pending'}
                          </span>
                          {reg.certificateNumber && (
                            <p className="text-[10px] text-dark-500 font-mono mt-1">{reg.certificateNumber}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right sticky right-0 bg-white z-10 shadow-[-4px_0_10px_rgba(0,0,0,0.03)] group-hover:bg-dark-50/50">
                          {hasCertificate ? (
                            <span className="text-emerald-600 font-bold inline-flex items-center gap-1 text-xs">
                              <FiCheck /> Released
                            </span>
                          ) : isPresent ? (
                            <button
                              onClick={() => handleApprove(reg._id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-lg font-semibold transition-colors text-xs"
                            >
                              <FiAward /> Generate
                            </button>
                          ) : (
                            <span className="text-dark-400 inline-flex items-center gap-1 text-xs font-medium">
                              <FiX /> Unavailable
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
