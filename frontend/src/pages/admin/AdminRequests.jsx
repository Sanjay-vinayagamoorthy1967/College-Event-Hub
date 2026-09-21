import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { FiCheck, FiX, FiClock, FiShield, FiUserX, FiTrash2, FiSearch, FiFilter } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await api.get('/admin/requests');
      setRequests(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch admin requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this admin request?')) return;
    try {
      await api.post(`/admin/requests/${id}/approve`);
      toast.success('Admin request approved successfully');
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve request');
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject this admin request?')) return;
    try {
      await api.post(`/admin/requests/${id}/reject`);
      toast.success('Admin request rejected successfully');
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject request');
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this admin? They will lose access to the portal.')) return;
    try {
      await api.post(`/admin/requests/${id}/deactivate`);
      toast.success('Admin deactivated successfully');
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to deactivate admin');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this admin account? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/requests/${id}`);
      toast.success('Admin deleted successfully');
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete admin');
    }
  };

  const filteredRequests = useMemo(() => {
    let res = requests;
    
    // Status Filter
    if (filter !== 'all') {
      res = res.filter(r => r.approvalStatus === filter);
    }
    
    // Search Filter
    if (search) {
      const lower = search.toLowerCase();
      res = res.filter(r => r.name.toLowerCase().includes(lower) || r.email.toLowerCase().includes(lower));
    }
    
    return res;
  }, [requests, search, filter]);

  // Statistics
  const stats = useMemo(() => {
    return {
      pending: requests.filter(r => r.approvalStatus === 'pending').length,
      approved: requests.filter(r => r.approvalStatus === 'approved').length,
      rejected: requests.filter(r => r.approvalStatus === 'rejected').length
    };
  }, [requests]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-sora text-dark-900">Admin Approval</h1>
        <p className="text-dark-600 mt-1">Review, approve, and manage administrator access.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div>
            <p className="text-amber-800 font-bold mb-1 uppercase tracking-wider text-xs">Pending Requests</p>
            <h3 className="text-4xl font-black text-amber-900">{stats.pending}</h3>
          </div>
          <div className="w-14 h-14 bg-amber-200 text-amber-700 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
            <FiClock />
          </div>
        </div>
        <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div>
            <p className="text-emerald-800 font-bold mb-1 uppercase tracking-wider text-xs">Approved Admins</p>
            <h3 className="text-4xl font-black text-emerald-900">{stats.approved}</h3>
          </div>
          <div className="w-14 h-14 bg-emerald-200 text-emerald-700 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
            <FiShield />
          </div>
        </div>
        <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div>
            <p className="text-rose-800 font-bold mb-1 uppercase tracking-wider text-xs">Rejected Requests</p>
            <h3 className="text-4xl font-black text-rose-900">{stats.rejected}</h3>
          </div>
          <div className="w-14 h-14 bg-rose-200 text-rose-700 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
            <FiX />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#E5E7EB] space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-dark-50 p-4 rounded-2xl border border-[#E5E7EB]">
          <div className="relative w-full md:w-96">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" />
            <input 
              type="text" 
              placeholder="Search by Name or Email..." 
              className="w-full pl-11 pr-4 py-3 border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all font-medium text-dark-900 placeholder-dark-400 bg-white shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto relative">
            <div className="absolute left-4 text-dark-500 pointer-events-none">
              <FiFilter />
            </div>
            <select 
              className="bg-white border border-[#E5E7EB] rounded-xl pl-11 pr-10 py-3 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all w-full md:w-48 text-sm font-bold text-dark-700 shadow-sm appearance-none cursor-pointer"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-dark-400 text-xs">
              ▼
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-dark-50 text-dark-300 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <FiUserX size={40} />
            </div>
            <h3 className="text-xl font-bold font-sora text-dark-900 mb-2">No Administrators Found</h3>
            <p className="text-dark-500 max-w-md">There are no admins matching your current search or filter criteria. Try clearing your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[#E5E7EB] shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-dark-900 text-white font-bold uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-6 py-5 rounded-tl-2xl">Profile</th>
                  <th className="px-6 py-5">Contact Details</th>
                  <th className="px-6 py-5">Registration Date</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5 text-right rounded-tr-2xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] bg-white">
                {filteredRequests.map((req) => (
                  <tr key={req._id} className="hover:bg-dark-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 text-primary-800 flex items-center justify-center font-black text-lg shadow-sm border border-primary-200">
                          {req.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-dark-900 text-base group-hover:text-primary-600 transition-colors">{req.name}</div>
                          <div className="text-xs font-semibold text-dark-500 uppercase tracking-wide mt-0.5">{req.role === 'super_admin' ? 'Super Admin' : 'Admin'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-dark-900 font-medium mb-1">{req.email}</div>
                      <div className="text-dark-500 font-mono text-xs">{req.phone || 'No Mobile Number'}</div>
                    </td>
                    <td className="px-6 py-4 text-dark-600 font-medium text-xs">
                      {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      <br/>
                      <span className="text-dark-400">{new Date(req.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2 items-start">
                        {req.verified ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-1.5 text-[10px] uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-md"><FiCheck size={12}/> Email Verified</span>
                        ) : (
                          <span className="text-amber-600 font-bold flex items-center gap-1.5 text-[10px] uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded-md"><FiClock size={12}/> Unverified Email</span>
                        )}
                        
                        {req.approvalStatus === 'pending' && (
                          <span className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 shadow-sm">
                            Pending Approval
                          </span>
                        )}
                        {req.approvalStatus === 'approved' && (
                          <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 shadow-sm">
                            Approved
                          </span>
                        )}
                        {req.approvalStatus === 'rejected' && (
                          <span className="px-3 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 shadow-sm">
                            Rejected
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {req.approvalStatus === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleApprove(req._id)} 
                              title="Approve Request"
                              className="w-10 h-10 flex items-center justify-center text-emerald-600 bg-emerald-50 hover:bg-emerald-500 hover:text-white rounded-xl transition-all shadow-sm"
                            >
                              <FiCheck size={20} strokeWidth={3} />
                            </button>
                            <button 
                              onClick={() => handleReject(req._id)} 
                              title="Reject Request"
                              className="w-10 h-10 flex items-center justify-center text-rose-600 bg-rose-50 hover:bg-rose-500 hover:text-white rounded-xl transition-all shadow-sm"
                            >
                              <FiX size={20} strokeWidth={3} />
                            </button>
                          </>
                        )}
                        {req.approvalStatus === 'approved' && (
                          <>
                            <button 
                              onClick={() => handleDeactivate(req._id)} 
                              title="Deactivate Admin Access"
                              className="w-10 h-10 flex items-center justify-center text-amber-600 bg-amber-50 hover:bg-amber-500 hover:text-white rounded-xl transition-all shadow-sm"
                            >
                              <FiUserX size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(req._id)} 
                              title="Permanently Delete Admin"
                              className="w-10 h-10 flex items-center justify-center text-rose-600 bg-rose-50 hover:bg-rose-500 hover:text-white rounded-xl transition-all shadow-sm"
                            >
                              <FiTrash2 size={18} />
                            </button>
                          </>
                        )}
                        {req.approvalStatus === 'rejected' && (
                          <button 
                            onClick={() => handleDelete(req._id)} 
                            title="Permanently Delete Request"
                            className="w-10 h-10 flex items-center justify-center text-rose-600 bg-rose-50 hover:bg-rose-500 hover:text-white rounded-xl transition-all shadow-sm"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
