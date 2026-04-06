const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// In-memory store for reports (hazards/road issues)
const reports = [];

// GET /api/hazards - List recent reports
router.get('/', (req, res) => {
  res.json({ reports: reports.slice(0, 50) });
});

// POST /api/hazards/report - Report a new hazard
router.post('/report', (req, res) => {
  const { type, lat, lng, address, description, severity = 'MEDIUM' } = req.body;
  
  if (!type || !lat || !lng) {
    return res.status(400).json({ error: 'type, lat, and lng are required' });
  }

  const newReport = {
    id: uuidv4(),
    type, // 'POTHOLE' | 'TRAFFIC' | 'ACCIDENT' | 'CONSTRUCTION' | 'OTHER'
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    address: address || 'Unknown location',
    description: description || '',
    severity, // 'LOW' | 'MEDIUM' | 'HIGH'
    timestamp: new Date(),
    votes: 0,
    status: 'active'
  };

  reports.unshift(newReport);
  
  // Emit via socket.io if available
  const io = req.app.get('io');
  if (io) io.emit('hazard:new', newReport);

  res.status(201).json({ success: true, report: newReport });
});

// PATCH /api/hazards/:id/vote - Upvote a report
router.patch('/:id/vote', (req, res) => {
  const report = reports.find(r => r.id === req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });
  
  report.votes += 1;
  res.json({ success: true, votes: report.votes });
});

module.exports = router;
