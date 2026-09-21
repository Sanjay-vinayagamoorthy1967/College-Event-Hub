const Notification = require('../models/Notification');
const StudentInternal = require('../models/StudentInternal');
const StudentExternal = require('../models/StudentExternal');

// Helper to create notification internally
const createNotification = async (userId, userType, title, message, type = 'announcement') => {
  try {
    await Notification.create({
      userId,
      userType,
      title,
      message,
      type
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// @desc    Get user's notifications
// @route   GET /api/notifications
// @access  Private
const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50); // Get last 50 notifications
      
    res.json({ success: true, count: notifications.length, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send announcement to all students
// @route   POST /api/notifications/announcement
// @access  Private (Admin)
const sendAnnouncement = async (req, res) => {
  try {
    const { title, message, target = 'all' } = req.body;
    
    let users = [];
    
    if (target === 'all' || target === 'internal') {
      const internals = await StudentInternal.find({}, '_id');
      users = [...users, ...internals.map(u => ({ id: u._id, type: 'StudentInternal' }))];
    }
    
    if (target === 'all' || target === 'external') {
      const externals = await StudentExternal.find({}, '_id');
      users = [...users, ...externals.map(u => ({ id: u._id, type: 'StudentExternal' }))];
    }
    
    // Create notifications in bulk
    const notificationsToInsert = users.map(user => ({
      userId: user.id,
      userType: user.type,
      title,
      message,
      type: 'announcement'
    }));
    
    await Notification.insertMany(notificationsToInsert);
    
    res.json({ 
      success: true, 
      message: `Announcement sent to ${users.length} students` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createNotification,
  getMyNotifications,
  markAsRead,
  sendAnnouncement
};
