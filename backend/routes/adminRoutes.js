const express = require('express');
const router = express.Router();
const { getStudents, getStats, getFullRegistrationTable, getRevenueChart, getCategoryChart, getRegistrationChart, getAdminRequests, approveAdminRequest, rejectAdminRequest, deactivateAdminRequest, deleteAdminRequest } = require('../controllers/adminController');
const { createAdmin, getAdmins, updateAdmin, deleteAdmin, toggleAdminStatus } = require('../controllers/adminManagementController');
const { protect } = require('../middleware/auth');
const { adminOnly, superAdminOnly } = require('../middleware/admin');

router.use(protect);
router.use(adminOnly);

router.get('/students', getStudents);
router.get('/stats', getStats);
router.get('/registrations-table', getFullRegistrationTable);
router.get('/revenue-chart', getRevenueChart);
router.get('/category-chart', getCategoryChart);
router.get('/registration-chart', getRegistrationChart);

// Admin Approval Requests
router.get('/requests', superAdminOnly, getAdminRequests);
router.post('/requests/:id/approve', superAdminOnly, approveAdminRequest);
router.post('/requests/:id/reject', superAdminOnly, rejectAdminRequest);
router.post('/requests/:id/deactivate', superAdminOnly, deactivateAdminRequest);
router.delete('/requests/:id', superAdminOnly, deleteAdminRequest);

// Super Admin Management Routes
router.post('/create-admin', superAdminOnly, createAdmin);
router.get('/list', superAdminOnly, getAdmins);
router.put('/:id', superAdminOnly, updateAdmin);
router.delete('/:id', superAdminOnly, deleteAdmin);
router.patch('/:id/status', superAdminOnly, toggleAdminStatus);

module.exports = router;
