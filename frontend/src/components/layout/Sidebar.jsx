import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiGrid,
  FiPlusCircle,
  FiUsers,
  FiDollarSign,
  FiFileText,
  FiBell,
  FiLogOut,
  FiUser,
  FiChevronLeft,
  FiBookOpen,
  FiCalendar,
  FiAward,
  FiCheckSquare,
  FiUserX,
  FiShield,
  FiUserCheck,
  FiStar
} from 'react-icons/fi';

export default function Sidebar() {
  const { user, userType, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const studentLinks = [
    { label: 'Overview', path: '/dashboard', icon: FiGrid },
    { label: 'Register Event', path: '/events', icon: FiCalendar },
    { label: 'Completed Events', path: '/completed-events', icon: FiCheckSquare },
    { label: 'My Certificates', path: '/certificates', icon: FiAward },
    { label: 'Profile', path: '/profile', icon: FiUser },
  ];

  const adminLinks = [
    { label: 'Dashboard', path: '/admin', icon: FiGrid },
    ...(user && user.role === 'super_admin' ? [
      { label: 'Admin Approval', path: '/admin/requests', icon: FiUserCheck },
      { label: 'Admin Management', path: '/admin/management', icon: FiShield }
    ] : []),
    { label: 'Manage Events', path: '/admin/events', icon: FiCalendar },
    { label: 'Completed Events', path: '/completed-events', icon: FiCheckSquare },
    { label: 'Create Event', path: '/admin/create-event', icon: FiPlusCircle },
    { label: 'Registrations', path: '/admin/students', icon: FiUsers },
    { label: 'QR Scanner', path: '/admin/scanner', icon: FiBookOpen },
    { label: 'Certificate Release', path: '/admin/certificates', icon: FiAward },
    { label: 'Results Management', path: '/admin/results', icon: FiStar },
    { label: 'Announcements', path: '/admin/announcements', icon: FiBell },
    { label: 'Deletion Requests', path: '/admin/deletion-requests', icon: FiUserX },
  ];

  const links = userType === 'admin' ? adminLinks : studentLinks;

  return (
    <aside className="fixed left-0 top-[72px] bottom-0 w-64 glass border-r border-[#E5E7EB] dark:border-dark-800/40 py-8 px-4 flex flex-col z-30 hidden md:flex">
      {/* Navigation Links */}
      <div className="flex flex-col gap-2 flex-grow overflow-y-auto pb-4 custom-scrollbar">
        {links.map((link, idx) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={idx}
              to={link.path}
              end={link.path === '/dashboard' || link.path === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-600 to-secondary-500 text-white shadow-md border border-primary-500/20'
                    : 'text-dark-600 hover:text-dark-900 hover:bg-dark-900/5 border border-transparent'
                }`
              }
            >
              <Icon className="text-lg" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Logout button in bottom */}
      <div className="border-t border-[#E5E7EB] dark:border-dark-800/40 pt-6 mt-auto">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold text-red-500 hover:text-red-700 hover:bg-red-500/10 border border-transparent transition-all duration-300"
        >
          <FiLogOut className="text-lg" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
