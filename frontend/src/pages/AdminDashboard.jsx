import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { adminService } from '../services/adminService';
import { formatCurrency, formatDate } from '../utils/helpers';
import { FiCalendar, FiUsers, FiAward, FiPlus, FiBookOpen, FiBell, FiCheck } from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import StatsCard from '../components/ui/StatsCard';
import GlassCard from '../components/ui/GlassCard';
import GradientButton from '../components/ui/GradientButton';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalRegistrations: 0,
    totalStudents: 0,
    totalPayments: 0,
    totalRevenue: 0,
    attendanceCount: 0,
    certificatesReleased: 0,
    notificationsSent: 0
  });
  
  const [revenueData, setRevenueData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [registrationData, setRegistrationData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    setLoading(true);
    try {
      const [statsRes, revRes, catRes, regRes] = await Promise.allSettled([
        adminService.getStats(),
        adminService.getRevenueChart(),
        adminService.getCategoryChart(),
        adminService.getRegistrationChart()
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (revRes.status === 'fulfilled') setRevenueData(revRes.value.chartData);
      if (catRes.status === 'fulfilled') setCategoryData(catRes.value.chartData);
      if (regRes.status === 'fulfilled') setRegistrationData(regRes.value.chartData);
    } catch (err) {
      console.warn('Backend dashboard stats failed, using fallback presentation data:', err.message);
      
      // Fallback Stats
      setStats({
        totalEvents: 6,
        totalRegistrations: 450,
        totalStudents: 1134,
        totalPayments: 320,
        totalRevenue: 152300,
        attendanceCount: 890,
        certificatesReleased: 420,
        notificationsSent: 1500
      });

      // Fallback Chart Data
      setRevenueData([
        { name: 'Jan', revenue: 20000 },
        { name: 'Feb', revenue: 45000 },
        { name: 'Mar', revenue: 30000 },
        { name: 'Apr', revenue: 80000 },
        { name: 'May', revenue: 95000 },
        { name: 'Jun', revenue: 152300 }
      ]);

      setCategoryData([
        { name: 'Tech', value: 3 },
        { name: 'Cultural', value: 2 },
        { name: 'Sports', value: 1 },
        { name: 'Workshop', value: 2 },
        { name: 'Hackathon', value: 1 }
      ]);

      setRegistrationData([
        { date: 'Mon', count: 120 },
        { date: 'Tue', count: 150 },
        { date: 'Wed', count: 220 },
        { date: 'Thu', count: 180 },
        { date: 'Fri', count: 320 },
        { date: 'Sat', count: 410 },
        { date: 'Sun', count: 450 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 relative z-10 flex flex-col gap-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-secondary-500 uppercase tracking-widest font-sora mb-2 block">Control Room</span>
          <h1 className="text-3xl md:text-5xl font-black font-sora text-dark-900">
            ADMIN <span className="gradient-text">PORTAL</span>
          </h1>
          <p className="text-xs text-dark-600 font-poppins mt-2">
            Real-time analytics, event creation pipelines, scanner registers, and approvals check-points.
          </p>
        </div>
        
        {/* Quick Operations Button Actions */}
        <div className="flex flex-wrap gap-3">
          <GradientButton variant="gradient" size="md" onClick={() => navigate('/admin/create-event')} icon={FiPlus}>
            New Event
          </GradientButton>
          <GradientButton variant="secondary" size="md" onClick={() => navigate('/admin/students')} icon={FiUsers}>
            Registrations
          </GradientButton>
          <GradientButton variant="secondary" size="md" onClick={() => navigate('/admin/scanner')} icon={FiBookOpen}>
            Scanner
          </GradientButton>
          <GradientButton variant="secondary" size="md" onClick={() => navigate('/admin/announcements')} icon={FiBell}>
            Announce
          </GradientButton>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats Grid Counters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard title="Total Events" value={stats.totalEvents} icon={FiCalendar} color="purple" />
            <StatsCard title="Total Students" value={stats.totalStudents} icon={FiUsers} color="blue" />
            <StatsCard title="Total Registrations" value={stats.totalRegistrations} icon={FiUsers} color="pink" />
            <StatsCard title="Total Payments" value={stats.totalPayments} icon={FaRupeeSign} color="amber" />
            <StatsCard title="Attendance Count" value={stats.attendanceCount} icon={FiCheck} color="emerald" />
            <StatsCard title="Certs Released" value={stats.certificatesReleased} icon={FiAward} color="green" />
            <StatsCard title="Notifications Sent" value={stats.notificationsSent} icon={FiBell} color="indigo" />
            <StatsCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={FaRupeeSign} color="amber" />
          </div>

          {/* Graphics Data Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chart 1: Revenue Line Graph */}
            <GlassCard className="lg:col-span-2 p-6 flex flex-col h-96">
              <h3 className="text-lg font-bold font-sora text-dark-900 mb-6">Revenue Trajectory (INR)</h3>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#a9a9b8" fontSize={11} />
                    <YAxis stroke="#a9a9b8" fontSize={11} />
                    <Tooltip contentStyle={{ background: '#0f0f17', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }} />
                    <Line type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={3} dot={{ fill: '#8B5CF6' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            {/* Chart 2: Category Pie Graph */}
            <GlassCard className="p-6 flex flex-col h-96">
              <h3 className="text-lg font-bold font-sora text-dark-900 mb-6">Event Categories Division</h3>
              <div className="flex-1 w-full flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0f0f17', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Labels legend */}
                <div className="absolute bottom-2 flex flex-wrap gap-2.5 justify-center">
                  {categoryData.map((entry, index) => (
                    <span key={index} className="text-[10px] font-semibold text-dark-600 flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      {entry.name}
                    </span>
                  ))}
                </div>
              </div>
            </GlassCard>

            {/* Chart 3: Weekly Registrations Bar Graph */}
            <GlassCard className="lg:col-span-3 p-6 flex flex-col h-96">
              <h3 className="text-lg font-bold font-sora text-dark-900 mb-6">Weekly Registrations Rate</h3>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={registrationData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="#a9a9b8" fontSize={11} />
                    <YAxis stroke="#a9a9b8" fontSize={11} />
                    <Tooltip contentStyle={{ background: '#0f0f17', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }} />
                    <Bar dataKey="count" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#EC4899" />
                        <stop offset="100%" stopColor="#8B5CF6" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>
        </>
      )}
    </div>
  );
}
