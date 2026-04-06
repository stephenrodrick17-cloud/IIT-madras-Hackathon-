require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');

const emergencyRoutes = require('./routes/emergencyRoutes');
const sosRoutes = require('./routes/sosRoutes');
const insightsRoutes = require('./routes/insightsRoutes');
const hazardRoutes = require('./routes/hazardRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());

const limiter = rateLimit({ windowMs: 60_000, max: 100 });
app.use(limiter);

// ── Socket.IO real-time ───────────────────────────────────────────────────────
const activeSOS = new Map();   // id → { lat, lng, timestamp, contact }

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on('sos:trigger', (data) => {
    const id = data.id || socket.id;
    activeSOS.set(id, { ...data, timestamp: new Date() });
    io.emit('sos:alert', { id, ...data, timestamp: new Date() });
    console.log(`🚨 SOS triggered from ${id}`);
  });

  socket.on('location:update', (data) => {
    socket.broadcast.emit('location:updated', { socketId: socket.id, ...data });
  });

  socket.on('sos:resolve', (id) => {
    activeSOS.delete(id);
    io.emit('sos:resolved', { id });
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Export io so routes can emit events
app.set('io', io);
app.set('activeSOS', activeSOS);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/emergency', emergencyRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/hazards', hazardRoutes);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    activeSOS: activeSOS.size,
    version: '1.0.0'
  });
});

// ── Start ──────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Emergency Response Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.IO ready`);
  console.log(`🗺️  Google Maps Key: ${process.env.GOOGLE_MAPS_API_KEY ? '✓ Set' : '✗ Missing — set in .env'}`);
  console.log(`📱 Twilio: ${process.env.TWILIO_ACCOUNT_SID ? '✓ Set' : '✗ Missing — SMS disabled'}\n`);
});
