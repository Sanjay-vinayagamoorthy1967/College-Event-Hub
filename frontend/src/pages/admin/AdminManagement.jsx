import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import { FiUserPlus, FiEdit2, FiTrash2, FiPower, FiSearch } from 'react-icons/fi';
import GradientButton from '../../components/ui/GradientButton';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

export default function AdminManagement() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await api.get('/admin/list');
      setAdmins(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch admins');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      return toast.error("Passwords don't match");
    }
    
    setSubmitting(true);
    try {
      await api.post('/admin/create-admin', data);
      toast.success('Admin created and verification email sent');
      setShowCreateModal(false);
      reset();
      fetchAdmins();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create admin');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (id) => {
    try {
      await api.patch(`/admin/${id}/status`);
      toast.success('Status updated');
      fetchAdmins();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const deleteAdmin = async (id) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return;
    try {
      await api.delete(`/admin/${id}`);
      toast.success('Admin deleted successfully');
      fetchAdmins();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete admin');
    }
  };

  const filteredAdmins = admins.filter(admin => 
    admin.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    admin.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-sora text-dark-900">Admin Management</h1>
          <p className="text-dark-600 mt-1">Manage system administrators (Super Admin Only).</p>
        </div>
        <GradientButton 
          variant="gradient" 
          onClick={() => setShowCreateModal(true)}
          icon={FiUserPlus}
        >
          Create Admin
        </GradientButton>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E5E7EB] space-y-6">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-dark-400">
            <FiSearch />
          </div>
          <input
            type="text"
            placeholder="Search admins by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-dark-50"
          />
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#E5E7EB]">
            <table className="w-full text-left text-sm">
              <thead className="bg-dark-50 text-dark-600 font-bold uppercase tracking-wider border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Verified</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredAdmins.map((admin) => (
                  <tr key={admin._id} className="hover:bg-dark-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-dark-900">{admin.name}</td>
                    <td className="px-6 py-4 text-dark-600">{admin.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${admin.role === 'super_admin' ? 'bg-primary-100 text-primary-800' : 'bg-slate-100 text-slate-800'}`}>
                        {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {admin.verified ? (
                        <span className="text-emerald-600 font-bold">Yes</span>
                      ) : (
                        <span className="text-rose-600 font-bold">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${admin.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {admin.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => toggleStatus(admin._id)} className="p-2 text-dark-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Toggle Status">
                          <FiPower />
                        </button>
                        <button onClick={() => deleteAdmin(admin._id)} className="p-2 text-dark-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete">
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAdmins.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-dark-500">
                      No admins found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-dark-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold font-sora text-dark-900 mb-4">Create New Admin</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input label="Full Name" name="name" register={register} required="Required" error={errors.name} />
              <Input label="Email Address" name="email" type="email" register={register} required="Required" error={errors.email} />
              <Input label="Phone Number (Optional)" name="phone" register={register} />
              <Input label="Password" name="password" type="password" register={register} required="Required" error={errors.password} />
              <Input label="Confirm Password" name="confirmPassword" type="password" register={register} required="Required" error={errors.confirmPassword} />
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-3 px-4 border border-[#E5E7EB] rounded-xl font-bold text-dark-600 hover:bg-dark-50 transition-colors">
                  Cancel
                </button>
                <GradientButton type="submit" variant="gradient" className="flex-1" loading={submitting}>
                  Create Admin
                </GradientButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
