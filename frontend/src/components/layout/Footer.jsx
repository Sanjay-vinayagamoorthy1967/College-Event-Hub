import React from 'react';
import { Link } from 'react-router-dom';
import { FiGithub, FiTwitter, FiLinkedin, FiInstagram, FiMail, FiMapPin, FiPhone } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="relative bg-white border-t border-[#FFE6D5] pt-20 pb-8 overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute -bottom-48 -left-48 w-96 h-96 bg-primary-500/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-48 -right-48 w-96 h-96 bg-secondary-500/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16 relative z-10">
        {/* Brand details */}
        <div>
          <Link to="/" className="flex items-center gap-2 mb-6 focus:outline-none">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-500 to-secondary-500 flex items-center justify-center">
              <span className="text-white font-black font-sora text-sm">CE</span>
            </div>
            <span className="text-base font-black font-sora tracking-widest text-dark-900">
              EVENT<span className="text-primary-500">HUB</span>
            </span>
          </Link>
          <p className="text-sm text-dark-600 font-poppins leading-relaxed mb-6">
            Connecting students across departments and campuses. Register, participate, earn digital badges, and auto-generate certificates.
          </p>
          <div className="flex gap-4">
            {[FiGithub, FiTwitter, FiLinkedin, FiInstagram].map((Icon, idx) => (
              <a
                key={idx}
                href="#"
                className="w-10 h-10 rounded-full bg-dark-900/5 border border-dark-900/10 flex items-center justify-center text-dark-600 hover:text-primary-600 hover:border-primary-500/50 hover:bg-primary-500/10 hover:shadow-glow-primary transition-all duration-300"
              >
                <Icon className="text-base" />
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-base font-bold font-sora text-dark-900 mb-6 uppercase tracking-wider">Navigation</h4>
          <ul className="flex flex-col gap-3 text-sm font-poppins">
            {[
              { label: 'Explore Events', path: '/events' },
              { label: 'Verify Certificates', path: '/certificates' },
              { label: 'Platform Story', path: '/about' },
              { label: 'Help Desk', path: '/contact' },
              { label: 'Portal Registration', path: '/register' }
            ].map((link, idx) => (
              <li key={idx}>
                <Link to={link.path} className="text-dark-600 hover:text-primary-600 hover:translate-x-1 inline-block transition-all duration-200">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Featured Events */}
        <div>
          <h4 className="text-base font-bold font-sora text-dark-900 mb-6 uppercase tracking-wider">Event Categories</h4>
          <ul className="flex flex-col gap-3 text-sm font-poppins">
            {['Tech Conferences', 'Hackathons', 'Expert Seminars', 'Athletic Meets', 'Cultural Celebrations'].map((cat, idx) => (
              <li key={idx}>
                <Link to="/events" className="text-dark-600 hover:text-primary-600 hover:translate-x-1 inline-block transition-all duration-200">
                  {cat}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact info */}
        <div>
          <h4 className="text-base font-bold font-sora text-dark-900 mb-6 uppercase tracking-wider">Contact Office</h4>
          <ul className="flex flex-col gap-4 text-sm font-poppins text-dark-600">
            <li className="flex items-start gap-3">
              <FiMapPin className="text-primary-500 mt-1 flex-shrink-0 text-base" />
              <span>Sri Shanmugha College of Engineering and Technology,Salem,Tamil Nadu-636122</span>
            </li>
            <li className="flex items-center gap-3">
              <FiPhone className="text-secondary-500 flex-shrink-0 text-base" />
              <span>+91 9786369744</span>
            </li>
            <li className="flex items-center gap-3">
              <FiMail className="text-accent-500 flex-shrink-0 text-base" />
              <a href="mailto:events@shanmugha.edu.com" className="hover:text-primary-600 transition-colors">
                events@shanmugha.edu.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="h-px w-full bg-[#FFE6D5] mb-8" />

      {/* Bottom copyright details */}
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-xs text-dark-500 font-poppins gap-4 relative z-10">
        <span>&copy; {new Date().getFullYear()} Sri Shanmugha Event Hub. Built with React & Three.js. All Rights Reserved.</span>
        <div className="flex gap-6">
          <a href="#" className="hover:text-primary-600 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-primary-600 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-primary-600 transition-colors">Platform Status</a>
        </div>
      </div>
    </footer>
  );
}
