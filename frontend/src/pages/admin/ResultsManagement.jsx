import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FiCheck, FiTrash2, FiAward, FiStar, FiInfo, FiEdit2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { eventService } from '../../services/eventService';
import GlassCard from '../../components/ui/GlassCard';
import GradientButton from '../../components/ui/GradientButton';

const PRIZE_TYPES = [
  'Cash',
  'Medal',
  'Certificate',
  'Trophy',
  'Cash + Medal',
  'Cash + Certificate',
  'Medal + Certificate',
  'Trophy + Certificate',
  'Cash + Medal + Certificate'
];

export default function ResultsManagement() {
  const [completedEvents, setCompletedEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [results, setResults] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const initialFormState = {
    firstPrize: { winnerName: '', collegeName: '', department: '', year: '', prizeType: 'Certificate', cashAmount: '' },
    secondPrize: { winnerName: '', collegeName: '', department: '', year: '', prizeType: 'Certificate', cashAmount: '' },
    thirdPrize: { winnerName: '', collegeName: '', department: '', year: '', prizeType: 'Certificate', cashAmount: '' }
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    loadCompletedEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadEventDetails(selectedEventId);
    } else {
      setResults(null);
      setIsEditing(false);
      setFormData(initialFormState);
    }
  }, [selectedEventId]);

  const loadCompletedEvents = async () => {
    setLoadingEvents(true);
    try {
      const response = await eventService.getCompletedEvents();
      if (response.success) {
        setCompletedEvents(response.data);
      }
    } catch (error) {
      toast.error('Failed to load completed events.');
    } finally {
      setLoadingEvents(false);
    }
  };

  const loadEventDetails = async (eventId) => {
    setLoadingResults(true);
    try {
      const response = await eventService.getEventFullDetails(eventId);
      if (response.success && response.data && response.data.winners) {
        setResults(response.data.winners);
        setIsEditing(false);
        setFormData({
          firstPrize: {
            winnerName: response.data.winners.firstPrize.winnerName || '',
            collegeName: response.data.winners.firstPrize.collegeName || '',
            department: response.data.winners.firstPrize.department || '',
            year: response.data.winners.firstPrize.year || '',
            prizeType: response.data.winners.firstPrize.prizeType || 'Certificate',
            cashAmount: response.data.winners.firstPrize.cashAmount !== undefined && response.data.winners.firstPrize.cashAmount !== 0 ? response.data.winners.firstPrize.cashAmount : ''
          },
          secondPrize: {
            winnerName: response.data.winners.secondPrize.winnerName || '',
            collegeName: response.data.winners.secondPrize.collegeName || '',
            department: response.data.winners.secondPrize.department || '',
            year: response.data.winners.secondPrize.year || '',
            prizeType: response.data.winners.secondPrize.prizeType || 'Certificate',
            cashAmount: response.data.winners.secondPrize.cashAmount !== undefined && response.data.winners.secondPrize.cashAmount !== 0 ? response.data.winners.secondPrize.cashAmount : ''
          },
          thirdPrize: {
            winnerName: response.data.winners.thirdPrize.winnerName || '',
            collegeName: response.data.winners.thirdPrize.collegeName || '',
            department: response.data.winners.thirdPrize.department || '',
            year: response.data.winners.thirdPrize.year || '',
            prizeType: response.data.winners.thirdPrize.prizeType || 'Certificate',
            cashAmount: response.data.winners.thirdPrize.cashAmount !== undefined && response.data.winners.thirdPrize.cashAmount !== 0 ? response.data.winners.thirdPrize.cashAmount : ''
          }
        });
      } else {
        setResults(null);
        setIsEditing(false);
        setFormData(initialFormState);
      }
    } catch (error) {
      toast.error('Failed to load event data.');
    } finally {
      setLoadingResults(false);
    }
  };

  const handleChange = (position, field, value) => {
    setFormData(prev => ({
      ...prev,
      [position]: {
        ...prev[position],
        [field]: value
      }
    }));
  };

  const validateForm = () => {
    for (const pos of ['firstPrize', 'secondPrize', 'thirdPrize']) {
      const data = formData[pos];
      if (!data.winnerName.trim() || !data.collegeName.trim() || !data.department.trim() || !data.year.trim() || !data.prizeType) {
        return false;
      }
    }
    
    // Check for duplicate names
    const names = [formData.firstPrize.winnerName.trim(), formData.secondPrize.winnerName.trim(), formData.thirdPrize.winnerName.trim()];
    const uniqueNames = new Set(names);
    if (uniqueNames.size !== 3) {
      toast.error('One student cannot win more than one position in the same event.');
      return false;
    }
    
    return true;
  };

  const handlePublishResults = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please enter all three prize winners before publishing results.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        firstPrize: { ...formData.firstPrize, cashAmount: Number(formData.firstPrize.cashAmount) || 0 },
        secondPrize: { ...formData.secondPrize, cashAmount: Number(formData.secondPrize.cashAmount) || 0 },
        thirdPrize: { ...formData.thirdPrize, cashAmount: Number(formData.thirdPrize.cashAmount) || 0 }
      };

      const res = await eventService.addEventResult(selectedEventId, payload);
      if (res.success) {
        toast.success('Results published successfully!');
        loadEventDetails(selectedEventId);
        loadCompletedEvents();
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to publish results';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteResults = async () => {
    if (!window.confirm('Are you sure you want to delete the published results?')) return;
    
    try {
      await eventService.deleteEventResult(selectedEventId, 'all');
      toast.success('Results deleted successfully');
      loadEventDetails(selectedEventId);
      loadCompletedEvents();
    } catch (error) {
      toast.error('Failed to delete results');
    }
  };

  const renderFormSection = (position, title, colorClass, icon) => {
    const data = formData[position];
    const needsCashAmount = data.prizeType.includes('Cash');
    
    return (
      <div className={`p-6 rounded-2xl border ${colorClass} mb-6`}>
        <h4 className="text-lg font-bold font-sora flex items-center gap-2 mb-4">
          <span className="text-2xl">{icon}</span> {title}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-dark-700 mb-1">Winner Name <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              value={data.winnerName} 
              onChange={(e) => handleChange(position, 'winnerName', e.target.value)} 
              className="w-full px-4 py-2 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" 
              placeholder="e.g. Rahul Kumar" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-dark-700 mb-1">College Name <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              value={data.collegeName} 
              onChange={(e) => handleChange(position, 'collegeName', e.target.value)} 
              className="w-full px-4 py-2 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" 
              placeholder="e.g. PSG College of Technology" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-dark-700 mb-1">Department <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              value={data.department} 
              onChange={(e) => handleChange(position, 'department', e.target.value)} 
              className="w-full px-4 py-2 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" 
              placeholder="e.g. CSE" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-dark-700 mb-1">Year <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              value={data.year} 
              onChange={(e) => handleChange(position, 'year', e.target.value)} 
              className="w-full px-4 py-2 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" 
              placeholder="e.g. 3" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-dark-700 mb-1">Prize Type <span className="text-red-500">*</span></label>
            <select 
              value={data.prizeType} 
              onChange={(e) => handleChange(position, 'prizeType', e.target.value)} 
              className="w-full px-4 py-2 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              {PRIZE_TYPES.map(pt => <option key={pt} value={pt}>{pt}</option>)}
            </select>
          </div>
          {needsCashAmount && (
            <div>
              <label className="block text-xs font-semibold text-dark-700 mb-1">Cash Amount (₹) <span className="text-slate-400">(optional)</span></label>
              <input 
                type="number" 
                value={data.cashAmount} 
                onChange={(e) => handleChange(position, 'cashAmount', e.target.value)} 
                className="w-full px-4 py-2 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" 
                placeholder="e.g. 10000" 
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-sora text-dark-900">Results Management</h1>
        <p className="text-dark-600 mt-1">Publish winners for completed events.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column: Event Selection */}
        <div className="lg:col-span-1 space-y-6">
          <GlassCard className="p-6 border border-[#E5E7EB] shadow-sm">
            <h3 className="text-lg font-bold font-sora text-dark-900 mb-4 flex items-center gap-2">
              <FiCheck className="text-emerald-500" /> Select Event
            </h3>
            
            {loadingEvents ? (
              <div className="flex justify-center py-4"><div className="w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : (
              <div className="space-y-4">
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">-- Choose Completed Event --</option>
                  {completedEvents.map(evt => (
                    <option key={evt._id} value={evt._id}>
                      {evt.title} {evt.hasResults ? '(Published)' : ''}
                    </option>
                  ))}
                </select>
                
                {selectedEventId && (
                  <div className="p-4 bg-primary-50 border border-primary-100 rounded-xl flex items-start gap-2">
                    <FiInfo className="text-primary-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-primary-800">
                      Results must include 1st, 2nd, and 3rd prizes. Once published, they will appear publicly.
                    </p>
                  </div>
                )}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Right Column: Form or Published Results */}
        <div className="lg:col-span-3">
          <GlassCard className="p-6 border border-[#E5E7EB] shadow-sm min-h-[500px]">
            {!selectedEventId ? (
              <div className="flex flex-col items-center justify-center h-full text-dark-400 min-h-[400px]">
                <FiAward size={48} className="mb-4 opacity-20" />
                <p>Select a completed event to publish or view its results.</p>
              </div>
            ) : loadingResults ? (
              <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : (results && !isEditing) ? (
              // Results Already Published View
              <div>
                <div className="flex justify-between items-center mb-6 border-b border-[#E5E7EB] pb-4">
                  <h3 className="text-xl font-bold font-sora text-dark-900 flex items-center gap-2">
                    <FiStar className="text-yellow-500" /> Results Published
                  </h3>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl font-semibold text-sm transition-colors"
                    >
                      <FiEdit2 /> Edit Results
                    </button>
                    <button 
                      onClick={handleDeleteResults}
                      className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-semibold text-sm transition-colors"
                    >
                      <FiTrash2 /> Delete Results
                    </button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {[
                    { pos: results.firstPrize, label: 'First Prize', icon: '🥇', bg: 'bg-amber-50', border: 'border-amber-200' },
                    { pos: results.secondPrize, label: 'Second Prize', icon: '🥈', bg: 'bg-slate-50', border: 'border-slate-200' },
                    { pos: results.thirdPrize, label: 'Third Prize', icon: '🥉', bg: 'bg-orange-50', border: 'border-orange-200' }
                  ].map((prize, idx) => {
                    if (!prize.pos) return null;
                    return (
                      <div key={idx} className={`p-4 rounded-2xl border ${prize.border} ${prize.bg} flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}>
                        <div className="flex items-center gap-4">
                          <div className="text-4xl">{prize.icon}</div>
                          <div>
                            <p className="text-xs font-bold text-dark-500 uppercase tracking-wider">{prize.label}</p>
                            <h4 className="text-lg font-bold text-dark-900">{prize.pos.winnerName}</h4>
                            <p className="text-sm text-dark-600">{prize.pos.collegeName} • {prize.pos.department} • Year {prize.pos.year}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="px-3 py-1 bg-white border border-[#E5E7EB] rounded-lg text-sm font-bold text-dark-800 shadow-sm">
                            {prize.pos.cashAmount > 0 ? `₹${prize.pos.cashAmount.toLocaleString()} Cash + ` : ''}{prize.pos.prizeType}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              // Form to Publish/Edit Results
              <form onSubmit={handlePublishResults}>
                <h3 className="text-xl font-bold font-sora text-dark-900 mb-6 flex items-center gap-2 border-b border-[#E5E7EB] pb-4">
                  <FiAward className="text-primary-500" /> {results ? 'Edit Event Results' : 'Publish Event Results'}
                </h3>
                
                {renderFormSection('firstPrize', 'First Prize', 'bg-amber-50/50 border-amber-200', '🥇')}
                {renderFormSection('secondPrize', 'Second Prize', 'bg-slate-50 border-slate-200', '🥈')}
                {renderFormSection('thirdPrize', 'Third Prize', 'bg-orange-50/50 border-orange-200', '🥉')}

                <div className="flex justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
                  {results && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold font-sora rounded-2xl text-sm transition-all"
                    >
                      Cancel
                    </button>
                  )}
                  <GradientButton
                    variant="gradient"
                    type="submit"
                    disabled={submitting}
                    icon={FiStar}
                    size="lg"
                  >
                    {submitting ? 'Publishing...' : 'Publish Results'}
                  </GradientButton>
                </div>
              </form>
            )}
          </GlassCard>
        </div>

      </div>
    </div>
  );
}
