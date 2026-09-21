import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { FiCalendar, FiMapPin, FiUsers, FiBookOpen, FiImage, FiAward, FiClock, FiDollarSign } from 'react-icons/fi';
import { eventService } from '../services/eventService';
import { formatDate, getDefaultEventPoster } from '../utils/helpers';
import GradientButton from '../components/ui/GradientButton';

export default function EventResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadEventDetails();
  }, [id]);

  const loadEventDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await eventService.getEventFullDetails(id);
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError('Event not found');
      }
    } catch (err) {
      console.error(err);
      setError('Event not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data || !data.event) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <p className="text-red-500 text-lg font-bold">{error || 'Event not found'}</p>
        <GradientButton className="mt-4" onClick={() => navigate('/completed-events')}>Back to Events</GradientButton>
      </div>
    );
  }

  const { event, organizer, winners, gallery } = data;
  const hostCollege = organizer?.name || 'Shanmugha College of Engineering and Technology';

  const renderWinnerCard = (winner, rankLabel, color, icon) => {
    if (!winner) return null;
    
    const formattedPrize = winner.prizeType.includes('Cash') && winner.cashAmount > 0
      ? winner.prizeType.replace('Cash', `₹${Number(winner.cashAmount).toLocaleString()} Cash`)
      : winner.prizeType;
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full bg-[#f8fafc] border border-${color}-200 rounded-3xl p-6 shadow-sm mb-6`}
      >
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl bg-${color}-100 border-2 border-${color}-300 shadow-inner`}>
              {icon}
            </div>
            {winner.photoUrl ? (
              <img src={winner.photoUrl} alt={winner.winnerName} className="w-16 h-16 rounded-full object-cover border border-slate-200" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 text-xs text-center border border-slate-300">No Photo</div>
            )}
          </div>
          
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className={`text-xs font-bold text-${color}-600 uppercase tracking-widest mb-1`}>{rankLabel} PRIZE</p>
              <h3 className="text-2xl font-bold font-sora text-dark-900 mb-1">{winner.winnerName}</h3>
              <p className="text-sm text-dark-600 mb-4">{winner.collegeName}</p>
              
              <div className="space-y-1">
                <p className="text-xs text-dark-500"><span className="font-bold text-dark-700">Dept:</span> {winner.department}</p>
                <p className="text-xs text-dark-500"><span className="font-bold text-dark-700">Year:</span> {winner.year}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col justify-center">
              <div className="mb-4">
                <p className="text-xs font-bold text-dark-400 uppercase tracking-wider mb-1">Prize Awarded</p>
                <p className="text-sm font-bold text-dark-900">
                  {formattedPrize}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="w-full bg-[#f8fafc] min-h-screen pb-20">
      {/* Event Information Banner */}
      <div className="relative w-full h-[350px] overflow-hidden bg-dark-900">
        <img 
          src={event.poster || getDefaultEventPoster(event.category, event._id, event.title)} 
          alt={event.title} 
          className="w-full h-full object-cover opacity-60" 
          onError={(e) => { e.target.onerror = null; e.target.src = getDefaultEventPoster(event.category, event._id, event.title); }} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/60 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-6 py-10">
          <div className="inline-block px-3 py-1 mb-3 bg-primary-500/20 backdrop-blur-md rounded-lg text-primary-300 text-xs font-bold font-sora tracking-widest uppercase border border-primary-500/30">
            {event.category}
          </div>
          <h1 className="text-4xl md:text-5xl font-black font-sora text-white leading-tight mb-4">
            {event.title}
          </h1>
          <p className="text-slate-300 text-sm max-w-3xl line-clamp-2 mb-6">
            {event.description}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Sidebar: Event Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold font-sora text-dark-900 mb-6 border-b border-slate-100 pb-3">
              Event Information
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <FiCalendar className="text-primary-500 mt-0.5" />
                <div>
                  <p className="text-xs text-dark-400 font-semibold uppercase">Date</p>
                  <p className="text-sm font-medium text-dark-900">{formatDate(event.date)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FiClock className="text-primary-500 mt-0.5" />
                <div>
                  <p className="text-xs text-dark-400 font-semibold uppercase">Time</p>
                  <p className="text-sm font-medium text-dark-900">{event.startTime ? `${event.startTime} - ${event.endTime}` : event.time || '09:00 AM onwards'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FiMapPin className="text-primary-500 mt-0.5" />
                <div>
                  <p className="text-xs text-dark-400 font-semibold uppercase">Venue</p>
                  <p className="text-sm font-medium text-dark-900">{event.venue}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FiBookOpen className="text-primary-500 mt-0.5" />
                <div>
                  <p className="text-xs text-dark-400 font-semibold uppercase">Organizer / Department</p>
                  <p className="text-sm font-medium text-dark-900">{hostCollege}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FiUsers className="text-primary-500 mt-0.5" />
                <div>
                  <p className="text-xs text-dark-400 font-semibold uppercase">Participants & Seats</p>
                  <p className="text-sm font-medium text-dark-900">{event.registeredCount} / {event.seatLimit || 'Unlimited'} Seats</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FiDollarSign className="text-primary-500 mt-0.5" />
                <div>
                  <p className="text-xs text-dark-400 font-semibold uppercase">Registration Fee</p>
                  <p className="text-sm font-medium text-dark-900">
                    Internal: {event.internalPrice > 0 ? `₹${event.internalPrice}` : 'Free'} | External: {event.externalPrice > 0 ? `₹${event.externalPrice}` : 'Free'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold font-sora text-dark-900 mb-6 border-b border-slate-100 pb-3 flex items-center gap-2">
              <FiImage className="text-primary-500" /> Event Gallery
            </h3>
            {(!gallery || gallery.length === 0) ? (
              <div className="py-8 text-center text-dark-400 text-sm">
                <FiImage className="mx-auto text-3xl mb-2 opacity-30" />
                <p>No Gallery Images</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {gallery.map((img, i) => (
                  <img key={i} src={img} alt="Gallery" className="w-full h-24 object-cover rounded-lg" />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Content: Winners */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <h2 className="text-3xl font-black font-sora text-dark-900 mb-8 flex items-center gap-3">
              <span className="text-4xl">🏆</span> Event Winners
            </h2>

            {!winners || !winners.firstPrize ? (
              <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                <FiAward className="mx-auto text-5xl text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-dark-500">Winner Not Announced</h3>
                <p className="text-sm text-dark-400 mt-2">The results for this event have not been published yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {renderWinnerCard(winners.firstPrize, 'First', 'amber', '🥇')}
                {renderWinnerCard(winners.secondPrize, 'Second', 'slate', '🥈')}
                {renderWinnerCard(winners.thirdPrize, 'Third', 'orange', '🥉')}
              </div>
            )}
            
          </div>
          
          <div className="mt-8 text-center">
            <GradientButton onClick={() => navigate('/completed-events')}>
              Back to Completed Events
            </GradientButton>
          </div>
        </div>
        
      </div>
    </div>
  );
}
