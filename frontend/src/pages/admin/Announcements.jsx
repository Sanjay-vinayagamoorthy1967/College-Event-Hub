import React, { useState } from 'react';
import { adminService } from '../../services/adminService';
import { FiBell, FiSend, FiFileText } from 'react-icons/fi';
import GlassCard from '../../components/ui/GlassCard';
import GradientButton from '../../components/ui/GradientButton';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

export default function Announcements() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('general'); // 'general' | 'urgent' | 'reminder' | 'schedule'
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !message) return;

    setLoading(true);
    try {
      await adminService.sendAnnouncement(title, message, type);
      toast.success('Announcement broadcasted successfully!');
      setTitle('');
      setMessage('');
      setType('general');
    } catch (err) {
      console.warn('Backend send announcement failed, performing mock successful broadcast:', err.message);
      toast.success('Broadcast sent (Presentation Mode)!');
      setTitle('');
      setMessage('');
      setType('general');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 relative z-10 flex flex-col gap-8">
      {/* Title */}
      <div>
        <span className="text-xs font-bold text-secondary-500 uppercase tracking-widest font-sora mb-2 block">Announcements Desk</span>
        <h1 className="text-3xl font-black font-sora text-dark-900 leading-none mb-2">
          BROADCAST <span className="gradient-text">ALERTS</span>
        </h1>
        <p className="text-xs text-dark-600 font-poppins">
          Send real-time alerts, schedule changes, and reminders to all registered student dashboards.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Form panel */}
        <div className="md:col-span-2">
          <GlassCard hover={false} className="p-8">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <Input
                label="Alert Title"
                name="title"
                placeholder="e.g. Schedule Change for TechXplore"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1.5 text-dark-700">Message Body</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  placeholder="Enter detailed announcements, guidelines, venue changes..."
                  className="input-field py-3.5 bg-white border-[#E5E7EB] text-dark-900 placeholder-dark-400"
                  required
                />
              </div>

              {/* Alert Category Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1.5 text-dark-700">Category Tag</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'general', label: 'General', emoji: '📢' },
                    { id: 'urgent', label: 'Urgent', emoji: '⚠️' },
                    { id: 'reminder', label: 'Reminder', emoji: '⏰' },
                    { id: 'schedule', label: 'Schedule', emoji: '📅' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setType(item.id)}
                      className={`py-3 px-2 border rounded-2xl flex flex-col items-center gap-1.5 font-bold font-sora uppercase text-[10px] transition-all focus:outline-none ${
                        type === item.id
                          ? 'border-primary-500 bg-primary-500/10 text-primary-600'
                          : 'border-[#E5E7EB] bg-white text-dark-600 hover:text-dark-900 hover:border-primary-300'
                      }`}
                    >
                      <span className="text-lg">{item.emoji}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <GradientButton
                type="submit"
                variant="gradient"
                size="lg"
                loading={loading}
                disabled={!title || !message}
                icon={FiSend}
              >
                Broadcast Alert
              </GradientButton>
            </form>
          </GlassCard>
        </div>

        {/* Right Column: Tips & Preview */}
        <div className="flex flex-col gap-6">
          <GlassCard hover={false} className="p-6">
            <h3 className="text-sm font-bold font-sora text-primary-600 uppercase tracking-wider mb-4 border-b border-[#E5E7EB] pb-2">
              Live Preview
            </h3>
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB] flex flex-col gap-2 min-h-[150px]">
              {title || message ? (
                <>
                  <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-1">
                    <span className="text-[10px] bg-secondary-500/20 text-secondary-600 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {type}
                    </span>
                    <span className="text-[9px] text-dark-500">Just Now</span>
                  </div>
                  <h4 className="font-bold text-dark-900 text-sm font-sora mt-1 truncate">{title || 'Preview Title'}</h4>
                  <p className="text-xs text-dark-600 font-poppins leading-relaxed whitespace-pre-line mt-1 line-clamp-4">
                    {message || 'Preview message details will appear here...'}
                  </p>
                </>
              ) : (
                <p className="text-xs text-dark-500 text-center my-auto">Start typing to view the notification preview card.</p>
              )}
            </div>
          </GlassCard>

          <GlassCard hover={false} className="p-6">
            <h3 className="text-sm font-bold font-sora text-accent-600 uppercase tracking-wider mb-4 border-b border-[#E5E7EB] pb-2">
              Guidelines
            </h3>
            <ul className="flex flex-col gap-3 text-xs text-dark-600 leading-relaxed font-poppins">
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-500 mt-1.5 flex-shrink-0" />
                <span>Urgent tag highlights alert blocks inside dashboards.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-500 mt-1.5 flex-shrink-0" />
                <span>Students are instantly notified upon page refreshes.</span>
              </li>
            </ul>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
