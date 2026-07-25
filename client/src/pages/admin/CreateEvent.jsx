import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { eventService } from '../../services/eventService';
import { adminService } from '../../services/adminService';
import CertificateEditor from '../../components/admin/CertificateEditor';
import { CATEGORIES, VENUES } from '../../utils/constants';
import { FiCalendar, FiPlus, FiTrash, FiCheck, FiFolder, FiMapPin, FiClock, FiUploadCloud, FiEye, FiDownload, FiFileText } from 'react-icons/fi';
import GlassCard from '../../components/ui/GlassCard';
import Input from '../../components/ui/Input';
import GradientButton from '../../components/ui/GradientButton';
import toast from 'react-hot-toast';

export default function CreateEvent() {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const [posterFile, setPosterFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Certificate template states
  const [useCustomTemplate, setUseCustomTemplate] = useState(true);
  const [templateUrl, setTemplateUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(null);
  const [editorConfig, setEditorConfig] = useState(null);
  const [fullPreviewOpen, setFullPreviewOpen] = useState(false);

  const [availability, setAvailability] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [conflictError, setConflictError] = useState(null);
  const [conflictDetails, setConflictDetails] = useState(null);

  const { register, control, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: {
      schedule: [{ time: '', activity: '', description: '' }],
      rules: [''],
      prizes: [{ position: '1st Place', amount: '₹', description: '' }],
      coordinators: [{ name: '', phone: '', role: '' }]
    }
  });

  const { fields: scheduleFields, append: appendSchedule, remove: removeSchedule } = useFieldArray({
    control,
    name: 'schedule'
  });

  const { fields: rulesFields, append: appendRule, remove: removeRule } = useFieldArray({
    control,
    name: 'rules'
  });

  const { fields: prizeFields, append: appendPrize, remove: removePrize } = useFieldArray({
    control,
    name: 'prizes'
  });

  const { fields: coordFields, append: appendCoord, remove: removeCoord } = useFieldArray({
    control,
    name: 'coordinators'
  });

  useEffect(() => {
    if (isEditMode) {
      loadEventForEdit();
    }
  }, [id]);

  const watchedVenue = watch('venue');
  const watchedDate = watch('date');
  const watchedStartTime = watch('startTime');
  const watchedEndTime = watch('endTime');
  const [refreshKey, setRefreshKey] = useState(0);

  const FIXED_SLOTS = [
    { start: '09:00', end: '10:00', label: '09:00 AM - 10:00 AM' },
    { start: '10:00', end: '11:00', label: '10:00 AM - 11:00 AM' },
    { start: '11:00', end: '12:00', label: '11:00 AM - 12:00 PM' },
    { start: '12:00', end: '13:00', label: '12:00 PM - 01:00 PM' },
    { start: '13:00', end: '14:00', label: '01:00 PM - 02:00 PM' },
    { start: '14:00', end: '15:00', label: '02:00 PM - 03:00 PM' },
    { start: '15:00', end: '16:00', label: '03:00 PM - 04:00 PM' },
    { start: '16:00', end: '17:00', label: '04:00 PM - 05:00 PM' }
  ];

  const formatTo12Hour = (time24) => {
    if (!time24) return '';
    const [hoursStr, minutesStr] = time24.split(':');
    let hours = parseInt(hoursStr, 10);
    const minutes = minutesStr;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hoursFormatted = hours < 10 ? '0' + hours : hours;
    return `${hoursFormatted}:${minutes} ${ampm}`;
  };

  useEffect(() => {
    const fetchBookings = async () => {
      if (watchedVenue && watchedDate) {
        setAvailability('checking');
        try {
          const res = await eventService.getVenueBookings({
            venue: watchedVenue,
            date: watchedDate,
            eventId: isEditMode ? id : undefined
          });
          setBookedSlots(res.bookedSlots || []);
          setAvailableSlots(res.availableSlots || []);
          setAvailability(res.bookedSlots?.length === 0 ? 'available' : 'booked_slots_exist');
        } catch (error) {
          console.error(error);
          setAvailability('error');
        }
      } else {
        setAvailability(null);
        setBookedSlots([]);
        setAvailableSlots([]);
      }
    };

    fetchBookings();
  }, [watchedVenue, watchedDate, isEditMode, id, refreshKey]);

  useEffect(() => {
    if (watchedStartTime && watchedEndTime && bookedSlots.length > 0) {
      const overlap = bookedSlots.find(s => watchedStartTime < s.endTime && watchedEndTime > s.startTime);
      if (overlap) {
        setConflictError('conflict');
        setConflictDetails(overlap);
      } else {
        setConflictError(null);
        setConflictDetails(null);
      }
    } else {
      setConflictError(null);
      setConflictDetails(null);
    }
  }, [watchedStartTime, watchedEndTime, bookedSlots]);

  const loadEventForEdit = async () => {
    try {
      const data = await eventService.getEventById(id);
      const event = data.data || data.event;
      reset(event);

      // Load template configuration
      try {
        const templateRes = await adminService.getTemplate(id);
        if (templateRes && templateRes.success && templateRes.data) {
          const tData = templateRes.data;
          setUseCustomTemplate(true);
          setTemplateUrl(tData.templateUrl || '');
          setEditorConfig(tData);
        }
      } catch (templateErr) {
        console.error('Failed to load certificate template:', templateErr);
      }
    } catch (err) {
      toast.error('Failed to load event data.');
    }
  };

  const handlePosterChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPosterFile(e.target.files[0]);
    }
  };

  const handleCustomTemplateUpload = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('template', file);

      setUploadProgress(0);
      toast.loading('Uploading custom template...', { id: 'template_upload' });
      try {
        const res = await adminService.uploadTemplate(formData, (progress) => {
          setUploadProgress(progress);
        });
        setTemplateUrl(res.url);
        toast.success('Custom certificate template uploaded!', { id: 'template_upload' });
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to upload custom template', { id: 'template_upload' });
      } finally {
        setUploadProgress(null);
      }
    }
  };

  const handleAutoSave = async (config) => {
    setEditorConfig(config);
    if (!isEditMode || !id) {
      return Promise.resolve();
    }
    try {
      const templateConfig = {
        useDefault: false,
        templateUrl: templateUrl || '',
        placeholders: config ? config.placeholders : [],
        customTexts: config ? config.customTexts : [],
        customImages: config ? config.customImages : [],
        layout: config?.layout || {},
        showGrid: config?.showGrid || false,
        snapToGrid: config?.snapToGrid || false,
        zoom: config?.zoom || 100
      };
      await adminService.updateTemplate(id, templateConfig);
    } catch (err) {
      console.error('Autosave failed:', err);
      throw err;
    }
  };

  useEffect(() => {
    if (isEditMode && id) {
      const saveTemplateSettings = async () => {
        try {
          const templateConfig = {
            useDefault: false,
            templateUrl: templateUrl || '',
            placeholders: editorConfig ? editorConfig.placeholders : [],
            customTexts: editorConfig ? editorConfig.customTexts : [],
            customImages: editorConfig ? editorConfig.customImages : [],
            layout: editorConfig?.layout || {},
            showGrid: editorConfig?.showGrid || false,
            snapToGrid: editorConfig?.snapToGrid || false,
            zoom: editorConfig?.zoom || 100
          };
          await adminService.updateTemplate(id, templateConfig);
        } catch (err) {
          console.error('Template settings save failed:', err);
        }
      };
      saveTemplateSettings();
    }
  }, [useCustomTemplate, templateUrl, isEditMode, id]);

  const onSubmit = async (data) => {
    if (!templateUrl) {
      toast.error('Please upload a certificate template before creating the event.');
      return;
    }

    if (!data.startTime || !data.endTime) {
      toast.error('Please enter start and end times.');
      return;
    }

    if (data.startTime >= data.endTime) {
      toast.error('End time must be after start time.');
      return;
    }
    
    if (conflictError === 'conflict') {
      toast.error('Venue is already booked for this time slot. Please select a different time or venue.');
      return;
    }
    
    setSubmitting(true);
    try {
      // Filter out empty schedule items (where both time and activity are empty)
      const cleanSchedule = (data.schedule || []).filter(
        (item) => item.time?.trim() !== '' || item.activity?.trim() !== ''
      );

      // Filter out empty rules
      const cleanRules = (data.rules || []).filter((rule) => rule?.trim() !== '');

      // Filter out empty coordinators (where name and phone are empty)
      const cleanCoordinators = (data.coordinators || []).filter(
        (item) => item.name?.trim() !== '' || item.phone?.trim() !== ''
      );

      // Filter out empty prizes (where position is empty)
      const cleanPrizes = (data.prizes || [])
        .filter((p) => p.position?.trim() !== '')
        .map((p) => ({
          ...p,
          amount: typeof p.amount === 'string' ? Number(p.amount.replace(/[^0-9.-]+/g, '')) || 0 : p.amount,
        }));

      const eventData = {
        title: data.title,
        description: data.description,
        category: data.category,
        date: data.date,
        time: `${formatTo12Hour(data.startTime)} - ${formatTo12Hour(data.endTime)}`,
        startTime: data.startTime,
        endTime: data.endTime,
        venue: data.venue,
        organizer: data.organizer,
        poster: data.poster,
        internalPrice: Number(data.internalPrice) || 0,
        externalPrice: Number(data.externalPrice) || 0,
        seatLimit: Number(data.seatLimit) || 100,
        schedule: cleanSchedule,
        rules: cleanRules,
        prizes: cleanPrizes,
        coordinators: cleanCoordinators,
      };

      let savedEventId = id;
      if (isEditMode) {
        await eventService.updateEvent(id, eventData);
      } else {
        const response = await eventService.createEvent(eventData);
        savedEventId = response.data?._id || response.event?._id;
      }

      // Save template configuration
      const templateConfig = {
        useDefault: false,
        templateUrl: templateUrl || '',
        placeholders: editorConfig ? editorConfig.placeholders : [],
        customTexts: editorConfig ? editorConfig.customTexts : [],
        customImages: editorConfig ? editorConfig.customImages : [],
        layout: editorConfig?.layout || {},
        showGrid: editorConfig?.showGrid || false,
        snapToGrid: editorConfig?.snapToGrid || false,
        zoom: editorConfig?.zoom || 100
      };

      await adminService.updateTemplate(savedEventId, templateConfig);

      if (isEditMode) {
        toast.success('Event updated successfully!');
        navigate(-1);
      } else {
        toast.success('Event created successfully!');
        navigate('/admin');
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 409) {
        toast.error(
          <div className="flex flex-col gap-1">
            <span className="font-bold text-base">Venue already booked.</span>
            <span>{data.venue}</span>
            <span>{new Date(data.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            <span>{data.startTime} - {data.endTime}</span>
            <span className="italic mt-1 text-xs">Please select another available slot.</span>
          </div>, 
          { duration: 6000 }
        );
        // Re-trigger fetch so UI reflects current state
        setRefreshKey(prev => prev + 1);
      } else {
        toast.error(err.response?.data?.message || 'Failed to save event');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 relative z-10 flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-black font-sora text-dark-900 dark:text-white leading-none mb-2">
          {isEditMode ? 'EDIT EVENT' : 'CREATE EVENT'}
        </h1>
        <p className="text-xs text-dark-600 dark:text-dark-300 font-poppins">
          Design schedules, pricing scales, rewards distributions, and coordinator details.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <GlassCard className="p-8 flex flex-col gap-4">
          <h3 className="text-base font-bold font-sora text-dark-900 dark:text-primary-400 mb-4 border-b border-dark-900/10 dark:border-white/5 pb-2 uppercase tracking-wide">
            1. Core Details
          </h3>

          <Input
            label="Event Title"
            name="title"
            placeholder="e.g. Code Debugging Showdown"
            error={errors.title}
            register={register}
            required="Event Title is required"
          />

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1.5 text-dark-600 dark:text-dark-300">Description</label>
            <textarea
              {...register('description', { required: 'Description is required' })}
              rows={4}
              placeholder="Provide a detailed description of the event details..."
              className="input-field py-3.5"
            />
            {errors.description && <p className="mt-1 text-xs text-red-500 font-medium">{errors.description.message}</p>}
          </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1.5 text-dark-600 dark:text-dark-300">Category</label>
                <select
                  {...register('category', { required: 'Category is required' })}
                  className="input-field py-3.5"
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map((cat, i) => (
                    <option key={i} value={cat}>{cat}</option>
                  ))}
                </select>
                {errors.category && <p className="mt-1 text-xs text-red-500 font-medium">{errors.category.message}</p>}
              </div>

              <Input
                label="Date"
                name="date"
                type="date"
                icon={FiCalendar}
                error={errors.date}
                register={register}
                required="Date is required"
              />

              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-dark-600 dark:text-dark-300">Venue Location</label>
                  {availability === 'checking' && <span className="text-xs text-dark-500">Checking...</span>}
                  {availability === 'available' && <span className="text-xs text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">🟢 Venue Available</span>}
                </div>
                <select
                  {...register('venue', { required: 'Venue is required' })}
                  className="input-field py-3.5"
                >
                  <option value="">Select Venue Location</option>
                  {VENUES.map((venue, i) => (
                    <option key={i} value={venue}>{venue}</option>
                  ))}
                </select>
                {errors.venue && <p className="mt-1 text-xs text-red-500 font-medium">{errors.venue.message}</p>}
                
                {/* Slots are now displayed directly inside the dropdown below */}
              </div>

              <div className="col-span-1 md:col-span-2 bg-dark-900/5 dark:bg-dark-900/40 p-4 rounded-xl border border-[#E5E7EB] dark:border-white/5">
                <div className="flex flex-col gap-4">
                  {conflictError && conflictDetails && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg flex flex-col gap-1">
                      <span className="font-bold">❌ Conflict detected! This venue is already booked for:</span>
                      <span>Event: {conflictDetails.title || conflictDetails.eventName}</span>
                      <span>Time: {conflictDetails.startTime} - {conflictDetails.endTime}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-dark-900 dark:text-white uppercase tracking-wider mb-2">Start Time</label>
                      <input
                        type="time"
                        {...register('startTime', { required: 'Start time is required' })}
                        className="w-full px-4 py-3 bg-white dark:bg-dark-800 border border-[#E5E7EB] dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                        disabled={!watchedVenue || !watchedDate}
                      />
                      {errors.startTime && <p className="mt-1 text-xs text-red-500 font-medium">{errors.startTime.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-dark-900 dark:text-white uppercase tracking-wider mb-2">End Time</label>
                      <input
                        type="time"
                        {...register('endTime', { required: 'End time is required' })}
                        className="w-full px-4 py-3 bg-white dark:bg-dark-800 border border-[#E5E7EB] dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                        disabled={!watchedVenue || !watchedDate}
                      />
                      {errors.endTime && <p className="mt-1 text-xs text-red-500 font-medium">{errors.endTime.message}</p>}
                    </div>
                  </div>
                </div>
              </div>

            <Input
              label="Organizer"
              name="organizer"
              placeholder="e.g. Department of CSE"
              error={errors.organizer}
              register={register}
            />

            <Input
              label="Poster Image URL"
              name="poster"
              placeholder="e.g. https://images.unsplash.com/..."
              error={errors.poster}
              register={register}
            />
          </div>
        </GlassCard>

        {/* Pricing & Seat Capacities */}
        <GlassCard className="p-8 flex flex-col gap-4">
          <h3 className="text-base font-bold font-sora text-dark-900 dark:text-secondary-400 mb-4 border-b border-dark-900/10 dark:border-white/5 pb-2 uppercase tracking-wide">
            2. Pricing & Capacity
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Our Student Fee (INR)"
              name="internalPrice"
              type="number"
              placeholder="0 (Free)"
              register={register}
            />

            <Input
              label="Other Student Fee (INR)"
              name="externalPrice"
              type="number"
              placeholder="0 (Free)"
              register={register}
            />

            <Input
              label="Seat Capacity Limit"
              name="seatLimit"
              type="number"
              placeholder="100"
              register={register}
            />
          </div>
        </GlassCard>

        {/* Schedule Builder */}
        <GlassCard className="p-8 flex flex-col gap-4">
          <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
            <h3 className="text-base font-bold font-sora text-dark-900 dark:text-accent-400 uppercase tracking-wide">
              3. Event Schedule
            </h3>
            <GradientButton
              variant="secondary"
              size="sm"
              icon={FiPlus}
              onClick={() => appendSchedule({ time: '', activity: '', description: '' })}
            >
              Add Activity
            </GradientButton>
          </div>

          <div className="flex flex-col gap-4">
            {scheduleFields.map((field, idx) => (
              <div key={field.id} className="flex flex-col md:flex-row gap-3 items-end bg-white/[0.01] p-4 rounded-2xl border border-white/5">
                <div className="w-full md:w-1/4">
                  <Input label="Time Slot" name={`schedule.${idx}.time`} placeholder="09:00 AM" register={register} />
                </div>
                <div className="w-full md:w-1/3">
                  <Input label="Activity Name" name={`schedule.${idx}.activity`} placeholder="Inauguration" register={register} />
                </div>
                <div className="w-full md:flex-1">
                  <Input label="Brief Description" name={`schedule.${idx}.description`} placeholder="Description" register={register} />
                </div>
                {scheduleFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSchedule(idx)}
                    className="p-3.5 mb-5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all border border-red-500/20 focus:outline-none"
                  >
                    <FiTrash />
                  </button>
                )}
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Support coordinators */}
        <GlassCard className="p-8 flex flex-col gap-4">
          <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
            <h3 className="text-base font-bold font-sora text-dark-900 dark:text-primary-400 uppercase tracking-wide">
              4. Support Coordinators
            </h3>
            <GradientButton
              variant="secondary"
              size="sm"
              icon={FiPlus}
              onClick={() => appendCoord({ name: '', phone: '', role: '' })}
            >
              Add Coordinator
            </GradientButton>
          </div>

          <div className="flex flex-col gap-4">
            {coordFields.map((field, idx) => (
              <div key={field.id} className="flex flex-col md:flex-row gap-3 items-end bg-white/[0.01] p-4 rounded-2xl border border-white/5">
                <div className="w-full md:w-1/3">
                  <Input label="Contact Name" name={`coordinators.${idx}.name`} placeholder="Dr. Rajesh" register={register} />
                </div>
                <div className="w-full md:w-1/3">
                  <Input label="Phone Number" name={`coordinators.${idx}.phone`} placeholder="9876543210" register={register} />
                </div>
                <div className="w-full md:flex-1">
                  <Input label="Role / Title" name={`coordinators.${idx}.role`} placeholder="Faculty Lead" register={register} />
                </div>
                {coordFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCoord(idx)}
                    className="p-3.5 mb-5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all border border-red-500/20 focus:outline-none"
                  >
                    <FiTrash />
                  </button>
                )}
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Rules & Rewards panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Rules list builder */}
          <GlassCard className="p-8 flex flex-col gap-4">
            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
              <h3 className="text-base font-bold font-sora text-dark-900 dark:text-secondary-400 uppercase tracking-wide">
                Rules
              </h3>
              <GradientButton
                variant="secondary"
                size="sm"
                icon={FiPlus}
                onClick={() => appendRule('')}
              >
                Add Rule
              </GradientButton>
            </div>

            <div className="flex flex-col gap-2">
              {rulesFields.map((field, idx) => (
                <div key={field.id} className="flex gap-2 items-center">
                  <Input placeholder="e.g. ID Cards are mandatory" name={`rules.${idx}`} register={register} className="mb-0" />
                  {rulesFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRule(idx)}
                      className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all border border-red-500/20 focus:outline-none"
                    >
                      <FiTrash />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Rewards list builder */}
          <GlassCard className="p-8 flex flex-col gap-4">
            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
              <h3 className="text-base font-bold font-sora text-dark-900 dark:text-accent-400 uppercase tracking-wide">
                Rewards / Prizes
              </h3>
              <GradientButton
                variant="secondary"
                size="sm"
                icon={FiPlus}
                onClick={() => appendPrize({ position: '', amount: '₹', description: '' })}
              >
                Add Prize
              </GradientButton>
            </div>

            <div className="flex flex-col gap-4">
              {prizeFields.map((field, idx) => (
                <div key={field.id} className="flex flex-col gap-2 p-3 bg-white/[0.01] rounded-2xl border border-white/5 relative">
                  <Input label="Position" name={`prizes.${idx}.position`} placeholder="1st Place" register={register} />
                  <Input label="Prize Value" name={`prizes.${idx}.amount`} placeholder="₹10,000" register={register} />
                  <Input label="Perks / Description" name={`prizes.${idx}.description`} placeholder="Cash reward + Merit certificate" register={register} />
                  {prizeFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePrize(idx)}
                      className="absolute top-2 right-2 p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all border border-red-500/20 focus:outline-none"
                    >
                      <FiTrash />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Poster File Upload */}
        <GlassCard className="p-8 flex flex-col gap-4">
          <h3 className="text-base font-bold font-sora text-dark-900 dark:text-primary-400 mb-4 border-b border-dark-900/10 dark:border-white/5 pb-2 uppercase tracking-wide">
            5. Attach Poster
          </h3>
          <div className="relative border-2 border-dashed border-dark-900/10 dark:border-white/10 rounded-2xl p-8 text-center cursor-pointer bg-dark-900/[0.02] dark:bg-white/[0.01] hover:bg-dark-900/[0.04] dark:hover:bg-white/[0.03] transition-all">
            <input
              type="file"
              accept="image/*"
              onChange={handlePosterChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center gap-2">
              <FiFolder className="text-4xl text-dark-400 mb-2" />
              <span className="text-sm font-semibold text-dark-900 dark:text-white">
                {posterFile ? posterFile.name : 'Select event poster image file'}
              </span>
              <span className="text-xs text-dark-400 font-bold uppercase">PNG, JPG up to 5MB</span>
            </div>
          </div>
        </GlassCard>

        {/* SECTION 5 - CERTIFICATE TEMPLATE */}
        <GlassCard className="p-8 flex flex-col gap-4">
          <h3 className="text-base font-bold font-sora text-dark-900 dark:text-primary-400 mb-4 border-b border-dark-900/10 dark:border-white/5 pb-2 uppercase tracking-wide">
            5. Certificate Template
          </h3>
          <p className="text-xs text-dark-500 mb-4">Upload a certificate design for this event. Supported formats: PNG, JPG, JPEG, PDF (Max size: 20MB).</p>

          <div className="flex flex-col gap-4">
            {!templateUrl ? (
              <div className="relative border-2 border-dashed border-dark-900/10 dark:border-white/10 rounded-2xl p-8 text-center cursor-pointer bg-dark-900/[0.02] dark:bg-white/[0.01] hover:bg-dark-900/[0.04] dark:hover:bg-white/[0.03] transition-all">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, application/pdf"
                  onChange={handleCustomTemplateUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-2">
                  <FiUploadCloud className="text-4xl text-dark-400 mb-2" />
                  <span className="text-sm font-semibold text-dark-900 dark:text-white">
                    Drag & Drop or Click to Select Template File
                  </span>
                  <span className="text-xs text-dark-400 font-bold uppercase">PNG, JPG, JPEG, PDF up to 20MB</span>
                  {uploadProgress !== null && (
                    <div className="w-full max-w-xs bg-gray-250 rounded-full h-2 mt-2">
                      <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row gap-6 p-4 bg-gray-50 dark:bg-dark-800 rounded-2xl border border-gray-150 dark:border-white/5 items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-12 bg-white dark:bg-dark-700 border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden flex items-center justify-center">
                    {templateUrl.toLowerCase().endsWith('.pdf') ? (
                      <FiFileText className="text-xl text-dark-400" />
                    ) : (
                      <img src={templateUrl} alt="Template thumbnail" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-bold text-dark-800 dark:text-white">Template Loaded</span>
                    <p className="text-xs text-dark-500 font-mono mt-0.5 truncate max-w-xs">{templateUrl.split('/').pop()}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-2 px-3 py-1.5 bg-primary-500 hover:bg-primary-650 text-white text-xs font-bold rounded-lg cursor-pointer transition-all shadow-sm">
                    Replace Template
                    <input type="file" accept="image/png, image/jpeg, image/jpg, application/pdf" className="hidden" onChange={handleCustomTemplateUpload} />
                  </label>
                  <button
                    type="button"
                    onClick={() => setTemplateUrl('')}
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-xs font-bold rounded-lg transition-all"
                  >
                    Remove Template
                  </button>
                  <a
                    href={templateUrl}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-dark-700 dark:hover:bg-dark-600 text-dark-700 dark:text-white text-xs font-bold rounded-lg transition-all border border-gray-300/40"
                  >
                    <FiDownload /> Download
                  </a>
                  <button
                    type="button"
                    onClick={() => setFullPreviewOpen(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-secondary-500/15 hover:bg-secondary-500/25 text-secondary-600 dark:text-secondary-400 border border-secondary-500/25 text-xs font-bold rounded-lg transition-all"
                  >
                    <FiEye /> View Full Preview
                  </button>
                </div>
              </div>
            )}
          </div>
        </GlassCard>

        {/* SECTION 6 - CERTIFICATE GENERATION SETTINGS */}
        {templateUrl && (
          <GlassCard className="p-8 flex flex-col gap-4">
            <h3 className="text-base font-bold font-sora text-dark-900 dark:text-primary-400 mb-4 border-b border-dark-900/10 dark:border-white/5 pb-2 uppercase tracking-wide">
              6. Certificate Generation Settings
            </h3>
            <p className="text-xs text-dark-500 mb-4">Overlay dynamic placeholders and custom text/images on top of the template.</p>
            <CertificateEditor
              templateUrl={templateUrl}
              initialData={editorConfig}
              onChange={(config) => setEditorConfig(config)}
              onAutoSave={handleAutoSave}
            />
          </GlassCard>
        )}

        {/* Full Image Preview Modal */}
        {fullPreviewOpen && (
          <div className="fixed inset-0 bg-black/85 z-[9999] flex items-center justify-center p-6" onClick={() => setFullPreviewOpen(false)}>
            <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-3xl p-2" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setFullPreviewOpen(false)}
                className="absolute -top-10 -right-2 text-white font-bold text-lg hover:opacity-85"
              >
                ✕ Close Preview
              </button>
              {templateUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe src={templateUrl} title="Template PDF" className="w-[800px] h-[600px] rounded-2xl" />
              ) : (
                <img src={templateUrl} alt="Template Preview" className="max-w-full max-h-[85vh] rounded-2xl object-contain" />
              )}
            </div>
          </div>
        )}

        {/* Bottom Form Actions */}
        <div className="flex justify-end gap-4">
          <GradientButton variant="secondary" size="lg" onClick={() => navigate('/admin')}>
            Cancel
          </GradientButton>
          <GradientButton 
            type="submit" 
            variant="gradient" 
            size="lg" 
            loading={submitting} 
            icon={FiCheck}
            disabled={!!conflictError}
          >
            {isEditMode ? 'Update Event' : 'Create Event'}
          </GradientButton>
        </div>
      </form>
    </div>
  );
}
