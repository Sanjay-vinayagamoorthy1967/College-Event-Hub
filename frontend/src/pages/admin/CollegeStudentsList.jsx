import React, { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import { FiUsers, FiPlusCircle, FiDownload, FiCheck, FiX, FiActivity, FiLock, FiUnlock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import GlassCard from '../../components/ui/GlassCard';
import GradientButton from '../../components/ui/GradientButton';

export default function CollegeStudentsList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudent, setNewStudent] = useState({
    studentId: '',
    name: '',
    collegeName: 'Sri Shanmugha Educational Institutions',
    department: 'CSE',
    batch: '1st',
    qrVerificationCode: '',
    validUntil: ''
  });

  // Bulk import state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkInput, setBulkInput] = useState('');

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await authService.getCollegeStudents();
      if (res.success) {
        setStudents(res.data);
      }
    } catch (err) {
      toast.error('Failed to load college students database.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      const res = await authService.addCollegeStudent(newStudent);
      if (res.success) {
        toast.success('College Student verification record created!');
        setShowAddModal(false);
        setNewStudent({
          studentId: '',
          name: '',
          collegeName: 'Sri Shanmugha Educational Institutions',
          department: 'CSE',
          batch: '1st',
          qrVerificationCode: '',
          validUntil: ''
        });
        loadStudents();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create record.');
    }
  };

  const handleBulkImport = async (e) => {
    e.preventDefault();
    try {
      const records = JSON.parse(bulkInput);
      if (!Array.isArray(records)) {
        throw new Error('Must be a JSON Array of student objects.');
      }
      
      const res = await authService.bulkImportCollegeStudents(records);
      if (res.success) {
        toast.success(`Successfully imported ${res.count} records!`);
        setShowBulkModal(false);
        setBulkInput('');
        loadStudents();
      }
    } catch (err) {
      toast.error(err.message || 'Invalid JSON format. Check template.');
    }
  };

  const handleToggleDisable = async (id) => {
    try {
      const res = await authService.toggleDisableCollegeStudent(id);
      if (res.success) {
        toast.success(res.data.isDisabled ? 'ID Card Verification disabled.' : 'ID Card Verification enabled.');
        loadStudents();
      }
    } catch (err) {
      toast.error('Failed to toggle status.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black font-sora text-dark-900">Shanmugha Verification DB</h1>
          <p className="text-dark-600 mt-1">Manage verified student credentials and QR scan tokens.</p>
        </div>
        <div className="flex gap-2">
          <GradientButton variant="outline" onClick={() => setShowBulkModal(true)} icon={FiDownload}>
            Bulk Import JSON
          </GradientButton>
          <GradientButton variant="gradient" onClick={() => setShowAddModal(true)} icon={FiPlusCircle}>
            Add Record
          </GradientButton>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E5E7EB] space-y-6">
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#E5E7EB]">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="bg-dark-50 text-dark-600 font-bold uppercase tracking-wider border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-6 py-4 w-16">S.No</th>
                  <th className="px-6 py-4">Student ID / Name</th>
                  <th className="px-6 py-4">College</th>
                  <th className="px-6 py-4">Dept / Batch</th>
                  <th className="px-6 py-4">QR Token</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-dark-500">
                      No verification records found. Click Add Record or Bulk Import.
                    </td>
                  </tr>
                ) : (
                  students.map((student, index) => (
                    <tr key={student._id} className="hover:bg-dark-50/50">
                      <td className="px-6 py-4 font-semibold text-dark-500">{index + 1}</td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-dark-900">{student.name}</p>
                        <p className="text-dark-500 text-xs">{student.studentId}</p>
                      </td>
                      <td className="px-6 py-4 text-dark-600 font-medium">{student.collegeName}</td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-dark-900">{student.department || 'N/A'}</p>
                        <p className="text-dark-500 text-xs">{student.batch || 'N/A'} Year</p>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-primary-600">{student.qrVerificationCode}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          student.isDisabled 
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : student.isRegistered
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                              : 'bg-blue-50 text-blue-600 border border-blue-200'
                        }`}>
                          {student.isDisabled ? 'Disabled' : student.isRegistered ? 'Registered' : 'Active (Unclaimed)'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleToggleDisable(student._id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            student.isDisabled 
                              ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                              : 'bg-red-500 hover:bg-red-600 text-white'
                          }`}
                        >
                          {student.isDisabled ? <FiUnlock /> : <FiLock />}
                          {student.isDisabled ? 'Enable' : 'Disable'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-dark-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-[#E5E7EB] shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold font-sora text-dark-900">Add College Student</h3>
              <button onClick={() => setShowAddModal(false)} className="text-dark-400 hover:text-dark-600">
                <FiX size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-dark-600 uppercase mb-1">Student ID / Register Number</label>
                <input
                  type="text"
                  required
                  value={newStudent.studentId}
                  onChange={(e) => setNewStudent({...newStudent, studentId: e.target.value})}
                  className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  placeholder="e.g. 211041001"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-dark-600 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                  className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  placeholder="Student's name"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-dark-600 uppercase mb-1">College Name</label>
                <input
                  type="text"
                  required
                  value={newStudent.collegeName}
                  onChange={(e) => setNewStudent({...newStudent, collegeName: e.target.value})}
                  className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-dark-600 uppercase mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={newStudent.department}
                    onChange={(e) => setNewStudent({...newStudent, department: e.target.value})}
                    className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    placeholder="e.g. CSE"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-dark-600 uppercase mb-1">Academic Year</label>
                  <input
                    type="text"
                    required
                    value={newStudent.batch}
                    onChange={(e) => setNewStudent({...newStudent, batch: e.target.value})}
                    className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    placeholder="e.g. 1st"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-dark-600 uppercase mb-1">QR Code Verification Token</label>
                <input
                  type="text"
                  required
                  value={newStudent.qrVerificationCode}
                  onChange={(e) => setNewStudent({...newStudent, qrVerificationCode: e.target.value})}
                  className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  placeholder="Unique verification code"
                />
              </div>
              <GradientButton type="submit" variant="gradient" className="w-full py-2.5">
                Save Record
              </GradientButton>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-dark-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg border border-[#E5E7EB] shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold font-sora text-dark-900">Bulk Import Verification Records</h3>
              <button onClick={() => setShowBulkModal(false)} className="text-dark-400 hover:text-dark-600">
                <FiX size={20} />
              </button>
            </div>
            <form onSubmit={handleBulkImport} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-dark-600 uppercase mb-1.5">Paste JSON Array</label>
                <textarea
                  required
                  rows={10}
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-xs"
                  placeholder={`[\n  {\n    "studentId": "211041001",\n    "name": "Jane Doe",\n    "collegeName": "Sri Shanmugha Educational Institutions",\n    "department": "CSE",\n    "batch": "3rd",\n    "qrVerificationCode": "token_abc_123"\n  }\n]`}
                />
              </div>
              <GradientButton type="submit" variant="gradient" className="w-full py-2.5">
                Import Records
              </GradientButton>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
