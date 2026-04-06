const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

let twilio = null;
try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_ACCOUNT_SID !== 'your_twilio_account_sid') {
    twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
} catch (e) { /* Twilio not configured */ }

const sosLog = [];   // in-memory log (replace with DB in production)

// POST /api/sos/trigger  — trigger an SOS alert
router.post('/trigger', async (req, res) => {
  const { lat, lng, address, contact, userName, urgencyLevel = 'HIGH', nearbyServices } = req.body;
  console.log(`🚨 SOS Triggered: ${urgencyLevel} at ${address} (${lat}, ${lng})`);

  const sosId = uuidv4();
  const timestamp = new Date();
  const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;

  const entry = {
    id: sosId,
    lat,
    lng,
    address,
    contact,
    userName: userName || 'Anonymous',
    urgencyLevel,
    nearbyServices: nearbyServices || [],
    timestamp,
    mapsLink,
    status: 'active',
    smsSent: false,
    smsError: null,
  };

  // Emit via Socket.IO to all connected dashboards
  const io = req.app.get('io');
  if (io) io.emit('sos:alert', entry);

  // Send SMS via Twilio (if configured)
  if (twilio && contact) {
    const message = `🚨 SOS ALERT! ${userName || 'Someone'} needs emergency help!\n📍 Location: ${address || 'Unknown'}\n🗺️ Map: ${mapsLink}\n⚠️ Urgency: ${urgencyLevel}\n⏰ Time: ${timestamp.toLocaleTimeString()}`;
    try {
      await twilio.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: contact,
      });
      entry.smsSent = true;
    } catch (err) {
      entry.smsError = err.message;
      console.error('Twilio SMS error:', err.message);
    }
  }

  sosLog.unshift(entry);
  if (sosLog.length > 100) sosLog.pop();   // keep last 100

  res.json({
    success: true,
    sosId,
    message: twilio && contact ? `SOS triggered & SMS sent to ${contact}` : 'SOS triggered (SMS not configured)',
    mapsLink,
    smsSent: entry.smsSent,
  });
});

// GET /api/sos/active — list active SOS events
router.get('/active', (req, res) => {
  const active = sosLog.filter(s => s.status === 'active');
  res.json({ active, count: active.length });
});

// PATCH /api/sos/:id/resolve — resolve an SOS
router.patch('/:id/resolve', (req, res) => {
  const entry = sosLog.find(s => s.id === req.params.id);
  if (!entry) return res.status(404).json({ error: 'SOS not found' });
  entry.status = 'resolved';
  entry.resolvedAt = new Date();
  const io = req.app.get('io');
  if (io) io.emit('sos:resolved', { id: req.params.id });
  res.json({ success: true, entry });
});

// GET /api/sos/log — recent SOS history
router.get('/log', (req, res) => {
  res.json({ log: sosLog.slice(0, 20) });
});

module.exports = router;
