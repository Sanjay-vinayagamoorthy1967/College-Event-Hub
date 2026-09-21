import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { adminService } from '../../services/adminService';
import { registrationService } from '../../services/registrationService';
import { FiSearch, FiFilter, FiDownload, FiCheck, FiX, FiTrash2, FiAward, FiEye, FiEdit2, FiPlus } from 'react-icons/fi';
import GradientButton from '../../components/ui/GradientButton';
import { eventService } from '../../services/eventService';
import StatusBadge from '../../components/ui/StatusBadge';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

export default function ManageStudents() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEvent, setFilterEvent] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Modal States
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, regId: null });
  const [viewModal, setViewModal] = useState({ isOpen: false, reg: null });
  const [editModal, setEditModal] = useState({ isOpen: false, reg: null });
  const [addModal, setAddModal] = useState(false);
  const [eventsList, setEventsList] = useState([]);
  const [addForm, setAddForm] = useState({ eventId: '', email: '', usn: '' });
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadRegistrations();
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await eventService.getAllEvents({ all: true });
      if (response.success) {
        setEventsList(response.data);
      }
    } catch (err) {
      console.error('Failed to load events for add modal');
    }
  };

  const loadRegistrations = async () => {
    setLoading(true);
    try {
      // Use the new endpoint from phase 1
      const response = await adminService.getFullRegistrationTable();
      if (response.success) {
        setRegistrations(response.data);
      }
    } catch (error) {
      console.warn('Failed to load real data, using mock data:', error);
      // Fallback
      setRegistrations([
        {
          _id: '1',
          fullName: 'John Doe',
          usn: '1RV20CS001',
          collegeName: 'RV College',
          department: 'CSE',
          eventId: { title: 'Hackathon 2026' },
          paymentStatus: 'completed',
          attendanceStatus: 'present',
          certificateStatus: 'eligible'
        },
        {
          _id: '2',
          fullName: 'Jane Smith',
          usn: '1RV20EC045',
          collegeName: 'BMS College',
          department: 'ECE',
          eventId: { title: 'Robo Wars' },
          paymentStatus: 'pending',
          attendanceStatus: 'absent',
          certificateStatus: 'not_eligible'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getUniqueEvents = () => {
    const events = new Set(registrations.map(r => r.eventId?.title).filter(Boolean));
    return ['All', ...Array.from(events)];
  };

  const filteredData = registrations.filter(reg => {
    const matchesSearch = 
      (reg.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reg.usn || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reg.collegeName || '').toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesEvent = filterEvent === 'All' || reg.eventId?.title === filterEvent;
    
    // Simplistic status filter
    const matchesStatus = filterStatus === 'All' || 
      reg.paymentStatus === filterStatus || 
      reg.attendanceStatus === filterStatus || 
      reg.certificateStatus === filterStatus;

    return matchesSearch && matchesEvent && matchesStatus;
  });

  const handleExport = () => {
    const exportData = filteredData.map(reg => ({
      Name: reg.fullName,
      USN: reg.usn,
      College: reg.collegeName,
      Department: reg.department,
      Event: reg.eventId?.title || 'N/A',
      'Payment Status': reg.paymentStatus,
      'Attendance': reg.attendanceStatus,
      'Certificate': reg.certificateStatus,
      'Food': reg.foodPreference || 'None',
      'Registration Date': new Date(reg.createdAt).toLocaleDateString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");
    XLSX.writeFile(workbook, "Registrations_Export.xlsx");
    toast.success('Export successful!');
  };

  const getBadgeColor = (status) => {
    switch (status) {
      case 'completed':
      case 'present':
      case 'approved':
      case 'issued':
      case 'released':
      case 'generated':
        return 'emerald';
      case 'pending':
      case 'eligible':
        return 'amber';
      case 'not_eligible':
      case 'absent':
      case 'failed':
        return 'slate';
      default:
        return 'slate';
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await registrationService.updateRegistrationStatus(id, status);
      toast.success(`Registration marked as ${status}`);
      loadRegistrations(); // refresh
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.regId || deleting) return;
    setDeleting(true);
    try {
      await registrationService.deleteRegistration(deleteModal.regId);
      toast.success('Registration removed successfully');
      setDeleteModal({ isOpen: false, regId: null });
      loadRegistrations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove registration');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteModal({ isOpen: true, regId: id });
  };

  const handleApproveCert = async (id) => {
    try {
      await adminService.approveCertificate(id);
      toast.success('Certificate approved successfully');
      loadRegistrations();
    } catch (err) {
      toast.error('Failed to approve certificate');
    }
  };

  return (
    <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6 overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-sora text-dark-900">Manage Registrations</h1>
          <p className="text-dark-600 mt-1">View, filter, and export participant data.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <GradientButton variant="glass" onClick={() => setAddModal(true)} icon={FiPlus} className="!text-dark-900 border-[#E5E7EB] hover:bg-dark-50">
            Add Student
          </GradientButton>
          <GradientButton variant="gradient" onClick={handleExport} icon={FiDownload}>
            Export to Excel
          </GradientButton>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E5E7EB] space-y-6 w-full max-w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input
              type="text"
              placeholder="Search by Name, USN, or College..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <select
              value={filterEvent}
              onChange={(e) => setFilterEvent(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
            >
              {getUniqueEvents().map(event => (
                <option key={event} value={event}>{event}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
            >
              <option value="All">All Statuses</option>
              <option value="completed">Payment Completed</option>
              <option value="pending">Payment Pending</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="eligible">Cert Eligible</option>
              <option value="approved">Cert Approved</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#E5E7EB]">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="bg-dark-50 text-dark-600 font-bold uppercase tracking-wider border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-6 py-4 w-16">S.No</th>
                  <th className="px-6 py-4">Participant</th>
                  <th className="px-6 py-4">College</th>
                  <th className="px-6 py-4">Event</th>
                  <th className="px-6 py-4">Food</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4">Attendance</th>
                  <th className="px-6 py-4">Certificate</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-8 text-center text-dark-500">
                      No registrations found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((reg, index) => (
                    <tr key={reg._id} className="group hover:bg-dark-50/50">
                      <td className="px-6 py-4 font-semibold text-dark-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4">
                        {reg.registrationType === 'team' ? (
                          <>
                            <p className="font-bold text-primary-600">👥 {reg.teamName} ({reg.teamSize || 1} members)</p>
                            <p className="text-dark-900 text-xs font-semibold">Leader: {reg.fullName}</p>
                            <p className="text-dark-500 text-[10px]">{reg.usn}</p>
                          </>
                        ) : (
                          <>
                            <p className="font-bold text-dark-900">{reg.fullName}</p>
                            <p className="text-dark-500 text-xs">{reg.usn}</p>
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-dark-900">{reg.collegeName}</p>
                        <p className="text-dark-500 text-xs">{reg.department}</p>
                      </td>
                      <td className="px-6 py-4 font-semibold text-dark-900">
                        {reg.eventId?.title || 'Unknown Event'}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge variant={reg.foodPreference === 'veg' ? 'emerald' : reg.foodPreference === 'non-veg' ? 'rose' : 'slate'} status={reg.foodPreference || 'None'} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge variant={getBadgeColor(reg.paymentStatus)} status={reg.paymentStatus} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge variant={getBadgeColor(reg.attendanceStatus)} status={reg.attendanceStatus} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge variant={getBadgeColor(reg.certificateStatus)} status={reg.certificateStatus.replace('_', ' ')} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setViewModal({ isOpen: true, reg })} className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200 shadow-sm" title="View Details">
                            <FiEye />
                          </button>
                          <button onClick={() => setEditModal({ isOpen: true, reg })} className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200 shadow-sm" title="Edit Registration">
                            <FiEdit2 />
                          </button>
                          {!['approved', 'released', 'generated'].includes(reg.certificateStatus) ? (
                            <button onClick={() => handleApproveCert(reg._id)} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-200 shadow-sm" title="Approve Certificate">
                              <FiCheck />
                            </button>
                          ) : (
                            <span className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 text-slate-400 rounded-lg border border-slate-200" title="Approved">
                              <FiCheck />
                            </span>
                          )}
                          <button onClick={() => handleDeleteClick(reg._id)} className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors border border-rose-200 shadow-sm" title="Remove Registration">
                            <FiX />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-[#E5E7EB]"
          >
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiTrash2 className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-xl font-bold font-sora text-dark-900 mb-2">Remove Registration?</h3>
              <p className="text-dark-600 mb-6">Are you sure you want to remove this student's registration? This will delete their payment record, QR code, and free up their spot for this event. This action cannot be undone.</p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteModal({ isOpen: false, regId: null })}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-dark-600 font-semibold hover:bg-dark-50 transition-colors"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-rose-500 text-white font-semibold hover:bg-rose-600 shadow-lg shadow-rose-500/30 transition-all active:scale-95 disabled:opacity-50"
                >
                  {deleting ? 'Removing...' : 'Yes, Remove'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* View Modal */}
      {viewModal.isOpen && viewModal.reg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-[#E5E7EB] flex flex-col max-h-[90vh]"
          >
            <div className="flex justify-between items-center p-6 border-b border-[#E5E7EB] bg-dark-50">
              <h3 className="text-lg font-bold font-sora text-dark-900">Registration Details</h3>
              <button onClick={() => setViewModal({ isOpen: false, reg: null })} className="text-dark-400 hover:text-dark-900"><FiX size={24} /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 text-sm text-dark-600">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="font-semibold text-dark-900">Type:</span> {viewModal.reg.registrationType === 'team' ? 'Team' : 'Individual'}</div>
                {viewModal.reg.registrationType === 'team' && (
                  <>
                    <div><span className="font-semibold text-dark-900">Team Name:</span> {viewModal.reg.teamName}</div>
                    <div><span className="font-semibold text-dark-900">Team Size:</span> {viewModal.reg.teamSize} Members</div>
                  </>
                )}
                <div><span className="font-semibold text-dark-900">Name (Leader):</span> {viewModal.reg.fullName}</div>
                <div><span className="font-semibold text-dark-900">USN:</span> {viewModal.reg.usn}</div>
                <div><span className="font-semibold text-dark-900">College:</span> {viewModal.reg.collegeName}</div>
                <div><span className="font-semibold text-dark-900">Department:</span> {viewModal.reg.department}</div>
                <div><span className="font-semibold text-dark-900">Event:</span> {viewModal.reg.eventId?.title}</div>
                <div><span className="font-semibold text-dark-900">Food:</span> {viewModal.reg.foodPreference}</div>
                <div><span className="font-semibold text-dark-900">Payment:</span> {viewModal.reg.paymentStatus}</div>
                <div><span className="font-semibold text-dark-900">Certificate:</span> {viewModal.reg.certificateStatus}</div>
              </div>

              {viewModal.reg.registrationType === 'team' && viewModal.reg.teamMembers && viewModal.reg.teamMembers.length > 0 && (
                <div className="mt-6 border-t border-[#E5E7EB] pt-4">
                  <h4 className="font-bold text-dark-900 mb-3 font-sora">Team Members</h4>
                  <div className="space-y-3">
                    {viewModal.reg.teamMembers.map((member, idx) => (
                      <div key={idx} className="p-3 bg-dark-50 rounded-xl border border-[#E5E7EB] flex flex-col gap-1 text-xs">
                        <div className="font-bold text-dark-900">Member {idx + 2}: {member.name}</div>
                        <div className="grid grid-cols-2 gap-2 text-dark-500">
                          <div>USN: {member.usn}</div>
                          <div>Email: {member.email}</div>
                          <div className="col-span-2">Phone: {member.phone}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Modal (Placeholder for future functionality) */}
      {editModal.isOpen && editModal.reg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-[#E5E7EB]"
          >
            <div className="flex justify-between items-center p-6 border-b border-[#E5E7EB]">
              <h3 className="text-lg font-bold font-sora text-dark-900">Edit Registration</h3>
              <button onClick={() => setEditModal({ isOpen: false, reg: null })} className="text-dark-400 hover:text-dark-900"><FiX size={24} /></button>
            </div>
            <div className="p-6 text-center text-dark-600">
              <p>Edit functionality is coming soon!</p>
              <button onClick={() => setEditModal({ isOpen: false, reg: null })} className="mt-4 px-6 py-2 bg-dark-900 text-white rounded-xl">Close</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Registration Modal */}
      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-[#E5E7EB]"
          >
            <div className="flex justify-between items-center p-6 border-b border-[#E5E7EB] bg-dark-50">
              <h3 className="text-lg font-bold font-sora text-dark-900">Add Student Registration</h3>
              <button onClick={() => { setAddModal(false); setAddForm({ eventId: '', email: '', usn: '' }); }} className="text-dark-400 hover:text-dark-900"><FiX size={24} /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setAdding(true);
              try {
                await adminService.addStudentRegistration(addForm);
                toast.success('Registration added successfully');
                setAddModal(false);
                setAddForm({ eventId: '', email: '', usn: '' });
                loadRegistrations();
              } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to add registration');
              } finally {
                setAdding(false);
              }
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Select Event</label>
                <select
                  required
                  value={addForm.eventId}
                  onChange={e => setAddForm({...addForm, eventId: e.target.value})}
                  className="w-full px-4 py-2 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">-- Select an Event --</option>
                  {eventsList.map(ev => (
                    <option key={ev._id} value={ev._id}>{ev.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Student USN</label>
                <input
                  type="text"
                  placeholder="e.g. 1RV20CS001"
                  value={addForm.usn}
                  onChange={e => setAddForm({...addForm, usn: e.target.value})}
                  className="w-full px-4 py-2 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="text-center text-xs text-dark-400 font-bold uppercase">OR</div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Student Email</label>
                <input
                  type="email"
                  placeholder="student@example.com"
                  value={addForm.email}
                  onChange={e => setAddForm({...addForm, email: e.target.value})}
                  className="w-full px-4 py-2 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setAddModal(false); setAddForm({ eventId: '', email: '', usn: '' }); }}
                  className="flex-1 px-4 py-2 rounded-xl border border-[#E5E7EB] text-dark-600 font-semibold hover:bg-dark-50"
                  disabled={adding}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding || !addForm.eventId || (!addForm.usn && !addForm.email)}
                  className="flex-1 px-4 py-2 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-50"
                >
                  {adding ? 'Adding...' : 'Add Student'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
