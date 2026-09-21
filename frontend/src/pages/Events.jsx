import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Tilt from 'react-parallax-tilt';
import { motion, AnimatePresence } from 'motion/react';
import { FiSearch, FiCalendar, FiMapPin, FiUsers, FiTag, FiBookmark, FiShare2 } from 'react-icons/fi';
import { eventService } from '../services/eventService';
import { formatCurrency, formatDate, getDefaultEventPoster } from '../utils/helpers';
import Badge from '../components/ui/Badge';
import SearchBar from '../components/ui/SearchBar';
import FilterChips from '../components/ui/FilterChips';
import GlassCard from '../components/ui/GlassCard';
import GradientButton from '../components/ui/GradientButton';
import { SkeletonEvent } from '../components/ui/Skeleton';
import toast from 'react-hot-toast';

export default function Events() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCost, setSelectedCost] = useState(''); // 'free', 'paid'
  const [bookmarks, setBookmarks] = useState(() => {
    return JSON.parse(localStorage.getItem('bookmarks') || '[]');
  });

  const categories = [
    { label: 'All Events', value: '' },
    { label: 'Tech', value: 'Tech' },
    { label: 'Non-Tech', value: 'Non-Tech' },
    { label: 'Workshop', value: 'Workshop' },
    { label: 'Hackathon', value: 'Hackathon' },
    { label: 'Sports', value: 'Sports' },
    { label: 'Seminar', value: 'Seminar' },
    { label: 'Cultural', value: 'Cultural' }
  ];

  const costFilters = [
    { label: 'All Costs', value: '' },
    { label: 'Free', value: 'free' },
    { label: 'Paid', value: 'paid' }
  ];

  useEffect(() => {
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    loadEvents();
  }, [selectedCategory, selectedCost]);

  // Auto-refresh every 60 seconds so events that pass their end time
  // disappear from Current Events without requiring a manual page refresh.
  useEffect(() => {
    const interval = setInterval(() => {
      loadEvents();
    }, 60_000);
    return () => clearInterval(interval);
  }, [selectedCategory, selectedCost]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await eventService.getAllEvents({
        category: selectedCategory,
        priceType: selectedCost
      });
      setEvents(data.data || []);
    } catch (err) {
      console.warn('Failed to load events from server, rendering mock events:', err.message);
      // Premium Mock Events
      const mockEvents = [
        {
          _id: 'mock_event_1',
          title: 'TechXplore 2026',
          description: 'The ultimate national-level technical symposium. Includes web dev, app design, paper presentations, and algorithmic challenges.',
          category: 'Tech',
          date: new Date(Date.now() + 86400000 * 5),
          venue: 'Main Auditorium',
          internalPrice: 0,
          externalPrice: 150,
          seatLimit: 300,
          registeredCount: 145,
          poster: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60'
        },
        {
          _id: 'mock_event_2',
          title: 'National Hackathon Alpha',
          description: 'A 36-hour intense hackathon where teams solve real-world problems in AI, Blockchain, and HealthTech. Grand prize pool of ₹1,00,000.',
          category: 'Hackathon',
          date: new Date(Date.now() + 86400000 * 12),
          venue: 'CS R&D Lab',
          internalPrice: 200,
          externalPrice: 350,
          seatLimit: 100,
          registeredCount: 89,
          poster: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=60'
        },
        {
          _id: 'mock_event_3',
          title: 'Euphoria Cultural Fest',
          description: 'Unleash your creative energy. Dance, music, theatrical segments, fashion show, and stand-up events with celebrity judges.',
          category: 'Cultural',
          date: new Date(Date.now() + 86400000 * 20),
          venue: 'NEI Open Air Theater',
          internalPrice: 100,
          externalPrice: 250,
          seatLimit: 1000,
          registeredCount: 654,
          poster: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=60'
        },
        {
          _id: 'mock_event_4',
          title: 'Sports Meet Blitz',
          description: 'Inter-college sports arena. Football tournaments, basketball matches, high jump, track dashes, and table tennis divisions.',
          category: 'Sports',
          date: new Date(Date.now() + 86400000 * 3),
          venue: 'NEI Stadium Complex',
          internalPrice: 0,
          externalPrice: 100,
          seatLimit: 200,
          registeredCount: 192,
          poster: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=60'
        },
        {
          _id: 'mock_event_5',
          title: 'Generative AI Workshop',
          description: 'Hands-on bootcamp on LLMs, Retrieval Augmented Generation (RAG), LangChain, and deploying AI models locally.',
          category: 'Workshop',
          date: new Date(Date.now() + 86400000 * 8),
          venue: 'Seminar Hall B',
          internalPrice: 50,
          externalPrice: 120,
          seatLimit: 120,
          registeredCount: 110,
          poster: 'https://images.unsplash.com/photo-1591453089816-0fbb971b454c?w=800&auto=format&fit=crop&q=60'
        },
        {
          _id: 'mock_event_6',
          title: 'Entrepreneurship Seminar',
          description: 'Hear from unicorn founders, venture capital experts, and incubator mentors on bootstrapping, pitching, and raising Series A.',
          category: 'Seminar',
          date: new Date(Date.now() + 86400000 * 15),
          venue: 'MBA Conference Room',
          internalPrice: 0,
          externalPrice: 0,
          seatLimit: 150,
          registeredCount: 60,
          poster: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&auto=format&fit=crop&q=60'
        }
      ];

      // Client-side filtering of mock data
      let filtered = mockEvents;
      if (selectedCategory) {
        filtered = filtered.filter(e => e.category === selectedCategory);
      }
      if (selectedCost) {
        filtered = filtered.filter(e => {
          const isFree = e.internalPrice === 0 && e.externalPrice === 0;
          return selectedCost === 'free' ? isFree : !isFree;
        });
      }
      setEvents(filtered);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = (id, e) => {
    e.stopPropagation();
    const isBookmarked = bookmarks.includes(id);
    if (isBookmarked) {
      setBookmarks(prev => prev.filter(item => item !== id));
      toast.success('Removed from bookmarks');
    } else {
      setBookmarks(prev => [...prev, id]);
      toast.success('Added to bookmarks');
    }
  };

  const handleShare = (event, e) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description,
        url: window.location.origin + `/events/${event._id}`
      })
      .catch(() => toast.error('Sharing failed'));
    } else {
      navigator.clipboard.writeText(window.location.origin + `/events/${event._id}`);
      toast.success('Link copied to clipboard!');
    }
  };

  // Client search query filtering
  const filteredEvents = events.filter(e =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
      {/* Title */}
      <div className="mb-10 text-center md:text-left">
        <span className="text-xs font-bold text-secondary-500 uppercase tracking-widest font-sora mb-2 block">EXPLORE ARENA</span>
        <h1 className="text-3xl md:text-5xl font-black font-sora text-dark-900">
          DISCOVER CAMPUS <span className="gradient-text">EVENTS</span>
        </h1>
        <p className="text-dark-600 text-sm md:text-base font-poppins mt-2 max-w-xl">
          Search workshops, hackathons, sports, and cultural festivals. Register instantly to reserve your seats.
        </p>
      </div>

      {/* Search and Filters Layout */}
      <div className="flex flex-col gap-6 mb-12">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search event titles, descriptions..." />
          <div className="w-full md:w-auto">
            <FilterChips filters={costFilters} selected={selectedCost} onSelect={setSelectedCost} />
          </div>
        </div>
        <div className="h-px w-full bg-[#E5E7EB] my-2" />
        <FilterChips filters={categories} selected={selectedCategory} onSelect={setSelectedCategory} />
      </div>

      {/* Grid of Event Posters */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <SkeletonEvent key={i} />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-20 bg-white border border-[#E5E7EB] rounded-3xl p-10 max-w-lg mx-auto shadow-sm">
          <p className="text-dark-500 font-medium mb-4 text-lg">No events match your search.</p>
          <GradientButton variant="secondary" size="sm" onClick={() => { setSearchQuery(''); setSelectedCategory(''); setSelectedCost(''); }}>
            Reset Filters
          </GradientButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {filteredEvents.map((event) => {
              const isBookmarked = bookmarks.includes(event._id);
              const seatsLeft = event.seatLimit - event.registeredCount;
              const seatsPercent = Math.max(0, (seatsLeft / event.seatLimit) * 100);
              const isFree = event.internalPrice === 0 && event.externalPrice === 0;

              return (
                <motion.div
                  key={event._id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <Tilt
                    tiltMaxAngleX={10}
                    tiltMaxAngleY={10}
                    scale={1.02}
                    transitionSpeed={2000}
                    className="h-full"
                  >
                    <GlassCard
                      hover={false}
                      className="flex flex-col h-[520px] p-0 relative overflow-hidden group cursor-pointer border border-[#E5E7EB] hover:border-primary-500 transition-all shadow-md hover:shadow-xl bg-white"
                      onClick={() => navigate(`/events/${event._id}`)}
                    >
                      {/* Event Poster Area */}
                      <div className="relative w-full h-[240px] overflow-hidden">
                        <img
                          src={event.poster || getDefaultEventPoster(event.category, event._id, event.title)}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          onError={(e) => { e.target.onerror = null; e.target.src = getDefaultEventPoster(event.category, event._id, event.title); }}
                        />
                        {/* Shading overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                        {/* Top Category and Action floating bar */}
                        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                          <Badge category={event.category} />
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => handleBookmark(event._id, e)}
                              className={`p-2 rounded-full border backdrop-blur-md transition-all ${
                                isBookmarked 
                                  ? 'bg-primary-500 border-primary-400 text-white shadow-glow-primary' 
                                  : 'bg-white/80 border-white/40 text-dark-800 hover:bg-white hover:text-primary-500'
                              }`}
                            >
                              <FiBookmark className="text-sm" />
                            </button>
                            <button
                              onClick={(e) => handleShare(event, e)}
                              className="p-2 rounded-full bg-white/80 border border-white/40 text-dark-800 hover:bg-white hover:text-primary-500 backdrop-blur-md transition-colors"
                            >
                              <FiShare2 className="text-sm" />
                            </button>
                          </div>
                        </div>

                        {/* Price floating tag */}
                        <div className="absolute bottom-4 left-4 z-10 flex gap-2">
                          <span className="px-3 py-1 bg-white/90 backdrop-blur text-sm font-black font-sora text-primary-600 rounded-lg shadow-sm border border-white/50">
                            IN: {event.internalPrice === 0 ? 'FREE' : formatCurrency(event.internalPrice)}
                          </span>
                          <span className="px-3 py-1 bg-dark-900/90 backdrop-blur text-sm font-black font-sora text-white rounded-lg shadow-sm">
                            EX: {event.externalPrice === 0 ? 'FREE' : formatCurrency(event.externalPrice)}
                          </span>
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-xl font-bold font-sora text-dark-900 mb-2 leading-tight group-hover:text-primary-500 transition-colors">
                            {event.title}
                          </h3>
                          <p className="text-xs text-dark-500 font-poppins leading-relaxed line-clamp-2">
                            {event.description}
                          </p>
                        </div>

                        <div className="mt-4 flex flex-col gap-2.5">
                          {/* Calendar & Location details */}
                          <div className="flex items-center gap-2 text-xs font-semibold text-dark-600">
                            <FiCalendar className="text-primary-500 flex-shrink-0" />
                            <span>{formatDate(event.date)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-semibold text-dark-600">
                            <FiMapPin className="text-secondary-500 flex-shrink-0" />
                            <span className="truncate">{event.venue}</span>
                          </div>

                          {/* Seats Status */}
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-[10px] font-bold text-dark-500 uppercase tracking-wide mb-1.5">
                              <span>Seats Remaining</span>
                              <span className={seatsLeft <= 10 ? 'text-red-500' : 'text-accent-600'}>
                                {seatsLeft} left
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  seatsPercent < 20 
                                    ? 'bg-red-500' 
                                    : seatsPercent < 50 
                                    ? 'bg-secondary-500' 
                                    : 'bg-accent-500'
                                }`}
                                style={{ width: `${seatsPercent}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Card bottom register border */}
                        <div className="border-t border-[#E5E7EB] pt-4 mt-4 flex items-center justify-between">
                          <span className="text-[10px] text-dark-500 font-bold uppercase tracking-wider">
                            Tracks: {event.category === 'Tech' ? 'CSE/IT/ECE' : 'All Departments'}
                          </span>
                          <GradientButton variant="primary" size="sm" className="py-1.5 px-4 text-xs">
                            Register
                          </GradientButton>
                        </div>
                      </div>
                    </GlassCard>
                  </Tilt>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
