import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { eventService } from '../services/eventService';
import { registrationService } from '../services/registrationService';
import { formatDate, getDefaultEventPoster } from '../utils/helpers';
import { FiCalendar, FiClock, FiMapPin, FiTrash2, FiEdit2, FiAlertTriangle, FiBookOpen, FiBookmark, FiSearch } from 'react-icons/fi';
import GlassCard from '../components/ui/GlassCard';
import StatusBadge from '../components/ui/StatusBadge';
import GradientButton from '../components/ui/GradientButton';
import toast from 'react-hot-toast';

export default function CompletedEvents() {
  const navigate = useNavigate();
  const { userType, isAuthenticated } = useAuth();
  
  const [completedEvents, setCompletedEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, event: null });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadCompletedEventsData();
  }, []);

  const loadCompletedEventsData = async () => {
    setLoading(true);
    try {
      // Parallel loading of completed events and student registrations
      const [eventsResponse, regsResponse] = await Promise.allSettled([
        eventService.getCompletedEvents(),
        isAuthenticated && userType !== 'admin' ? registrationService.getMyRegistrations() : Promise.resolve({ data: [] })
      ]);

      if (eventsResponse.status === 'fulfilled' && eventsResponse.value.success) {
        setCompletedEvents(eventsResponse.value.data || []);
      } else {
        toast.error('Failed to load completed events.');
      }

      if (regsResponse.status === 'fulfilled' && regsResponse.value.success) {
        setMyRegistrations(regsResponse.value.data || []);
      }
    } catch (error) {
      toast.error('Error loading data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (event, e) => {
    e.stopPropagation();
    setDeleteModal({ isOpen: true, event });
  };

  const confirmDelete = async () => {
    if (!deleteModal.event) return;
    setIsDeleting(true);
    try {
      await eventService.deleteEvent(deleteModal.event._id);
      toast.success('Completed event deleted successfully.');
      setCompletedEvents(prev => prev.filter(e => e._id !== deleteModal.event._id));
      setDeleteModal({ isOpen: false, event: null });
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete completed event.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getAttendanceBadge = (eventId) => {
    const reg = myRegistrations.find(
      r => r.eventId?._id === eventId || r.eventId === eventId || r.eventId?.id === eventId
    );
    if (!reg) return <StatusBadge status="Not Registered" variant="slate" />;
    
    if (reg.attendanceStatus === 'present') {
      return <StatusBadge status="Present ✅" variant="emerald" />;
    } else {
      return <StatusBadge status="Absent" variant="rose" />;
    }
  };

  const filteredEvents = completedEvents.filter(event =>
    (event.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (event.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (event.organizer || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 relative z-10 flex flex-col gap-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-secondary-500 uppercase tracking-widest font-sora mb-2 block">
            {userType === 'admin' ? 'Control Room' : 'Academic Hub'}
          </span>
          <h1 className="text-3xl md:text-5xl font-black font-sora text-dark-900">
            COMPLETED <span className="gradient-text">EVENTS</span>
          </h1>
          <p className="text-sm text-dark-600 font-poppins mt-2">
            {userType === 'admin' 
              ? 'Manage previously completed events, edit details, or remove them permanently.'
              : 'Browse all events that have concluded and check your attendance statuses.'}
          </p>
        </div>
      </div>

      {/* Toolbar Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative w-full md:w-96">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 text-lg z-10" />
          <input
            type="text"
            placeholder="Search completed events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/50 backdrop-blur-md border border-[#E5E7EB] focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all font-poppins text-sm text-dark-900"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium text-dark-500 font-poppins">Loading completed events...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-20 bg-white border border-[#E5E7EB] rounded-3xl p-10 max-w-lg mx-auto shadow-sm">
          <p className="text-dark-500 font-medium mb-2 text-lg font-sora">No completed events found.</p>
          <p className="text-xs text-dark-400 font-poppins mb-6">There are no completed events matching the selection.</p>
          <GradientButton variant="secondary" size="sm" onClick={() => setSearchTerm('')}>
            Clear Search
          </GradientButton>
        </div>
      ) : userType === 'admin' ? (
        /* ================= ADMIN VIEW (TABLE LIST) ================= */
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-[#E5E7EB] shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-dark-900/5 text-dark-600 text-xs uppercase tracking-wider font-semibold font-sora">
                  <th className="py-4 px-6">Event poster</th>
                  <th className="py-4 px-6">Event Name</th>
                  <th className="py-4 px-6">Organizer</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Time</th>
                  <th className="py-4 px-6">Venue</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm font-poppins text-dark-900 divide-y divide-[#E5E7EB]">
                <AnimatePresence>
                  {filteredEvents.map((event, i) => (
                    <motion.tr
                      key={event._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-white/80 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <img
                          src={event.poster || getDefaultEventPoster(event.category, event._id, event.title)}
                          alt={event.title}
                          className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                          onError={(e) => { e.target.onerror = null; e.target.src = getDefaultEventPoster(event.category, event._id, event.title); }}
                        />
                      </td>
                      <td className="py-4 px-6 font-semibold">{event.title}</td>
                      <td className="py-4 px-6 text-dark-600">{event.organizer || 'College Event Hub'}</td>
                      <td className="py-4 px-6">
                        <span className="px-2 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-700">
                          {event.category}
                        </span>
                      </td>
                      <td className="py-4 px-6">{formatDate(event.date)}</td>
                      <td className="py-4 px-6 text-xs text-dark-600">{event.startTime ? `${event.startTime} - ${event.endTime}` : event.time}</td>
                      <td className="py-4 px-6 text-dark-600">{event.venue}</td>
                      <td className="py-4 px-6">
                        <StatusBadge status="Completed ✅" variant="emerald" />
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => navigate(`/admin/edit-event/${event._id}`)}
                            className="p-2 text-dark-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit Event"
                          >
                            <FiEdit2 className="text-lg" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(event, e)}
                            className="p-2 text-dark-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Event"
                          >
                            <FiTrash2 className="text-lg" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ================= STUDENT VIEW (CARDS GRID) ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {filteredEvents.map((event) => (
              <motion.div
                key={event._id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <GlassCard
                  hover={false}
                  className="flex flex-col h-[530px] p-0 relative overflow-hidden border border-[#E5E7EB] transition-all shadow-md bg-white hover:shadow-lg"
                >
                  {/* Banner Image */}
                  <div className="relative w-full h-[200px] overflow-hidden">
                    <img
                      src={event.poster || getDefaultEventPoster(event.category, event._id, event.title)}
                      alt={event.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.onerror = null; e.target.src = getDefaultEventPoster(event.category, event._id, event.title); }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    {/* Badges Overlay */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                      <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider bg-white/95 text-dark-900 rounded-md border border-white/50 shadow-sm font-sora">
                        {event.category}
                      </span>
                      {event.hasResults ? (
                        <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider bg-yellow-400 text-yellow-900 rounded-md border border-yellow-500 shadow-sm font-sora flex items-center gap-1">
                          🏆 Results Published
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider bg-white/95 text-slate-500 rounded-md border border-slate-200 shadow-sm font-sora">
                          Results Pending
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold font-sora text-dark-900 mb-1 leading-tight">
                        {event.title}
                      </h3>
                      <span className="text-xs text-primary-500 font-semibold mb-3 block font-poppins">
                        Organized by: {event.organizer || 'College Event Hub'}
                      </span>
                      <p className="text-xs text-dark-500 font-poppins leading-relaxed line-clamp-4 mb-4">
                        {event.description}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2.5 pt-4 border-t border-[#E5E7EB]">
                      <div className="flex items-center gap-2.5 text-xs text-dark-600 font-medium font-poppins">
                        <FiCalendar className="text-primary-500 text-sm flex-shrink-0" />
                        <span>{formatDate(event.date)}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-dark-600 font-medium font-poppins">
                        <FiClock className="text-primary-500 text-sm flex-shrink-0" />
                        <span>{event.startTime ? `${event.startTime} - ${event.endTime}` : event.time}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-dark-600 font-medium font-poppins">
                        <FiMapPin className="text-primary-500 text-sm flex-shrink-0" />
                        <span className="truncate">{event.venue}</span>
                      </div>
                      
                      {/* Attendance & View Results */}
                      <div className="flex flex-col gap-3 mt-3 pt-3 border-t border-dashed border-[#E5E7EB]">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-dark-500 font-sora">Your Attendance:</span>
                          {getAttendanceBadge(event._id)}
                        </div>
                        <button
                          onClick={() => navigate(`/event/${event._id}/result`)}
                          className="w-full text-center px-4 py-2.5 bg-dark-50 hover:bg-dark-100 text-dark-900 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors border border-[#E5E7EB] font-sora"
                        >
                          View Full Details
                        </button>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Delete Confirmation Modal (Admin Only) */}
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
              <h3 className="text-2xl font-black font-sora text-dark-900">Delete Completed Event</h3>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-800 text-sm font-poppins">
              <p className="font-bold mb-1">Warning: Permanent Deletion</p>
              <p>Are you sure you want to delete this completed event? This will also purge all attendee registrations, payments, certificates, and scan logs associated with this event.</p>
            </div>

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
