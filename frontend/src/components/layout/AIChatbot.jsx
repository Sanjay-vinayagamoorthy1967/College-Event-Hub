import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FiMessageSquare, FiX, FiSend, FiCpu, FiChevronRight } from 'react-icons/fi';
import { eventService } from '../../services/eventService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function AIChatbot() {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: `👋 Welcome to the College Event Management System!\n\nI'm your AI Event Assistant. I can help you with:\n\n• Event information\n• Event registration\n• Registration status\n• Event schedules\n• Rules & eligibility\n• Organizer guidance\n• General platform support\n\nHow can I help you today?`,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [eventsList, setEventsList] = useState([]);
  const messagesEndRef = useRef(null);

  const QUICK_REPLIES = [
    { text: "📅 Active Events", action: "events" },
    { text: "📝 How to Register?", action: "register" },
    { text: "🎓 Certificates", action: "certificates" },
    { text: "⚙️ Admin & Organizer Guide", action: "organizer" }
  ];

  // Fetch events on mount to have them ready for event queries
  useEffect(() => {
    eventService.getAllEvents()
      .then(res => {
        if (res.success && res.data) {
          setEventsList(res.data);
        }
      })
      .catch(err => console.warn("Chatbot failed to fetch events:", err.message));
  }, []);

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    // Add user message
    const userMsg = { sender: 'user', text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      let botResponseText = "";
      const lowerText = text.toLowerCase();

      // Common stop words to exclude during matching
      const stopWords = new Set(['the', 'and', 'for', 'with', 'you', 'what', 'where', 'when', 'how', 'who', 'this', 'that', 'from', 'your', 'about', 'give', 'show', 'list', 'please', 'tell', 'info', 'information', 'details']);

      // Extract alphanumeric words from query
      const queryWords = lowerText
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length >= 2 && !stopWords.has(w));

      // Attempt to find a matching event from the loaded events list
      const matchingEvent = eventsList.find((e) => {
        const titleLower = e.title.toLowerCase();
        
        // Exact containment match (e.g. "Mock Hackathon" inside "where is Mock Hackathon")
        if (lowerText.includes(titleLower) || titleLower.includes(lowerText)) {
          return true;
        }

        // Word overlap match (excluding stop words)
        const titleWords = titleLower
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter((w) => w.length >= 2 && !stopWords.has(w));

        return titleWords.some((tw) =>
          queryWords.some((qw) => tw.includes(qw) || qw.includes(tw))
        );
      });

      if (matchingEvent) {
        // user is asking about a specific event
        if (
          lowerText.includes('venue') ||
          lowerText.includes('where') ||
          lowerText.includes('location') ||
          lowerText.includes('place') ||
          lowerText.includes('hall') ||
          lowerText.includes('room') ||
          lowerText.includes('lab')
        ) {
          botResponseText = `The venue for **${matchingEvent.title}** is **${matchingEvent.venue}**.`;
        } else if (
          lowerText.includes('date') ||
          lowerText.includes('when') ||
          lowerText.includes('day') ||
          lowerText.includes('time') ||
          lowerText.includes('duration') ||
          lowerText.includes('clock')
        ) {
          botResponseText = `**${matchingEvent.title}** is scheduled on **${new Date(matchingEvent.date).toLocaleDateString()}** at **${matchingEvent.startTime ? `${matchingEvent.startTime} - ${matchingEvent.endTime}` : matchingEvent.time}**.`;
        } else if (
          lowerText.includes('fee') ||
          lowerText.includes('price') ||
          lowerText.includes('cost') ||
          lowerText.includes('amount') ||
          lowerText.includes('pay') ||
          lowerText.includes('charge') ||
          lowerText.includes('rupee') ||
          lowerText.includes('₹')
        ) {
          const internal = matchingEvent.internalPrice === 0 ? 'Free' : `₹${matchingEvent.internalPrice}`;
          const external = matchingEvent.externalPrice === 0 ? 'Free' : `₹${matchingEvent.externalPrice}`;
          botResponseText = `The registration fee for **${matchingEvent.title}** is:\n• Internal Students: **${internal}**\n• External Students: **${external}**`;
        } else if (
          lowerText.includes('coordinator') ||
          lowerText.includes('contact') ||
          lowerText.includes('phone') ||
          lowerText.includes('organizer') ||
          lowerText.includes('who')
        ) {
          if (matchingEvent.coordinators && matchingEvent.coordinators.length > 0) {
            const list = matchingEvent.coordinators.map((c) => `• **${c.name}** (${c.role}): ${c.phone}`).join('\n');
            botResponseText = `Here are the coordinators for **${matchingEvent.title}**:\n${list}`;
          } else {
            botResponseText = `No specific coordinators are listed for **${matchingEvent.title}**. Please contact the main administrator.`;
          }
        } else if (
          lowerText.includes('rule') ||
          lowerText.includes('guideline') ||
          lowerText.includes('criteria') ||
          lowerText.includes('eligible')
        ) {
          if (matchingEvent.rules && matchingEvent.rules.length > 0) {
            const list = matchingEvent.rules.map((r, i) => `${i + 1}. ${r}`).join('\n');
            botResponseText = `Here are the rules for **${matchingEvent.title}**:\n${list}`;
          } else {
            botResponseText = `No specific rules are listed for **${matchingEvent.title}**.`;
          }
        } else if (
          lowerText.includes('schedule') ||
          lowerText.includes('agenda') ||
          lowerText.includes('timeline') ||
          lowerText.includes('activity') ||
          lowerText.includes('activities')
        ) {
          if (matchingEvent.schedule && matchingEvent.schedule.length > 0) {
            const list = matchingEvent.schedule.map((s) => `• **${s.time}**: ${s.activity} (${s.description || 'No description'})`).join('\n');
            botResponseText = `Here is the schedule for **${matchingEvent.title}**:\n${list}`;
          } else {
            botResponseText = `No detailed timeline or schedule is available for **${matchingEvent.title}**.`;
          }
        } else if (
          lowerText.includes('prize') ||
          lowerText.includes('award') ||
          lowerText.includes('reward') ||
          lowerText.includes('win')
        ) {
          if (matchingEvent.prizes && matchingEvent.prizes.length > 0) {
            const list = matchingEvent.prizes.map((p) => `• **${p.position}**: ₹${p.amount} (${p.description || 'No details'})`).join('\n');
            botResponseText = `Here are the prizes for **${matchingEvent.title}**:\n${list}`;
          } else {
            botResponseText = `No prize details are specified for **${matchingEvent.title}**.`;
          }
        } else {
          // General query about the matching event
          const seatsLeft = matchingEvent.seatLimit - matchingEvent.registeredCount;
          botResponseText = `Here are the details for **${matchingEvent.title}**:\n\n` +
            `• **Category**: ${matchingEvent.category}\n` +
            `• **Date & Time**: ${new Date(matchingEvent.date).toLocaleDateString()} at ${matchingEvent.startTime ? `${matchingEvent.startTime} - ${matchingEvent.endTime}` : matchingEvent.time}\n` +
            `• **Venue**: ${matchingEvent.venue}\n` +
            `• **Fee**: ${matchingEvent.internalPrice === 0 ? 'Free' : `₹${matchingEvent.internalPrice} (Internal) / ₹${matchingEvent.externalPrice} (External)`}\n` +
            `• **Available Seats**: ${seatsLeft} / ${matchingEvent.seatLimit}\n\n` +
            `Would you like to know about the schedule, rules, prizes, or coordinators for this event?`;
        }
      } else if (
        lowerText.includes('event') ||
        lowerText.includes('available') ||
        lowerText.includes('schedule') ||
        lowerText.includes('active') ||
        lowerText.includes('upcoming') ||
        lowerText.includes('hackathon') ||
        lowerText.includes('workshop') ||
        lowerText.includes('seminar') ||
        lowerText.includes('competition') ||
        lowerText.includes('venue') ||
        lowerText.includes('location') ||
        lowerText.includes('where')
      ) {
        if (eventsList.length > 0) {
          const formattedEvents = eventsList.map((e, idx) => 
            `${idx + 1}. **${e.title}** (${e.category})\n   • Date: ${new Date(e.date).toLocaleDateString()}\n   • Venue: ${e.venue}\n   • Seats Available: ${e.seatLimit - e.registeredCount} / ${e.seatLimit}\n   • Fee: ${e.internalPrice === 0 ? 'Free' : `₹${e.internalPrice} (Internal) / ₹${e.externalPrice} (External)`}`
          ).join('\n\n');
          botResponseText = `Here are the active and upcoming events available in the portal:\n\n${formattedEvents}\n\nWould you like guidance on how to register for any of these?`;
        } else {
          botResponseText = "There are currently no active events available for registration. Please check back later or contact the administrator.";
        }
      } else if (lowerText.includes('register') || lowerText.includes('apply') || lowerText.includes('signup') || lowerText.includes('sign up') || lowerText.includes('registration')) {
        botResponseText = `To register for an event, follow these simple steps:\n\n1. Navigate to the **Events** page from the navigation bar.\n2. Click on the event card you are interested in to see its details.\n3. Click the **Register Now** button.\n4. Choose your registration type: **Individual** (just for yourself) or **Team** (between 2 to 4 members total).\n5. Fill in the details (as the team leader, you will fill in details for other members too).\n6. Complete payment (for paid events) using the mock secure gateway and your registration will be approved instantly!`;
      } else if (lowerText.includes('certif') || lowerText.includes('award') || lowerText.includes('pdf')) {
        botResponseText = `Here is how certificate generation works:\n\n• Certificates are automatically generated for participants after attendance is marked by organizers.\n• Navigate to the **Certificates** page from the top navigation bar to view and download your certificates.\n• Each certificate includes a verifiable QR code linking to your registration pass for secure credential verification.`;
      } else if (lowerText.includes('organizer') || lowerText.includes('create') || lowerText.includes('admin') || lowerText.includes('delete') || lowerText.includes('edit') || lowerText.includes('announcement') || lowerText.includes('attendance')) {
        botResponseText = `For organizers and administrators:\n\n• **Creating Events:** Access the admin dashboard and select **Create Event** under Event Management.\n• **Managing Participants:** Navigate to the **Students** tab in the sidebar to review, approve, or delete student registrations.\n• **Attendance:** Use the built-in **QR Scanner** to scan tickets on-site and instantly mark student attendance.\n• **Announcements:** Post news, rule updates, or schedules directly from the **Announcements** page.`;
      } else if (lowerText.includes('help') || lowerText.includes('navigate') || lowerText.includes('home') || lowerText.includes('profile') || lowerText.includes('support') || lowerText.includes('dashboard')) {
        botResponseText = `Here is a quick navigation guide to help you use the platform:\n\n• **Home**: System statistics and active event banners.\n• **Events**: Browse, filter, and register for active events.\n• **Certificates**: Access and download your digital event certificates.\n• **Dashboard**: Track your registration status, payment history, and view your entry QR tickets.\n• **Profile**: Update your details (name, phone, department) and security configurations.`;
      } else if (lowerText.includes('hi') || lowerText.includes('hello') || lowerText.includes('hey') || lowerText.includes('greetings') || lowerText.includes('welcome') || lowerText.includes('assistant')) {
        botResponseText = "Hello! 👋 I'm your AI Event Assistant. How can I help you today? Ask me about active events, registrations, certificates, or organizer options!";
      } else {
        botResponseText = "I couldn't find that information. Please contact the event organizer or the administrator. You can ask me about a specific event (e.g. \"where is Code Debug?\" or \"Mock Hackathon venue\").";
      }

      setMessages(prev => [...prev, { sender: 'bot', text: botResponseText, timestamp: new Date() }]);
      setIsTyping(false);
    }, 800);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[999] font-poppins">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="bg-white dark:bg-dark-950 border border-[#E5E7EB] dark:border-dark-800 rounded-3xl shadow-2xl w-[360px] md:w-[400px] h-[550px] flex flex-col overflow-hidden mb-4"
          >
            {/* Header */}
            <div className="p-4 border-b border-[#E5E7EB] dark:border-dark-800 bg-gradient-to-r from-primary-500/10 via-secondary-500/10 to-transparent flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-500 to-secondary-500 flex items-center justify-center text-white shadow-glow-primary">
                  <FiCpu className="text-xl" />
                </div>
                <div>
                  <h3 className="font-extrabold font-sora text-sm text-dark-900 leading-tight">AI Event Assistant</h3>
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-dark-100 dark:hover:bg-dark-900 text-dark-400 hover:text-dark-900 transition-colors border border-transparent hover:border-[#E5E7EB] dark:hover:border-dark-800"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8FAFC]/30 dark:bg-dark-950/20">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs font-medium leading-relaxed whitespace-pre-line ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-tr from-primary-500 to-primary-600 text-white shadow-glow-primary rounded-tr-none'
                        : 'bg-white dark:bg-dark-900 border border-[#E5E7EB] dark:border-dark-800 text-dark-800 dark:text-dark-100 rounded-tl-none shadow-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-dark-900 border border-[#E5E7EB] dark:border-dark-800 text-dark-400 rounded-2xl rounded-tl-none px-4 py-3 text-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-dark-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-dark-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-dark-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            {messages.length === 1 && (
              <div className="p-3 border-t border-[#E5E7EB] dark:border-dark-800 bg-[#F8FAFC]/50 dark:bg-dark-900/10 flex flex-wrap gap-2 justify-center">
                {QUICK_REPLIES.map((reply, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(reply.text)}
                    className="px-3 py-1.5 bg-white dark:bg-dark-900 border border-[#E5E7EB] dark:border-dark-800 text-dark-700 dark:text-dark-200 text-[10px] font-bold rounded-full hover:border-primary-500 hover:text-primary-500 dark:hover:text-primary-500 transition-all flex items-center gap-1"
                  >
                    {reply.text} <FiChevronRight />
                  </button>
                ))}
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputText);
              }}
              className="p-3 border-t border-[#E5E7EB] dark:border-dark-800 bg-white dark:bg-dark-950 flex gap-2 items-center"
            >
              <input
                type="text"
                placeholder="Ask me anything..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-full text-xs font-poppins text-dark-900 bg-[#F8FAFC] dark:bg-dark-900 border border-[#E5E7EB] dark:border-dark-800 outline-none focus:border-primary-500 dark:focus:border-primary-500 transition-all"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2.5 rounded-full bg-gradient-to-tr from-primary-500 to-secondary-500 text-white shadow-glow-primary hover:scale-105 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center"
              >
                <FiSend className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-tr from-primary-500 to-secondary-500 rounded-full text-white shadow-glow-primary flex items-center justify-center hover:scale-105 active:scale-95 transition-all relative border border-white/10"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -45, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 45, opacity: 0 }} transition={{ duration: 0.2 }}>
              <FiX className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ rotate: 45, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -45, opacity: 0 }} transition={{ duration: 0.2 }}>
              <FiMessageSquare className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
