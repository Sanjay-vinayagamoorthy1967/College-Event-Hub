import React from 'react';
import { FiCpu, FiAward, FiShield, FiUsers } from 'react-icons/fi';
import GlassCard from '../components/ui/GlassCard';

export default function About() {
  const cards = [
    {
      icon: FiCpu,
      title: 'Our Core Technology',
      desc: 'Engineered using modern SPA paradigms. Combines React + Vite, Three.js 3D renders, Tailwind styling, and MongoDB database pipelines.'
    },
    {
      icon: FiAward,
      title: 'Digital Verifications',
      desc: 'Every certificate features cryptography-inspired hashes linked to unique QR verification codes for validation.'
    },
    {
      icon: FiShield,
      title: 'High Security Levels',
      desc: 'Role-based access controls, salted password hashes, secure JSON Web Token tokens, and Razorpay gateway compliance.'
    },
    {
      icon: FiUsers,
      title: 'Built For Scale',
      desc: 'Ready to manage registration flow bottlenecks, concurrent attendance markings, and multi-user dashboard requests.'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 relative z-10 flex flex-col gap-16">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-xs font-bold text-secondary-500 uppercase tracking-widest font-sora mb-2 block">Platform Story</span>
        <h1 className="text-3xl md:text-5xl font-black font-sora text-dark-900 leading-tight">
          ABOUT <span className="gradient-text">SHANMUGHA EVENT HUB</span>
        </h1>
        <p className="text-dark-600 text-sm md:text-base font-poppins mt-2">
          Bridging technical organizations, student networks, and campus administrators through a single unified interface.
        </p>
      </div>

      {/* Main Grid detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold font-sora text-dark-900 mb-4">
            Unified Management for All Campus Events
          </h2>
          <p className="text-dark-600 text-sm font-poppins leading-relaxed mb-6">
            Organizing and managing events across departments has historically been complex — involving physical registrations, manual payment receipts, Excel rosters, and delays in issuing certificates.
          </p>
          <p className="text-dark-600 text-sm font-poppins leading-relaxed mb-6">
            Sri Shanmugha Event Hub solves this. We provide a beautiful startup-grade platform that automates the entire loop: registering, completing payments, check-in tracking at the gate via QR scanner codes, and instantly generating verified PDF certificates for participants.
          </p>
          <div className="flex gap-4">
            <div className="border-l-2 border-primary-500 pl-4">
              <span className="block text-2xl font-black text-dark-900 font-sora">100%</span>
              <span className="text-[10px] uppercase font-bold text-dark-500">Paperless Flow</span>
            </div>
            <div className="border-l-2 border-secondary-500 pl-4">
              <span className="block text-2xl font-black text-dark-900 font-sora">&lt; 1 sec</span>
              <span className="text-[10px] uppercase font-bold text-dark-500">QR Mark Time</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {cards.map((item, idx) => {
            const Icon = item.icon;
            return (
              <GlassCard key={idx} hover className="p-6">
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-xl text-primary-500 mb-4">
                  <Icon />
                </div>
                <h4 className="font-bold text-dark-900 font-sora text-sm mb-2">{item.title}</h4>
                <p className="text-xs text-dark-600 font-poppins leading-relaxed">{item.desc}</p>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}
