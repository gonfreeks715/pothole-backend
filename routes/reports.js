const express = require('express');
const Report = require('../models/Report');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

const router = express.Router();

// @GET /api/reports - Get all reports (with filters)
router.get('/', async (req, res) => {
  try {
    const { status, category, severity, ward } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (severity) filter.severity = severity;
    if (ward) filter['location.ward'] = ward;

    const reports = await Report.find(filter)
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: reports.length, reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/reports/:id - Get single report
router.get('/:id', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('reportedBy', 'name email');

    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/reports - Create new report
router.post('/', protect, upload.array('images', 3), async (req, res) => {
  try {
    const { title, description, category, severity, lat, lng, address, ward, landmark } = req.body;

    const images = req.files ? req.files.map(file => ({
      url: file.path,
      publicId: file.filename
    })) : [];

    const report = await Report.create({
      title,
      description,
      category,
      severity,
      location: { lat: parseFloat(lat), lng: parseFloat(lng), address, ward, landmark },
      images,
      reportedBy: req.user._id
    });

    // Increment user report count
    await User.findByIdAndUpdate(req.user._id, { $inc: { reportsCount: 1 } });

    res.status(201).json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PATCH /api/reports/:id/upvote - Upvote a report
router.patch('/:id/upvote', protect, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    const alreadyUpvoted = report.upvotedBy.includes(req.user._id);

    if (alreadyUpvoted) {
      report.upvotes -= 1;
      report.upvotedBy = report.upvotedBy.filter(id => id.toString() !== req.user._id.toString());
    } else {
      report.upvotes += 1;
      report.upvotedBy.push(req.user._id);
    }

    await report.save();
    res.json({ success: true, upvotes: report.upvotes, upvoted: !alreadyUpvoted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PATCH /api/reports/:id/status - Update status (admin only)
router.patch('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status, adminNotes, assignedTo } = req.body;

    const updateData = { status, adminNotes, assignedTo };
    if (status === 'resolved') updateData.resolvedAt = new Date();

    const report = await Report.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('reportedBy', 'name email');

    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @DELETE /api/reports/:id - Delete report (admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Report.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Report deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
