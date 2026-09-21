import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FiTrash2, FiCheck, FiX, FiAlertTriangle, FiUser, FiMail, FiMessageSquare, FiClock } from 'react-icons/fi';
import GlassCard from '../../components/ui/GlassCard';
import StatusBadge from '../../components/ui/StatusBadge';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function DeletionRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  // Approve/Deny modal
  const [modal, setModal] = useState({ isOpen: false, type: null, request: null });
  const [adminNote, setAdminNote] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/deletion-requests');
      if (res.data.success) {
        setRequests(res.data.data || []);
      }
    } catch (err) {
      toast.error('Failed to load deletion requests.');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type, request) => {
    setModal({ isOpen: true, type, request });
    setAdminNote('');
  };

  const handleAction = async () => {
    if (!modal.request) return;
    setProcessing(true);
    try {
      const endpoint = `/deletion-requests/${modal.request._id}/${modal.type}`;
      const res = await api.put(endpoint, { adminNote });
      if (res.data.success) {
        toast.success(res.data.message);
        // Update local state
        setRequests(prev =>
          prev.map(r =>
            r._id === modal.request._id
              ? { ...r, status: modal.type === 'approve' ? 'approved' : 'denied', adminNote }
              : r
          )
        );
        setModal({ isOpen: false, type: null, request: null });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Action failed.');
    } finally {
      setProcessing(false);
    }
  };

  const filteredRequests = requests.filter(r => r.status === filter);

  const counts = {
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    denied: requests.filter(r => r.status === 'denied').length,
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const statusVariant = { pending: 'amber', approved: 'emerald', denied: 'rose' };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 relative z-10 flex flex-col gap-8">
      {/* Header */}
      <div>
        <span className="text-xs font-bold text-red-400 uppercase tracking-widest font-sora mb-2 block">
          Admin Portal
        </span>
        <h1 className="text-3xl md:text-5xl font-black font-sora text-dark-900">
          ACCOUNT <span className="gradient-text">DELETION REQUESTS</span>
        </h1>
        <p className="text-sm text-dark-600 font-poppins mt-2">
          Review, approve, or deny student account deletion requests. Approved requests permanently delete student data.
        </p>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-3 gap-5">
        {[
          { label: 'Pending', key: 'pending', color: 'amber', icon: FiClock },
          { label: 'Approved', key: 'approved', color: 'emerald', icon: FiCheck },
          { label: 'Denied', key: 'denied', color: 'rose', icon: FiX },
        ].map(({ label, key, color, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`p-5 rounded-3xl border text-left transition-all ${
              filter === key
                ? `bg-${color}-50 border-${color}-400 shadow-md`
                : 'bg-white border-[#E5E7EB] hover:shadow-sm'
            }`}
          >
            <div className={`w-10 h-10 rounded-2xl bg-${color}-100 flex items-center justify-center text-${color}-600 mb-3`}>
              <Icon size={20} />
            </div>
            <p className="text-3xl font-black font-sora text-dark-900">{counts[key]}</p>
            <p className="text-xs font-bold text-dark-500 uppercase tracking-wider mt-1">{label}</p>
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#E5E7EB]">
          <p className="text-dark-400 font-medium text-lg font-sora">No {filter} requests found.</p>
        </div>
      ) : (
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-[#E5E7EB] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-dark-900/5 text-dark-600 text-xs uppercase tracking-wider font-semibold font-sora">
                  <th className="py-4 px-6">Student</th>
                  <th className="py-4 px-6">Email</th>
                  <th className="py-4 px-6">USN</th>
                  <th className="py-4 px-6">Reason</th>
                  <th className="py-4 px-6">Submitted</th>
                  <th className="py-4 px-6">Status</th>
                  {filter === 'pending' && <th className="py-4 px-6 text-center">Actions</th>}
                  {filter !== 'pending' && <th className="py-4 px-6">Admin Note</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-sm font-poppins text-dark-900">
                <AnimatePresence>
                  {filteredRequests.map((req, i) => (
                    <motion.tr
                      key={req._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="hover:bg-white transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                            {req.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <span className="font-semibold">{req.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-dark-600">{req.email}</td>
                      <td className="py-4 px-6 text-dark-600 font-mono text-xs">{req.usn || '—'}</td>
                      <td className="py-4 px-6 text-dark-500 max-w-[200px]">
                        <span className="line-clamp-2 text-xs">{req.reason || <span className="italic text-dark-400">No reason given</span>}</span>
                      </td>
                      <td className="py-4 px-6 text-dark-500 text-xs">{formatDate(req.createdAt)}</td>
                      <td className="py-4 px-6">
                        <StatusBadge
                          status={req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                          variant={statusVariant[req.status]}
                        />
                      </td>
                      {filter === 'pending' && (
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openModal('approve', req)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all"
                            >
                              <FiCheck size={12} /> Approve
                            </button>
                            <button
                              onClick={() => openModal('deny', req)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all"
                            >
                              <FiX size={12} /> Deny
                            </button>
                          </div>
                        </td>
                      )}
                      {filter !== 'pending' && (
                        <td className="py-4 px-6 text-xs text-dark-500 max-w-[160px]">
                          <span className="line-clamp-2">{req.adminNote || '—'}</span>
                        </td>
                      )}
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approve / Deny Modal */}
      {modal.isOpen && modal.request && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-[#E5E7EB]"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                modal.type === 'approve' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
              }`}>
                {modal.type === 'approve' ? <FiCheck size={20} /> : <FiX size={20} />}
              </div>
              <div>
                <h3 className="text-xl font-black font-sora text-dark-900">
                  {modal.type === 'approve' ? 'Approve Deletion' : 'Deny Deletion'}
                </h3>
                <p className="text-xs text-dark-500 font-poppins">{modal.request.name} · {modal.request.email}</p>
              </div>
            </div>

            {modal.type === 'approve' && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 text-xs text-red-800 font-poppins">
                <p className="font-bold mb-1">⚠️ This action is irreversible.</p>
                <p>Approving will permanently delete the student's account, all registrations, certificates, and payment records.</p>
              </div>
            )}

            <div className="mb-5">
              <label className="block text-xs font-bold text-dark-600 uppercase tracking-wider mb-1.5">
                Admin Note (optional)
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder={modal.type === 'approve' ? 'e.g. Account deleted as per request.' : 'e.g. Request denied — policy requires a 30-day notice.'}
                rows={3}
                className="w-full px-4 py-3 rounded-2xl border border-[#E5E7EB] text-sm font-poppins text-dark-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setModal({ isOpen: false, type: null, request: null })}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm text-dark-600 hover:bg-dark-900/5 transition-colors"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-70 ${
                  modal.type === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
                disabled={processing}
              >
                {processing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : modal.type === 'approve' ? (
                  <FiCheck size={14} />
                ) : (
                  <FiX size={14} />
                )}
                {processing ? 'Processing...' : modal.type === 'approve' ? 'Approve & Delete' : 'Deny Request'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
