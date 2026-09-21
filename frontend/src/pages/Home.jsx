import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { FiChevronDown, FiCalendar, FiShield, FiCpu, FiAward, FiArrowRight } from 'react-icons/fi';
import GradientButton from '../components/ui/GradientButton';
import GlassCard from '../components/ui/GlassCard';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import { useAuth } from '../context/AuthContext';
import Trophy3D from '../components/ui/Trophy3D';

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, userType } = useAuth();

  const handleExplore = () => {
    navigate('/events');
  };

  const handleLoginClick = (role) => {
    if (role === 'admin') {
      navigate('/login?role=admin');
    } else {
      navigate('/login?role=student');
    }
  };

  const features = [
    {
      icon: FiCpu,
      title: 'Unified Registrations',
      desc: 'Sign up once and enter any event, hackathon, or seminar instantly with automated registration forms.'
    },
    {
      icon: FiCalendar,
      title: 'Real-time Event Stats',
      desc: 'Keep track of seat availability, event rules, schedules, faculty coordinators, and maps all in one place.'
    },
    {
      icon: FiShield,
      title: 'Secure Payments',
      desc: 'Complete registrations through UPI, Cards, NetBanking via integrated, highly secure Razorpay flows.'
    },
    {
      icon: FiAward,
      title: 'Instant Certificates',
      desc: 'Get beautiful, verifiable PDF certificates with secure QR verification directly in your dashboard.'
    }
  ];

  const stats = [
    { value: 25, label: 'Active Events', suffix: '+' },
    { value: 1200, label: 'Students Registered', suffix: '+' },
    { value: 15, label: 'Partner Colleges', suffix: '+' },
    { value: 95, label: 'Present Attendance', suffix: '%' }
  ];

  return (
    <div className="relative w-full overflow-hidden bg-[#FDFBF7] dark:bg-[#090d16]">
      {/* Hero Section Wrapper */}
      <div className="relative w-full h-screen flex flex-col items-center justify-center pt-24 overflow-hidden bg-transparent">
        
        {/* Layer 0: Full Screen 3D Animation Background */}
        <div className="absolute inset-0 w-full h-full z-0 pointer-events-auto">
          <Trophy3D />
        </div>





        {/* Layer 2: Buttons (Foreground) */}
        <div className="absolute bottom-28 left-0 right-0 max-w-5xl mx-auto px-6 flex flex-col items-center z-20 pointer-events-none">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-wrap justify-center items-center gap-6 pointer-events-auto"
          >
            <button
              onClick={handleExplore}
              className="px-8 py-3.5 bg-[#20C973] hover:bg-[#1db466] text-white font-bold font-sora rounded-full shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300 flex items-center gap-2 select-none outline-none"
            >
              <FiArrowRight className="text-xl" /> Explore Events
            </button>

            {!isAuthenticated ? (
              <>
                <button
                  onClick={() => navigate('/login-internal')}
                  className="px-8 py-3.5 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-bold font-sora rounded-full shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300 flex items-center gap-2 select-none outline-none"
                >
                  Internal Student Login
                </button>
                <button
                  onClick={() => handleLoginClick('student')}
                  className="px-8 py-3.5 bg-[#20C973] hover:bg-[#1db466] text-white font-bold font-sora rounded-full shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300 flex items-center gap-2 select-none outline-none"
                >
                  Other Student Login
                </button>
                <button
                  onClick={() => handleLoginClick('admin')}
                  className="px-8 py-3.5 bg-[#20C973] hover:bg-[#1db466] text-white font-bold font-sora rounded-full shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300 flex items-center gap-2 select-none outline-none"
                >
                  Admin Portal
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate(userType === 'admin' ? '/admin' : '/dashboard')}
                className="px-8 py-3.5 bg-[#20C973] hover:bg-[#1db466] text-white font-bold font-sora rounded-full shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300 flex items-center gap-2 select-none outline-none"
              >
                Go to Dashboard
              </button>
            )}
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-12 left-0 right-0 mx-auto w-fit flex flex-col items-center gap-2 cursor-pointer z-20"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          onClick={() => {
            document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <span className="text-[10px] uppercase font-bold text-dark-500 tracking-widest font-sora">Discover More</span>
          <FiChevronDown className="text-xl text-[#20C973]" />
        </motion.div>
      </div>

      {/* Stats Counter Section */}
      <section className="relative z-10 py-16 px-6 max-w-7xl mx-auto border-y border-[#E8DFD1] dark:border-dark-800 bg-transparent">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center justify-center text-center">
              <span className="text-4xl md:text-5xl font-black font-sora text-[#0B132B] dark:text-white mb-2">
                <AnimatedCounter end={stat.value} suffix={stat.suffix} duration={2000} />
              </span>
              <span className="text-xs md:text-sm text-dark-600 font-semibold font-poppins uppercase tracking-wider">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Features Showcase Section */}
      <section id="features-section" className="relative z-10 py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold text-secondary-600 uppercase tracking-widest block mb-3 font-sora">Key Highlights</span>
          <h2 className="text-3xl md:text-4xl font-extrabold font-sora text-[#0B132B] dark:text-white leading-tight">
            Designed for Modern Campus Experience
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-primary-500 to-secondary-500 mx-auto mt-4 rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <GlassCard key={idx} glow={idx % 2 === 0 ? 'primary' : 'secondary'} className="p-8 hover:translate-y-[-6px]">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-6 ${
                  idx % 2 === 0 
                    ? 'text-[#20C973] bg-[#20C973]/10 border border-[#20C973]/20' 
                    : 'text-[#0B132B] bg-[#0B132B]/10 border border-[#0B132B]/20 dark:text-white dark:bg-white/10 dark:border-white/20'
                }`}>
                  <Icon />
                </div>
                <h3 className="text-xl font-bold font-sora text-[#0B132B] dark:text-white mb-3">{feat.title}</h3>
                <p className="text-dark-600 text-sm font-poppins leading-relaxed">{feat.desc}</p>
              </GlassCard>
            );
          })}
        </div>
      </section>

      {/* Call To Action Block */}
      <section className="relative z-10 py-24 px-6 max-w-7xl mx-auto mb-16">
        <div className="relative w-full rounded-[32px] overflow-hidden bg-white p-10 md:p-16 border border-[#E5E7EB] flex flex-col md:flex-row items-center justify-between gap-10 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-secondary-500/5 to-transparent pointer-events-none" />
          <div className="relative z-10 flex-1">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black font-sora text-dark-900 mb-4 leading-tight">
              Ready to showcase your talent?
            </h2>
            <p className="text-dark-600 font-poppins max-w-xl text-sm md:text-base leading-relaxed">
              Explore open registrations, pick your tech/non-tech tracks, verify entries via QR, and step into the center stage of college life.
            </p>
          </div>
          <div className="relative z-10 flex-shrink-0">
            <GradientButton variant="gradient" size="lg" onClick={handleExplore}>
              View Open Registrations
            </GradientButton>
          </div>
        </div>
      </section>
    </div>
  );
}
