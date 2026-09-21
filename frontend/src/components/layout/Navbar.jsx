import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { FiSun, FiMoon, FiBell, FiMenu, FiX, FiSearch, FiUser, FiLogOut, FiSettings } from 'react-icons/fi';
import { adminService } from '../../services/adminService';
import { generateAvatar } from '../../utils/helpers';
import GradientButton from '../ui/GradientButton';

export default function Navbar() {
  const { isAuthenticated, user, userType, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Load notifications if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      adminService.getMyNotifications()
        .then(res => setNotifications(res.data || []))
        .catch(err => {
          console.warn('Failed to load real notifications, using defaults:', err.message);
          setNotifications([
            { id: '1', title: 'Welcome to Event Hub!', message: 'Explore upcoming workshops and hackathons.', isRead: false, createdAt: new Date() },
            { id: '2', title: 'Featured Event: TechXplore', message: 'Registrations are open for internal and external students.', isRead: true, createdAt: new Date(Date.now() - 86400000) }
          ]);
        });
    }
  }, [isAuthenticated]);

  // Scroll logic for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Events', path: '/events' },
    { label: 'Certificates', path: '/certificates' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
  ];

  const studentLinks = [
    { label: 'Overview', path: '/dashboard' },
    { label: 'Register Event', path: '/events' },
    { label: 'My Certificates', path: '/certificates' },
    { label: 'Profile', path: '/profile' },
  ];

  const adminLinks = [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Manage Events', path: '/admin/events' },
    { label: 'Create Event', path: '/admin/create-event' },
    { label: 'Registrations', path: '/admin/students' },
    { label: 'ID Verification', path: '/admin/id-verification' },
    { label: 'QR Scanner', path: '/admin/scanner' },
    { label: 'Certificate Release', path: '/admin/certificates' },
    { label: 'Announcements', path: '/admin/announcements' },
  ];

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
    navigate('/');
  };

  const handleMarkRead = async (id) => {
    try {
      await adminService.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <nav className={`fixed top-0 left-0 w-full z-40 transition-all duration-500 border-b ${
      isScrolled 
        ? 'bg-white/80 dark:bg-dark-950/80 backdrop-blur-xl border-[#FFE6D5] dark:border-dark-900/40 py-4' 
        : 'bg-transparent border-transparent py-6'
    }`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 group focus:outline-none">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-500 to-secondary-500 flex items-center justify-center shadow-glow-primary group-hover:scale-105 transition-all duration-300">
            <span className="text-white font-extrabold font-sora text-lg tracking-tighter">CE</span>
          </div>
          <span className="text-lg font-black font-sora tracking-widest text-dark-900 group-hover:text-primary-500 transition-colors">
            EVENT<span className="text-primary-500 group-hover:text-secondary-500 transition-colors">HUB</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`relative text-sm font-semibold tracking-wide transition-colors focus:outline-none ${
                  isActive ? 'text-primary-600' : 'text-dark-600 hover:text-dark-900'
                }`}
              >
                {link.label}
                {isActive && (
                  <motion.div
                    className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
                    layoutId="activeNavLink"
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Icons & Actions */}
        <div className="hidden lg:flex items-center gap-5">
          {/* Dark Mode */}
          <button
            onClick={toggleTheme}
            className="text-dark-600 hover:text-primary-600 bg-dark-900/5 hover:bg-dark-900/10 p-2.5 rounded-full transition-all duration-300 focus:outline-none"
            aria-label="Toggle Dark Mode"
          >
            {isDarkMode ? <FiSun className="text-lg" /> : <FiMoon className="text-lg" />}
          </button>

          {/* Search trigger */}
          <button
            onClick={() => navigate('/events')}
            className="text-dark-600 hover:text-primary-600 bg-dark-900/5 hover:bg-dark-900/10 p-2.5 rounded-full transition-all duration-300 focus:outline-none"
            aria-label="Search Events"
          >
            <FiSearch className="text-lg" />
          </button>

          {/* Notifications */}
          {isAuthenticated && (
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative text-dark-600 hover:text-primary-600 bg-dark-900/5 hover:bg-dark-900/10 p-2.5 rounded-full transition-all duration-300 focus:outline-none"
                aria-label="Notifications"
              >
                <FiBell className="text-lg" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-secondary-500 text-white rounded-full flex items-center justify-center text-[9px] font-extrabold shadow-[0_0_10px_rgba(236,72,153,0.5)]">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
                    <motion.div
                      className="absolute right-0 mt-3 w-80 bg-white dark:bg-dark-900 rounded-2xl border border-[#FFE6D5] dark:border-dark-800 p-4 shadow-xl z-20"
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-center justify-between mb-3 border-b border-[#FFE6D5] pb-2">
                        <span className="font-bold text-sm text-dark-900">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="text-[10px] bg-secondary-500/20 text-secondary-400 font-bold px-2 py-0.5 rounded-full">
                            {unreadCount} New
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                        {notifications.length === 0 ? (
                          <p className="text-xs text-dark-400 py-4 text-center">No notifications yet.</p>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id || notif._id}
                              onClick={() => handleMarkRead(notif.id || notif._id)}
                              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                                notif.isRead 
                                  ? 'bg-transparent border-transparent opacity-60' 
                                  : 'bg-primary-500/5 border-[#FFE6D5] hover:bg-primary-500/10'
                              }`}
                            >
                              <p className="text-xs font-bold text-dark-900 mb-0.5">{notif.title}</p>
                              <p className="text-[10px] text-dark-600 leading-normal">{notif.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Profile/Auth Dropdown */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-dark-900/5 hover:bg-dark-900/10 border border-dark-900/10 transition-all duration-300 focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-500 to-secondary-500 flex items-center justify-center font-bold text-white text-xs border border-white/20">
                  {generateAvatar(user?.name)}
                </div>
                <span className="text-xs font-semibold text-dark-900 max-w-[80px] truncate">{user?.name}</span>
              </button>

              <AnimatePresence>
                {showProfileMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
                    <motion.div
                      className="absolute right-0 mt-3 w-56 bg-white dark:bg-dark-900 rounded-2xl border border-[#FFE6D5] dark:border-dark-800 p-2 shadow-xl z-20"
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-3 py-2 border-b border-[#FFE6D5] mb-1.5">
                        <p className="text-xs font-bold text-dark-900 truncate">{user?.name}</p>
                        <p className="text-[10px] text-dark-500 truncate">{user?.email}</p>
                      </div>

                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate(userType === 'admin' ? '/admin' : '/dashboard');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-dark-600 hover:text-primary-600 hover:bg-primary-500/10 rounded-xl transition-colors text-left"
                      >
                        <FiSettings /> Dashboard
                      </button>

                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate('/profile');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-dark-600 hover:text-primary-600 hover:bg-primary-500/10 rounded-xl transition-colors text-left"
                      >
                        <FiUser /> Edit Profile
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors text-left mt-1"
                      >
                        <FiLogOut /> Log Out
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <GradientButton
              variant="gradient"
              size="sm"
              onClick={() => navigate('/login')}
            >
              Sign In
            </GradientButton>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden text-dark-600 bg-dark-900/5 p-2 rounded-xl transition-colors hover:bg-dark-900/10 focus:outline-none"
        >
          {isOpen ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-y-0 right-0 w-72 bg-white/95 dark:bg-dark-950/95 backdrop-blur-xl border-l border-[#FFE6D5] dark:border-dark-800 p-6 flex flex-col z-50 lg:hidden shadow-2xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#FFE6D5]">
              <span className="font-bold text-dark-900">Navigation</span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-dark-600 bg-dark-900/5 p-2 rounded-xl hover:bg-dark-900/10"
              >
                <FiX />
              </button>
            </div>

            <div className="flex flex-col gap-5 mb-8 overflow-y-auto max-h-[60vh] pr-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`text-base font-bold tracking-wide transition-colors ${
                    location.pathname === link.path ? 'text-primary-600' : 'text-dark-600 hover:text-dark-900'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {isAuthenticated && (
                <>
                  <div className="h-px bg-[#FFE6D5] dark:bg-dark-800 my-2" />
                  <span className="text-[10px] font-bold text-dark-400 dark:text-dark-500 uppercase tracking-widest block mb-1">
                    Dashboard Menu
                  </span>
                  <div className="flex flex-col gap-4 pl-2">
                    {(userType === 'admin' ? adminLinks : studentLinks).map((link) => {
                      const isActive = location.pathname === link.path;
                      return (
                        <Link
                          key={link.path}
                          to={link.path}
                          onClick={() => setIsOpen(false)}
                          className={`text-sm font-bold tracking-wide transition-colors ${
                            isActive ? 'text-primary-600' : 'text-dark-600 hover:text-dark-900'
                          }`}
                        >
                          {link.label}
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="mt-auto border-t border-[#FFE6D5] pt-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-dark-600">Theme</span>
                <button
                  onClick={toggleTheme}
                  className="text-dark-600 bg-dark-900/5 hover:bg-dark-900/10 p-2 rounded-xl"
                >
                  {isDarkMode ? <FiSun /> : <FiMoon />}
                </button>
              </div>

              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-3 px-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-500 to-secondary-500 flex items-center justify-center font-bold text-white">
                      {generateAvatar(user?.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-dark-900 truncate">{user?.name}</p>
                      <p className="text-xs text-dark-500 truncate">{user?.email}</p>
                    </div>
                  </div>
                  <GradientButton
                    variant="danger"
                    size="sm"
                    onClick={handleLogout}
                    className="w-full"
                  >
                    Log Out
                  </GradientButton>
                </>
              ) : (
                <GradientButton
                  variant="gradient"
                  size="sm"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/login');
                  }}
                  className="w-full"
                >
                  Sign In
                </GradientButton>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
