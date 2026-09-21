import React, { useState } from 'react';
import { FiMail, FiPhone, FiMapPin, FiSend } from 'react-icons/fi';
import GlassCard from '../components/ui/GlassCard';
import Input from '../components/ui/Input';
import GradientButton from '../components/ui/GradientButton';
import toast from 'react-hot-toast';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !msg) return;

    setSubmitting(true);
    // Simulate contact message API delivery
    setTimeout(() => {
      toast.success('Your message has been delivered to support desk!');
      setName('');
      setEmail('');
      setMsg('');
      setSubmitting(false);
    }, 1200);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 relative z-10 flex flex-col gap-12">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-xs font-bold text-secondary-500 uppercase tracking-widest font-sora mb-2 block">Help Center</span>
        <h1 className="text-3xl md:text-5xl font-black font-sora text-dark-900 leading-tight">
          GET IN <span className="gradient-text">TOUCH</span>
        </h1>
        <p className="text-dark-600 text-sm md:text-base font-poppins mt-2">
          Questions about payments, coordinate details, or certificates? Send us a ticket template.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Office Contacts */}
        <div className="flex flex-col gap-6">
          <GlassCard hover={false} className="p-6">
            <h4 className="font-bold text-dark-900 font-sora text-base mb-6 border-b border-dark-900/10 pb-2 text-primary-500">
              Campus Office
            </h4>
            <ul className="flex flex-col gap-6 text-xs text-dark-600 font-poppins">
              <li className="flex items-start gap-3">
                <FiMapPin className="text-lg text-primary-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-dark-900 mb-1">Office Location</p>
                  <p className="leading-relaxed">Sri Shanmugha College of Engineering and Technology,Salem,Tamil Nadu-636122</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <FiPhone className="text-lg text-secondary-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-dark-900 mb-1">Phone Registers</p>
                  <p>+91 9786369744</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <FiMail className="text-lg text-primary-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-dark-900 mb-1">Email Support</p>
                  <p>events@shanmugha.edu.com</p>
                </div>
              </li>
            </ul>
          </GlassCard>
        </div>

        {/* Right Column: Message Form */}
        <div className="md:col-span-2">
          <GlassCard hover={false} className="p-8">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Your Name"
                  name="contactName"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Input
                  label="Email Address"
                  name="contactEmail"
                  type="email"
                  placeholder="e.g. john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1.5 text-dark-600">Message ticket details</label>
                <textarea
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  rows={5}
                  placeholder="Explain your queries or requests..."
                  className="input-field py-3.5"
                  required
                />
              </div>

              <GradientButton
                type="submit"
                variant="gradient"
                size="lg"
                loading={submitting}
                disabled={!name || !email || !msg}
                icon={FiSend}
              >
                Send Message
              </GradientButton>
            </form>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
