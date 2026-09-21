import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { FiCalendar, FiMapPin, FiUsers, FiTag, FiPhone, FiInfo, FiBookOpen, FiAward, FiShare2, FiBookmark } from 'react-icons/fi';
import { eventService } from '../services/eventService';
import { registrationService } from '../services/registrationService';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, getDefaultEventPoster } from '../utils/helpers';
import Badge from '../components/ui/Badge';
import GlassCard from '../components/ui/GlassCard';
import GradientButton from '../components/ui/GradientButton';
import Timeline from '../components/ui/Timeline';
import CountdownTimer from '../components/ui/CountdownTimer';
import RegistrationModal from '../components/registration/RegistrationModal';
import MockPaymentModal from '../components/payment/MockPaymentModal';
import WinnerCard from '../components/ui/WinnerCard';
import toast from 'react-hot-toast';

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, userType } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [myRegistration, setMyRegistration] = useState(null);
  const [results, setResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);

  useEffect(() => {
    loadEventDetails();
    const savedBookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    setIsBookmarked(savedBookmarks.includes(id));
  }, [id]);

  const loadEventDetails = async () => {
    setLoading(true);
    try {
      const data = await eventService.getEventById(id);
      setEvent(data.data);

      if (isAuthenticated && userType !== 'admin') {
        const myRegs = await registrationService.getMyRegistrations();
        if (myRegs.success) {
          const found = myRegs.data.find(r => r.eventId?._id === id || r.eventId === id || r.eventId?.id === id);
          setMyRegistration(found || null);
        }
      }

      // Check if event is completed, fetch results
      const now = new Date();
      const eventDate = new Date(data.data.date);
      if (eventDate < now) {
        setLoadingResults(true);
        const resResults = await eventService.getEventResults(id);
        if (resResults.success) {
          setResults(resResults.results || []);
        }
        setLoadingResults(false);
      }
    } catch (err) {
      console.warn('Failed to load event details from API, using fallback mock data:', err.message);
      // Fallback details mock object matching the URL index
      const mockEvents = {
        mock_event_1: {
          _id: 'mock_event_1',
          title: 'TechXplore 2026',
          description: 'The ultimate national-level technical symposium. Includes web dev, app design, paper presentations, and algorithmic challenges. Designed for engineering students to pitch their projects to industry professionals.',
          category: 'Tech',
          date: new Date(Date.now() + 86400000 * 5),
          time: '09:00 AM - 04:00 PM',
          venue: 'Main Auditorium',
          internalPrice: 0,
          externalPrice: 150,
          seatLimit: 300,
          registeredCount: 145,
          poster: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
          schedule: [
            { time: '09:00 AM - 10:00 AM', activity: 'Inauguration Ceremony', description: 'Opening speech by the Principal and Guest of Honor.' },
            { time: '10:00 AM - 01:00 PM', activity: 'Track 1: Web Dev Showcase', description: 'Presentations of web apps by registered teams.' },
            { time: '01:00 PM - 02:00 PM', activity: 'Lunch Break', description: 'Free buffet for all registered students.' },
            { time: '02:00 PM - 04:00 PM', activity: 'Track 2: Code Debugging & Closing', description: 'Quick-fire debugging test followed by award distribution.' }
          ],
          rules: [
            'Teams can consist of maximum 3 members.',
            'College ID cards are mandatory for verification.',
            'Laptops are required for the web dev track.',
            'Decisions of the judges will be final and binding.'
          ],
          prizes: [
            { position: '1st Place', amount: '₹10,000', description: 'Cash Prize + Internship Offer' },
            { position: '2nd Place', amount: '₹5,000', description: 'Cash Prize + Certificate of Merit' }
          ],
          coordinators: [
            { name: 'Dr. Rajesh Kumar', phone: '+91 98765 01234', role: 'Faculty Convenor' },
            { name: 'Karthik Raja', phone: '+91 87654 32109', role: 'Student Coordinator (CSE)' }
          ],
          brochureUrl: '#'
        },
        mock_event_2: {
          _id: 'mock_event_2',
          title: 'National Hackathon Alpha',
          description: 'A 36-hour intense hackathon where teams solve real-world problems in AI, Blockchain, and HealthTech. Grand prize pool of ₹1,00,000.',
          category: 'Hackathon',
          date: new Date(Date.now() + 86400000 * 12),
          time: '08:00 AM onwards',
          venue: 'CS R&D Lab',
          internalPrice: 200,
          externalPrice: 350,
          seatLimit: 100,
          registeredCount: 89,
          poster: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80',
          schedule: [
            { time: '08:00 AM - 09:00 AM', activity: 'Registration & Setup', description: 'Check-in and team workstation assignment.' },
            { time: '09:00 AM - 09:30 AM', activity: 'Problem Statements Reveal', description: 'Announcement of specific challenge statements.' },
            { time: '09:30 AM (Day 1) - 09:30 PM (Day 2)', activity: '36-hour Hacking Loop', description: 'Non-stop design, code, and deployment.' }
          ],
          rules: [
            'All code must be written during the hackathon. No pre-made code.',
            'Open-source libraries and APIs are allowed.',
            'Minimum 2, maximum 4 members per team.'
          ],
          prizes: [
            { position: 'Grand Winner', amount: '₹50,000', description: 'Cash Prize + Startup Incubation Support' },
            { position: 'Runner Up', amount: '₹30,000', description: 'Cash Prize + Gadgets Bundle' }
          ],
          coordinators: [
            { name: 'Prof. Anitha Sen', phone: '+91 91234 56789', role: 'Faculty Coordinator' }
          ]
        }
      };
      setEvent(mockEvents[id] || mockEvents.mock_event_1);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = () => {
    const savedBookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    let updated;
    if (isBookmarked) {
      updated = savedBookmarks.filter(item => item !== id);
      toast.success('Removed from bookmarks');
    } else {
      updated = [...savedBookmarks, id];
      toast.success('Added to bookmarks');
    }
    localStorage.setItem('bookmarks', JSON.stringify(updated));
    setIsBookmarked(!isBookmarked);
  };

  const handleRegisterClick = () => {
    if (!isAuthenticated) {
      toast('Please sign in to register.', { icon: '🔑' });
      navigate('/login');
      return;
    }

    if (userType === 'admin') {
      toast.error('Admins cannot register for events.');
      return;
    }

    setIsModalOpen(true);
  };

  const handleRegistrationSubmit = async (formData) => {
    setIsModalOpen(false);
    
    // Calculate fee to determine flow
    const isTeam = formData.registrationType === 'team';
    const teamSizeNum = isTeam ? Number(formData.teamSize) : 1;
    const rawFee = userType === 'student_internal' ? event.internalPrice : event.externalPrice;
    const singleFee = Number(rawFee) || 0;
    const totalFee = isTeam ? singleFee * teamSizeNum : singleFee;
    const isFree = totalFee <= 0;

    if (isFree) {
      // FREE EVENT FLOW: Call registration API directly
      setRegistering(true);
      try {
        const regData = await registrationService.registerForEvent(id, {
          ...formData,
          eventId: id
        });

        if (regData.success) {
          toast.success('Registration successful! Go to dashboard for QR code.');
          const increment = regData.data?.teamSize || 1;
          setEvent(prev => ({ ...prev, registeredCount: prev.registeredCount + increment }));
          navigate('/dashboard');
        } else {
          toast.error(regData.message || 'Registration failed');
        }
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || 'Something went wrong');
      } finally {
        setRegistering(false);
      }
    } else {
      // PAID EVENT FLOW: Do not call registration API. Open payment gateway directly.
      setPaymentDetails({
        amount: totalFee,
        registrationData: { ...formData, eventId: id },
        eventId: id,
        studentName: formData.fullName,
        usn: formData.usn,
        department: formData.department,
        collegeName: formData.collegeName,
        teamSize: teamSizeNum
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <p className="text-dark-900 text-lg font-bold">Event not found.</p>
        <GradientButton className="mt-4" onClick={() => navigate('/events')}>Back to Events</GradientButton>
      </div>
    );
  }

  const seatsLeft = event.seatLimit - event.registeredCount;
  const isPaid = event.internalPrice > 0 || event.externalPrice > 0;
  const priceToDisplay = userType === 'student_internal' ? event.internalPrice : event.externalPrice;

  return (
    <div className="relative w-full">
      {/* Subtle top decorative blur from poster */}
      <div className="absolute top-0 left-0 right-0 h-[300px] overflow-hidden opacity-10 pointer-events-none">
        <img src={event.poster || getDefaultEventPoster(event.category, event._id, event.title)} alt="" className="w-full h-full object-cover blur-[80px]" onError={(e) => { e.target.onerror = null; e.target.src = getDefaultEventPoster(event.category, event._id, event.title); }} />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Media & details */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Winners Section (Shows up first if results are available) */}
          {Array.isArray(results) && results.length > 0 && (
            <div className="mb-4">
              <h2 className="text-3xl font-black font-sora text-dark-900 mb-6 flex items-center gap-3">
                <span className="text-4xl">🏆</span> Event Winners
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {results.map((res) => (
                  <WinnerCard key={res._id} result={res} />
                ))}
              </div>

              {/* Event Statistics */}
              <GlassCard className="mt-8 p-6 border border-[#E5E7EB]">
                <h3 className="text-lg font-bold font-sora text-dark-900 mb-4">Event Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="p-4 bg-dark-50 rounded-xl border border-[#E5E7EB]">
                    <p className="text-3xl font-black text-primary-600 font-sora">{event.registeredCount}</p>
                    <p className="text-xs font-semibold uppercase text-dark-500 mt-1">Registered</p>
                  </div>
                  <div className="p-4 bg-dark-50 rounded-xl border border-[#E5E7EB]">
                    <p className="text-3xl font-black text-emerald-600 font-sora">{event.registeredCount}</p>
                    <p className="text-xs font-semibold uppercase text-dark-500 mt-1">Attended</p>
                  </div>
                  <div className="p-4 bg-dark-50 rounded-xl border border-[#E5E7EB]">
                    <p className="text-3xl font-black text-blue-600 font-sora">{event.registeredCount}</p>
                    <p className="text-xs font-semibold uppercase text-dark-500 mt-1">Certificates</p>
                  </div>
                  <div className="p-4 bg-dark-50 rounded-xl border border-[#E5E7EB]">
                    <p className="text-3xl font-black text-amber-500 font-sora">Yes</p>
                    <p className="text-xs font-semibold uppercase text-dark-500 mt-1">Winner Declared</p>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}

          {/* Main Large Poster */}
          <div className="relative w-full h-[350px] md:h-[450px] rounded-[32px] overflow-hidden border border-white/10 shadow-2xl">
            <img src={event.poster || getDefaultEventPoster(event.category, event._id, event.title)} alt={event.title} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = getDefaultEventPoster(event.category, event._id, event.title); }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            
            {/* Category tag */}
            <div className="absolute top-6 left-6 z-10">
              <Badge category={event.category} size="lg" />
            </div>

            {/* Poster bottom titles */}
            <div className="absolute bottom-8 left-8 right-8 flex flex-col md:flex-row md:items-end justify-between gap-4 z-10">
              <div>
                <h1 className="text-3xl md:text-5xl font-black font-sora text-white leading-tight">
                  {event.title}
                </h1>
                <p className="text-sm font-semibold text-primary-300 mt-2 flex items-center gap-1.5">
                  <FiCalendar /> {formatDate(event.date)} &bull; {event.startTime ? `${event.startTime} - ${event.endTime}` : event.time || '09:00 AM onwards'}
                </p>
              </div>
            </div>
          </div>

          {/* About The Event Card */}
          <GlassCard className="p-8">
            <h3 className="text-xl font-bold font-sora text-dark-900 mb-6 flex items-center gap-2">
              <FiInfo className="text-primary-500" /> About The Event
            </h3>

            {/* Organizer row */}
            <div className="flex items-center gap-3 mb-5 px-4 py-3 rounded-2xl bg-primary-50 border border-primary-100">
              <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white flex-shrink-0">
                <FiUsers size={14} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-primary-400 uppercase tracking-wider">Organized By</p>
                <p className="text-sm font-bold text-dark-900 font-sora">{event.organizer || 'College Event Hub'}</p>
              </div>
            </div>

            {/* Key event info grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB]">
                <FiTag className="text-secondary-500 text-base flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-dark-400 uppercase tracking-wider">Category</p>
                  <p className="text-xs font-bold text-dark-900 font-sora">{event.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB]">
                <FiMapPin className="text-accent-500 text-base flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-dark-400 uppercase tracking-wider">Venue</p>
                  <p className="text-xs font-bold text-dark-900 font-sora truncate">{event.venue}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB]">
                <FiCalendar className="text-primary-500 text-base flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-dark-400 uppercase tracking-wider">Date</p>
                  <p className="text-xs font-bold text-dark-900 font-sora">{formatDate(event.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB]">
                <FiUsers className="text-emerald-500 text-base flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-dark-400 uppercase tracking-wider">Total Seats</p>
                  <p className="text-xs font-bold text-dark-900 font-sora">{event.seatLimit} seats</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-xs font-bold text-dark-400 uppercase tracking-wider mb-2">Description</p>
              <p className="text-sm text-dark-600 font-poppins leading-relaxed whitespace-pre-line">
                {event.description || 'No description provided for this event. Please contact the organizer for more details.'}
              </p>
            </div>
          </GlassCard>

          {/* Schedule Timeline */}
          {event.schedule && event.schedule.length > 0 && (
            <GlassCard className="p-8">
              <h3 className="text-xl font-bold font-sora text-dark-900 mb-4 flex items-center gap-2">
                <FiBookOpen className="text-secondary-500" /> Event Timeline
              </h3>
              <Timeline items={event.schedule} />
            </GlassCard>
          )}

          {/* Rules Card */}
          {event.rules && event.rules.length > 0 && (
            <GlassCard className="p-8">
              <h3 className="text-xl font-bold font-sora text-dark-900 mb-4 flex items-center gap-2">
                <FiInfo className="text-accent-500" /> Rules & Regulations
              </h3>
              <ul className="flex flex-col gap-3">
                {event.rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-dark-700 font-poppins leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-500 mt-2 flex-shrink-0" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          )}
        </div>

        {/* Right Column: Checkout details, timer, CTA */}
        <div className="flex flex-col gap-8">
          {/* Quick Register checkout card */}
          <GlassCard glow="purple" className="p-8 border-primary-500/20">
            {/* Live Countdown */}
            <div className="mb-6 pb-6 border-b border-[#E5E7EB]">
              <CountdownTimer targetDate={event.date} label="Registrations Closing In" />
            </div>

            {/* Price Details */}
            <div className="flex justify-between items-baseline mb-6">
              <span className="text-sm font-semibold text-dark-700 uppercase tracking-wider">Registration Fee</span>
              <div className="text-right">
                <span className="text-3xl font-black font-sora text-dark-900">
                  {isPaid ? (
                    userType === 'student_internal' ? 'FREE' : formatCurrency(event.externalPrice)
                  ) : (
                    'FREE'
                  )}
                </span>
                {isPaid && (
                  <p className="text-[10px] text-dark-600 font-bold uppercase mt-1">
                    {userType === 'student_internal' ? 'Internal Student Rate' : 'External Student Rate'}
                  </p>
                )}
              </div>
            </div>

            {/* Seat Capacity */}
            <div className="mb-8">
              <div className="flex justify-between text-xs font-bold text-dark-700 uppercase tracking-wider mb-2">
                <span>Seat Capacity</span>
                <span className="text-primary-600">{seatsLeft} / {event.seatLimit} Available</span>
              </div>
              <div className="w-full h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
                  style={{ width: `${(seatsLeft / event.seatLimit) * 100}%` }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-4">
              {myRegistration ? (
                myRegistration.paymentStatus === 'pending' ? (
                  <GradientButton
                    variant="gradient"
                    size="lg"
                    onClick={() => setPaymentDetails({
                      amount: userType === 'student_internal' ? event.internalPrice : event.externalPrice,
                      registrationId: myRegistration._id,
                      studentName: myRegistration.fullName,
                      usn: myRegistration.usn,
                      department: myRegistration.department,
                      collegeName: myRegistration.collegeName
                    })}
                    className="w-full"
                  >
                    Complete Payment
                  </GradientButton>
                ) : (
                  <span className="w-full py-4 text-center bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-2xl font-bold text-sm">
                    Already Registered
                  </span>
                )
              ) : event.registrationOpen === false ? (
                <div className="flex flex-col gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-center">
                  <span className="text-red-600 font-bold text-sm font-sora">🔴 Registration Closed</span>
                  <span className="text-xs text-red-500 font-poppins">Registration for this event is currently closed.</span>
                </div>
              ) : seatsLeft <= 0 ? (
                <div className="flex flex-col gap-2 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-center">
                  <span className="text-amber-600 font-bold text-sm font-sora">Registration Full</span>
                  <span className="text-xs text-amber-500 font-poppins">All {event.seatLimit} seats have been filled.</span>
                </div>
              ) : (
                <GradientButton
                  variant="gradient"
                  size="lg"
                  onClick={handleRegisterClick}
                  loading={registering}
                  className="w-full"
                >
                  Register Now
                </GradientButton>
              )}

              <div className="grid grid-cols-2 gap-3">
                <GradientButton
                  variant="secondary"
                  size="md"
                  onClick={handleBookmark}
                  icon={FiBookmark}
                  className="w-full"
                >
                  {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                </GradientButton>

                <GradientButton
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('Link copied!');
                  }}
                  icon={FiShare2}
                  className="w-full"
                >
                  Share
                </GradientButton>
              </div>
            </div>
          </GlassCard>

          {/* Prizes Details Card */}
          {event.prizes && event.prizes.length > 0 && (
            <GlassCard glow="pink" className="p-8 border-secondary-500/20">
              <h3 className="text-xl font-bold font-sora text-dark-900 mb-6 flex items-center gap-2">
                <FiAward className="text-secondary-500" /> Reward Arena
              </h3>
              <div className="flex flex-col gap-4">
                {event.prizes.map((prize, idx) => (
                  <div key={idx} className="flex items-center gap-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-4">
                    <div className="text-3xl">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                    </div>
                    <div>
                      <h4 className="font-bold text-dark-900 text-base font-sora">{prize.position}</h4>
                      <p className="text-xs text-dark-600 font-poppins mt-0.5">{prize.description}</p>
                      <p className="text-sm font-extrabold text-secondary-600 mt-1 font-sora">{prize.amount}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Coordinators Details Card */}
          {event.coordinators && event.coordinators.length > 0 && (
            <GlassCard className="p-8">
              <h3 className="text-xl font-bold font-sora text-dark-900 mb-6 flex items-center gap-2">
                <FiPhone className="text-accent-500" /> Contact Support
              </h3>
              <div className="flex flex-col gap-4">
                {event.coordinators.map((coord, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-4">
                    <div>
                      <h4 className="font-bold text-dark-900 text-sm font-sora">{coord.name}</h4>
                      <p className="text-[10px] text-dark-600 font-bold uppercase mt-0.5">{coord.role}</p>
                    </div>
                    <a
                      href={`tel:${coord.phone}`}
                      className="text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors border border-primary-500/30 px-3 py-1.5 rounded-xl hover:bg-primary-500/10"
                    >
                      Call
                    </a>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      </div>

      {/* Modals */}
      <RegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        event={event}
        onRegisterSuccess={handleRegistrationSubmit}
      />
      
      <MockPaymentModal
        isOpen={!!paymentDetails}
        onClose={() => {
          setPaymentDetails(null);
          setRegistering(false);
        }}
        amount={paymentDetails?.amount}
        eventTitle={event?.title}
        eventId={paymentDetails?.eventId}
        registrationData={paymentDetails?.registrationData}
        studentName={paymentDetails?.studentName}
        usn={paymentDetails?.usn}
        department={paymentDetails?.department}
        collegeName={paymentDetails?.collegeName}
        eventDate={event?.date}
        eventVenue={event?.venue}
        eventTime={event?.time}
        eventPoster={event?.poster}
        onSuccess={() => {
          const increment = paymentDetails?.teamSize || 1;
          setPaymentDetails(null);
          setEvent(prev => ({ ...prev, registeredCount: prev.registeredCount + increment }));
          navigate('/dashboard');
        }}
        onFailure={() => {
          setPaymentDetails(null);
          setRegistering(false);
        }}
      />
    </div>
  );
}
