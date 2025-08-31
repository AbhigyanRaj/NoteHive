const express = require('express');
const jwt = require('jsonwebtoken');
const Note = require('../models/Note');
const User = require('../models/User');
const router = express.Router();

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.isAdmin) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

// Admin login with secret key
router.post('/login', async (req, res) => {
  try {
    const { secretKey } = req.body;
    
    console.log('Admin login attempt:');
    console.log('Received key:', secretKey);
    console.log('Expected key:', process.env.ADMIN_SECRET_KEY);
    console.log('Keys match:', secretKey === process.env.ADMIN_SECRET_KEY);
    
    if (!secretKey || secretKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(401).json({ error: 'Invalid admin secret key' });
    }

    // Generate admin JWT token
    const adminToken = jwt.sign(
      { 
        id: 'admin',
        email: 'admin@notehive.com',
        isAdmin: true,
        name: 'Administrator'
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token: adminToken,
      admin: {
        id: 'admin',
        email: 'admin@notehive.com',
        name: 'Administrator',
        isAdmin: true
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Server error during admin login' });
  }
});

// Get all notes (admin only)
router.get('/notes', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', sortBy = 'updatedAt', sortOrder = 'desc' } = req.query;
    
    const query = search ? {
      $or: [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const notes = await Note.find(query)
      .populate('createdBy', 'name email')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Note.countDocuments(query);

    res.json({
      success: true,
      notes,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Admin get notes error:', error);
    res.status(500).json({ error: 'Server error fetching notes' });
  }
});

// Get single note (admin only)
router.get('/notes/:id', authenticateAdmin, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id).populate('userId', 'name email');
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({ success: true, note });
  } catch (error) {
    console.error('Admin get note error:', error);
    res.status(500).json({ error: 'Server error fetching note' });
  }
});

// Update note (admin only)
router.put('/notes/:id', authenticateAdmin, async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { 
        title, 
        content, 
        tags,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('userId', 'name email');

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({ success: true, note });
  } catch (error) {
    console.error('Admin update note error:', error);
    res.status(500).json({ error: 'Server error updating note' });
  }
});

// Delete note (admin only)
router.delete('/notes/:id', authenticateAdmin, async (req, res) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Admin delete note error:', error);
    res.status(500).json({ error: 'Server error deleting note' });
  }
});

// Get all users (admin only)
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const users = await User.find({}, '-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await User.countDocuments();

    // Get note counts for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const noteCount = await Note.countDocuments({ userId: user._id });
        return {
          ...user.toObject(),
          noteCount
        };
      })
    );

    res.json({
      success: true,
      users: usersWithStats,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ error: 'Server error fetching users' });
  }
});

// Get dashboard stats (admin only)
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalNotes = await Note.countDocuments();
    
    // Get notes created in last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentNotes = await Note.countDocuments({ 
      createdAt: { $gte: weekAgo } 
    });

    // Get users registered in last 7 days
    const recentUsers = await User.countDocuments({ 
      createdAt: { $gte: weekAgo } 
    });

    // Get top users by note count
    const topUsers = await Note.aggregate([
      { $group: { _id: '$userId', noteCount: { $sum: 1 } } },
      { $sort: { noteCount: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { noteCount: 1, 'user.name': 1, 'user.email': 1 } }
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalNotes,
        recentNotes,
        recentUsers,
        topUsers
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Server error fetching stats' });
  }
});

module.exports = router;
