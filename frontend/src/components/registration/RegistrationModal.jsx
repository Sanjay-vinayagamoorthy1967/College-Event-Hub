import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FiX, FiCheckCircle } from 'react-icons/fi';
import Input from '../ui/Input';
import GradientButton from '../ui/GradientButton';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/helpers';

export default function RegistrationModal({ isOpen, onClose, event, onRegisterSuccess }) {
  const { user, userType } = useAuth();
  
  const isPaid = event?.internalPrice > 0 || event?.externalPrice > 0;
  const fee = userType === 'student_internal' ? event?.internalPrice : event?.externalPrice;

  const [formData, setFormData] = useState({
    fullName: '',
    usn: '',
    collegeName: '',
    department: '',
    yearSemester: '',
    email: '',
    phone: '',
    foodPreference: 'veg',
    registrationType: 'individual',
    teamSize: 2,
    teamName: '',
    teamMembers: [
      { name: '', usn: '', email: '', phone: '' },
      { name: '', usn: '', email: '', phone: '' },
      { name: '', usn: '', email: '', phone: '' },
    ]
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.name || '',
        usn: user.registerNumber || '',
        collegeName: user.collegeName || (userType === 'student_internal' ? 'College Event Hub' : ''),
        department: user.department || '',
        yearSemester: user.year || '',
        email: user.email || '',
        phone: user.phone || '',
      }));
    }
  }, [user, userType]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const isTeam = formData.registrationType === 'team';
  const teamSizeNum = isTeam ? Number(formData.teamSize) : 1;
  const totalFee = isTeam ? fee * teamSizeNum : fee;
  const isFreeTotal = !isPaid || totalFee === 0;

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName) newErrors.fullName = 'Full Name is required';
    if (!formData.usn) newErrors.usn = 'USN / Student ID is required';
    if (!formData.collegeName) newErrors.collegeName = 'College Name is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.yearSemester) newErrors.yearSemester = 'Year / Semester is required';
    
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    
    if (!formData.phone) newErrors.phone = 'Mobile Number is required';
    else if (!/^[6-9]\d{9}$/.test(formData.phone)) newErrors.phone = 'Invalid 10-digit phone number';

    if (formData.registrationType === 'team') {
      if (!formData.teamName) newErrors.teamName = 'Team Name is required';
      
      const requiredMembersCount = Number(formData.teamSize) - 1;
      for (let idx = 0; idx < requiredMembersCount; idx++) {
        const member = formData.teamMembers[idx];
        if (!member || !member.name) newErrors[`member_${idx}_name`] = 'Name is required';
        if (!member || !member.usn) newErrors[`member_${idx}_usn`] = 'USN is required';
        
        if (!member || !member.email) newErrors[`member_${idx}_email`] = 'Email is required';
        else if (!/^\S+@\S+\.\S+$/.test(member.email)) newErrors[`member_${idx}_email`] = 'Invalid email format';
        
        if (!member || !member.phone) newErrors[`member_${idx}_phone`] = 'Phone is required';
        else if (!/^[6-9]\d{9}$/.test(member.phone)) newErrors[`member_${idx}_phone`] = 'Invalid 10-digit phone number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleMemberChange = (idx, field, value) => {
    setFormData(prev => {
      const updatedMembers = [...prev.teamMembers];
      updatedMembers[idx] = { ...updatedMembers[idx], [field]: value };
      return { ...prev, teamMembers: updatedMembers };
    });
    
    const errKey = `member_${idx}_${field}`;
    if (errors[errKey]) {
      setErrors(prev => ({ ...prev, [errKey]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const submitData = { ...formData };
      if (formData.registrationType === 'team') {
        const requiredMembersCount = Number(formData.teamSize) - 1;
        submitData.teamMembers = formData.teamMembers.slice(0, requiredMembersCount);
      } else {
        submitData.teamMembers = [];
        submitData.teamSize = 1;
        submitData.teamName = '';
      }
      onRegisterSuccess(submitData);
    }
  };

  if (!isOpen || !event) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] overflow-y-auto p-4 flex justify-center items-start">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#0B0B0F]/80 backdrop-blur-sm z-0"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-[32px] border border-[#E5E7EB] shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh] z-10"
        >
          {/* Header */}
          <div className="flex-shrink-0 p-6 border-b border-[#E5E7EB] flex justify-between items-center bg-[#F8FAFC]">
            <div>
              <h2 className="text-2xl font-bold font-sora text-dark-900">Event Registration</h2>
              <p className="text-sm text-dark-600 mt-1">Registering for <span className="font-semibold text-primary-600">{event.title}</span></p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-dark-100 text-dark-400 hover:text-dark-900 transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          {/* Body - Scrollable Form */}
          <div className="flex-1 overflow-y-auto p-6">
            <form id="registrationForm" onSubmit={handleSubmit} className="space-y-6">
              
              {/* Event Auto-filled Details */}
              <div className="bg-primary-500/5 border border-primary-500/20 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex-1">
                  <p className="text-xs text-dark-500 font-semibold uppercase tracking-wider mb-1">Event Fee</p>
                  <p className="text-2xl font-bold font-sora text-dark-900">
                    {isFreeTotal ? 'FREE' : formatCurrency(totalFee)}
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-dark-500 font-semibold uppercase tracking-wider mb-1">Date & Time</p>
                  <p className="text-sm font-semibold text-dark-900">{new Date(event.date).toLocaleDateString()} • {event.startTime ? `${event.startTime} - ${event.endTime}` : event.time}</p>
                </div>
              </div>

              {/* Registration Type Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-dark-900 border-b border-[#E5E7EB] dark:border-dark-800 pb-2">Registration Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer p-3 bg-[#F8FAFC] dark:bg-dark-900/50 border border-[#E5E7EB] dark:border-dark-800 rounded-xl hover:border-primary-500 transition-colors flex-1">
                    <input 
                      type="radio" 
                      name="registrationType" 
                      value="individual" 
                      checked={formData.registrationType === 'individual'} 
                      onChange={handleChange}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500" 
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-dark-900">Individual</span>
                      <span className="text-[10px] text-dark-500">Register just for yourself</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-3 bg-[#F8FAFC] dark:bg-dark-900/50 border border-[#E5E7EB] dark:border-dark-800 rounded-xl hover:border-primary-500 transition-colors flex-1">
                    <input 
                      type="radio" 
                      name="registrationType" 
                      value="team" 
                      checked={formData.registrationType === 'team'} 
                      onChange={handleChange}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500" 
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-dark-900">Team (4 Members)</span>
                      <span className="text-[10px] text-dark-500">Register as a team</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Personal Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold font-sora text-dark-900 border-b border-[#E5E7EB] pb-2">
                  {formData.registrationType === 'team' ? 'Team Leader Details' : 'Participant Details'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    error={errors.fullName}
                    placeholder="Enter your full name"
                  />
                  <Input
                    label="USN / Student ID"
                    name="usn"
                    value={formData.usn}
                    onChange={handleChange}
                    error={errors.usn}
                    placeholder="e.g. 1RV20CS001"
                  />
                </div>

                <Input
                  label="College Name"
                  name="collegeName"
                  value={formData.collegeName}
                  onChange={handleChange}
                  error={errors.collegeName}
                  placeholder="Enter your college name"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    error={errors.department}
                    placeholder="e.g. Computer Science"
                  />
                  <Input
                    label="Year / Semester"
                    name="yearSemester"
                    value={formData.yearSemester}
                    onChange={handleChange}
                    error={errors.yearSemester}
                    placeholder="e.g. 3rd Year / 5th Sem"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    placeholder="Enter your email"
                  />
                  <Input
                    label="Mobile Number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    error={errors.phone}
                    placeholder="10-digit mobile number"
                  />
                </div>

                <div className="pt-2">
                  <label className="block text-sm font-medium mb-2 text-dark-600">Dietary / Food Preference</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl hover:border-primary-500 transition-colors flex-1">
                      <input 
                        type="radio" 
                        name="foodPreference" 
                        value="veg" 
                        checked={formData.foodPreference === 'veg'} 
                        onChange={handleChange}
                        className="w-4 h-4 text-primary-600 focus:ring-primary-500" 
                      />
                      <span className="text-sm font-semibold text-dark-900">Vegetarian</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl hover:border-primary-500 transition-colors flex-1">
                      <input 
                        type="radio" 
                        name="foodPreference" 
                        value="non-veg" 
                        checked={formData.foodPreference === 'non-veg'} 
                        onChange={handleChange}
                        className="w-4 h-4 text-primary-600 focus:ring-primary-500" 
                      />
                      <span className="text-sm font-semibold text-dark-900">Non-Vegetarian</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Team Members Details */}
              {formData.registrationType === 'team' && (
                <div className="space-y-6 pt-4 border-t border-[#E5E7EB] dark:border-dark-800">
                  <h3 className="text-sm font-bold font-sora text-dark-900 border-b border-[#E5E7EB] pb-2">Team Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Team Name"
                      name="teamName"
                      value={formData.teamName}
                      onChange={handleChange}
                      error={errors.teamName}
                      placeholder="Enter your team name"
                    />

                    <div>
                      <label className="block text-sm font-medium mb-2 text-dark-600">Total Team Size (including you)</label>
                      <select
                        name="teamSize"
                        value={formData.teamSize}
                        onChange={handleChange}
                        className="w-full px-5 py-3.5 rounded-2xl font-poppins text-dark-900 bg-[#F8FAFC] dark:bg-dark-900/50 border border-[#E5E7EB] dark:border-dark-800 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all duration-300"
                      >
                        <option value="2">2 Members</option>
                        <option value="3">3 Members</option>
                        <option value="4">4 Members (Maximum)</option>
                      </select>
                    </div>
                  </div>

                  {Array.from({ length: Number(formData.teamSize) - 1 }).map((_, idx) => {
                    const member = formData.teamMembers[idx] || { name: '', usn: '', email: '', phone: '' };
                    return (
                      <div key={idx} className="p-4 bg-[#F8FAFC] dark:bg-dark-900/50 border border-[#E5E7EB] dark:border-dark-800 rounded-2xl space-y-4">
                        <h4 className="text-xs font-bold text-primary-500 uppercase tracking-widest">Team Member {idx + 2}</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            label="Full Name"
                            value={member.name}
                            onChange={(e) => handleMemberChange(idx, 'name', e.target.value)}
                            error={errors[`member_${idx}_name`]}
                            placeholder={`Member ${idx + 2} full name`}
                          />
                          <Input
                            label="USN / Student ID"
                            value={member.usn}
                            onChange={(e) => handleMemberChange(idx, 'usn', e.target.value)}
                            error={errors[`member_${idx}_usn`]}
                            placeholder="e.g. 1RV20CS002"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            label="Email Address"
                            type="email"
                            value={member.email}
                            onChange={(e) => handleMemberChange(idx, 'email', e.target.value)}
                            error={errors[`member_${idx}_email`]}
                            placeholder="email@college.edu"
                          />
                          <Input
                            label="Mobile Number"
                            value={member.phone}
                            onChange={(e) => handleMemberChange(idx, 'phone', e.target.value)}
                            error={errors[`member_${idx}_phone`]}
                            placeholder="10-digit number"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 p-6 border-t border-[#E5E7EB] bg-[#F8FAFC] flex justify-end gap-3">
            <GradientButton variant="secondary" onClick={onClose} type="button">
              Cancel
            </GradientButton>
            <GradientButton variant="gradient" type="submit" form="registrationForm" icon={isFreeTotal ? FiCheckCircle : undefined}>
              {isFreeTotal ? 'Confirm Registration' : `Proceed to Pay ${formatCurrency(totalFee)}`}
            </GradientButton>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
