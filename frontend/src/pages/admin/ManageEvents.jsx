import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { eventService } from '../../services/eventService';
import { FiSearch, FiTrash2, FiEye, FiEdit2, FiPlus, FiAlertTriangle } from 'react-icons/fi';
import GradientButton from '../../components/ui/GradientButton';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '../../utils/helpers';

export default function ManageEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, event: null });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const response = await eventService.getAllEvents({ all: true });
      setEvents(response.data || []);
    } catch (error) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event =>
    (event.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (event.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleRegistration = async (eventId, currentStatus) => {
    try {
      const response = await eventService.toggleRegistrationStatus(eventId, !currentStatus);
      if (response.success) {
        toast.success(`Registration is now ${!currentStatus ? 'OPEN' : 'CLOSED'}`);
        setEvents(prev => prev.map(e => e._id === eventId ? { ...e, registrationOpen: !currentStatus } : e));
      }
    } catch (error) {
      toast.error('Failed to toggle registration status.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal.event) return;
    setIsDeleting(true);
    try {
      await eventService.deleteEvent(deleteModal.event._id);
      toast.success('Event deleted successfully.');
      setEvents(prev => prev.filter(e => e._id !== deleteModal.event._id));
      setDeleteModal({ isOpen: false, event: null });
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete event.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 relative z-10 flex flex-col gap-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-secondary-500 uppercase tracking-widest font-sora mb-2 block">Control Room</span>
          <h1 className="text-3xl md:text-5xl font-black font-sora text-dark-900">
            EVENT <span className="gradient-text">MANAGEMENT</span>
          </h1>
          <p className="text-sm text-dark-600 font-poppins mt-2">
            View, edit, or completely remove events from the system.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <GradientButton variant="gradient" size="md" onClick={() => navigate('/admin/create-event')} icon={FiPlus}>
            Create New Event
          </GradientButton>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative w-full md:w-96">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 text-lg z-10" />
          <input
            type="text"
            placeholder="Search events by title or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/50 backdrop-blur-md border border-[#E5E7EB] focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all font-poppins text-sm text-dark-900"
          />
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-[#E5E7EB] shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-dark-900/5 text-dark-600 text-xs uppercase tracking-wider font-semibold font-sora">
                <th className="py-4 px-6">Event Title</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Price</th>
                <th className="py-4 px-6">Registrations</th>
                <th className="py-4 px-6 text-center">Registration Control</th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm font-poppins text-dark-900 divide-y divide-[#E5E7EB]">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-dark-500">
                    <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    Loading events...
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-dark-500">
                    No events found matching your search.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event, i) => {
                  const regOpen = event.registrationOpen !== false;
                  return (
                    <motion.tr
                      key={event._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-white/80 transition-colors"
                    >
                      <td className="py-4 px-6 font-semibold">{event.title}</td>
                      <td className="py-4 px-6">
                        <span className="px-2 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-700">
                          {event.category}
                        </span>
                      </td>
                      <td className="py-4 px-6">{formatDate(event.date)}</td>
                      <td className="py-4 px-6">
                        {event.internalPrice === 0 && event.externalPrice === 0 
                          ? <span className="text-green-600 font-bold">FREE</span>
                          : formatCurrency(Math.max(event.internalPrice, event.externalPrice))}
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200">
                          {event.registeredCount || 0} / {event.seatLimit || '∞'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <span className={`text-xs font-bold font-sora ${regOpen ? 'text-emerald-600' : 'text-red-500'}`}>
                            {regOpen ? '🟢 OPEN' : '🔴 CLOSED'}
                          </span>
                          <button
                            onClick={() => handleToggleRegistration(event._id, regOpen)}
                            className={`w-12 h-6 flex items-center rounded-full p-1 transition-all duration-300 outline-none ${
                              regOpen ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'
                            }`}
                          >
                            <motion.div 
                              layout 
                              className="w-4 h-4 rounded-full bg-white shadow-md"
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => navigate(`/events/${event._id}`)}
                            className="p-2 text-dark-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <FiEye className="text-lg" />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/edit-event/${event._id}`)}
                            className="p-2 text-dark-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit Event"
                          >
                            <FiEdit2 className="text-lg" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ isOpen: true, event })}
                            className="p-2 text-dark-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Event"
                          >
                            <FiTrash2 className="text-lg" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && deleteModal.event && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/40 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-xl border border-[#E5E7EB]"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 text-red-600">
                <FiAlertTriangle size={24} />
              </div>
              <h3 className="text-2xl font-black font-sora text-dark-900">Delete Event</h3>
            </div>
            
            {deleteModal.event.registeredCount > 0 ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-800 text-sm font-poppins">
                <p className="font-bold mb-1">Warning: {deleteModal.event.registeredCount} active registrations.</p>
                <p>This event already has registered students. Deleting it will also remove all registrations, payments, attendance records, QR codes, and certificates related to this event.</p>
              </div>
            ) : (
              <p className="text-dark-600 text-sm font-poppins mb-6">
                Are you sure you want to delete <span className="font-bold text-dark-900">{deleteModal.event.title}</span>? This action cannot be undone.
              </p>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
              <button
                onClick={() => !isDeleting && setDeleteModal({ isOpen: false, event: null })}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm text-dark-600 hover:bg-dark-900/5 transition-colors disabled:opacity-50"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <FiTrash2 />
                )}
                {isDeleting ? 'Deleting...' : 'Delete Event'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
