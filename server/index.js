const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const JWT_SECRET = process.env.JWT_SECRET || 'echocord_secret_key_2024';
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const multer = require('multer');
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname)),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token gerekli' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Geçersiz token' });
  }
}

function verifySocket(token) {
  try { return jwt.verify(token, JWT_SECRET); } catch { return null; }
}

// ─── AUTH ────────────────────────────────────────────────────────────────────
const bcrypt = require('bcryptjs');

app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: 'Tüm alanlar gerekli' });
  if (db.prepare('SELECT id FROM users WHERE email=? OR username=?').get(email, username))
    return res.status(400).json({ error: 'Bu kullanıcı adı veya email zaten kullanılıyor' });
  const id = uuidv4();
  const hash = await bcrypt.hash(password, 10);
  db.prepare('INSERT INTO users (id,username,email,password_hash) VALUES (?,?,?,?)').run(id, username, email, hash);
  const token = jwt.sign({ id, username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id, username, email, avatar: null, status: 'online' } });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
  if (!user || !(await bcrypt.compare(password, user.password_hash)))
    return res.status(400).json({ error: 'Email veya şifre hatalı' });
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar, status: user.status } });
});

app.get('/api/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id,username,email,avatar,status FROM users WHERE id=?').get(req.user.id);
  res.json(user);
});

app.patch('/api/me', authMiddleware, upload.single('avatar'), (req, res) => {
  const { username } = req.body;
  const avatar = req.file ? `/uploads/${req.file.filename}` : undefined;
  if (username) db.prepare('UPDATE users SET username=? WHERE id=?').run(username, req.user.id);
  if (avatar) db.prepare('UPDATE users SET avatar=? WHERE id=?').run(avatar, req.user.id);
  const user = db.prepare('SELECT id,username,email,avatar,status FROM users WHERE id=?').get(req.user.id);
  res.json(user);
});

// ─── SERVERS ─────────────────────────────────────────────────────────────────
app.post('/api/servers', authMiddleware, upload.single('icon'), (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Sunucu adı gerekli' });
  const id = uuidv4();
  const icon = req.file ? `/uploads/${req.file.filename}` : null;
  const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
  db.prepare('INSERT INTO servers (id,name,icon,owner_id,invite_code) VALUES (?,?,?,?,?)').run(id, name, icon, req.user.id, inviteCode);
  db.prepare('INSERT INTO server_members (server_id,user_id) VALUES (?,?)').run(id, req.user.id);
  const generalId = uuidv4();
  db.prepare('INSERT INTO channels (id,server_id,name,type) VALUES (?,?,?,?)').run(generalId, id, 'genel', 'text');
  const voiceId = uuidv4();
  db.prepare('INSERT INTO channels (id,server_id,name,type) VALUES (?,?,?,?)').run(voiceId, id, 'Genel', 'voice');
  res.json(getServer(id));
});

app.get('/api/servers', authMiddleware, (req, res) => {
  const servers = db.prepare(`
    SELECT s.* FROM servers s
    JOIN server_members sm ON sm.server_id=s.id
    WHERE sm.user_id=?
    ORDER BY sm.joined_at ASC
  `).all(req.user.id);
  res.json(servers.map(s => getServer(s.id)));
});

app.get('/api/servers/:id', authMiddleware, (req, res) => {
  const member = db.prepare('SELECT 1 FROM server_members WHERE server_id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!member) return res.status(403).json({ error: 'Bu sunucuya erişiminiz yok' });
  res.json(getServer(req.params.id));
});

app.post('/api/servers/join/:code', authMiddleware, (req, res) => {
  const server = db.prepare('SELECT * FROM servers WHERE invite_code=?').get(req.params.code);
  if (!server) return res.status(404).json({ error: 'Davet kodu bulunamadı' });
  const exists = db.prepare('SELECT 1 FROM server_members WHERE server_id=? AND user_id=?').get(server.id, req.user.id);
  if (!exists) db.prepare('INSERT INTO server_members (server_id,user_id) VALUES (?,?)').run(server.id, req.user.id);
  res.json(getServer(server.id));
});

app.delete('/api/servers/:id/leave', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM server_members WHERE server_id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

function getServer(id) {
  const s = db.prepare('SELECT * FROM servers WHERE id=?').get(id);
  if (!s) return null;
  s.channels = db.prepare('SELECT * FROM channels WHERE server_id=? ORDER BY created_at').all(id);
  s.members = db.prepare(`
    SELECT u.id,u.username,u.avatar,u.status FROM users u
    JOIN server_members sm ON sm.user_id=u.id WHERE sm.server_id=?
  `).all(id);
  return s;
}

// ─── CHANNELS ────────────────────────────────────────────────────────────────
app.post('/api/servers/:serverId/channels', authMiddleware, (req, res) => {
  const { name, type } = req.body;
  const server = db.prepare('SELECT * FROM servers WHERE id=? AND owner_id=?').get(req.params.serverId, req.user.id);
  if (!server) return res.status(403).json({ error: 'Yalnızca sunucu sahibi kanal oluşturabilir' });
  const id = uuidv4();
  db.prepare('INSERT INTO channels (id,server_id,name,type) VALUES (?,?,?,?)').run(id, req.params.serverId, name, type || 'text');
  res.json(db.prepare('SELECT * FROM channels WHERE id=?').get(id));
});

// ─── MESSAGES ────────────────────────────────────────────────────────────────
app.get('/api/channels/:id/messages', authMiddleware, (req, res) => {
  const msgs = db.prepare(`
    SELECT m.*, u.username, u.avatar FROM messages m
    JOIN users u ON u.id=m.user_id
    WHERE m.channel_id=? ORDER BY m.created_at DESC LIMIT 50
  `).all(req.params.id).reverse();
  res.json(msgs);
});

// ─── DMS ─────────────────────────────────────────────────────────────────────
app.get('/api/dms', authMiddleware, (req, res) => {
  const dms = db.prepare(`
    SELECT dc.id, u.id as user_id, u.username, u.avatar, u.status
    FROM dm_channels dc
    JOIN dm_members dm1 ON dm1.dm_channel_id=dc.id AND dm1.user_id=?
    JOIN dm_members dm2 ON dm2.dm_channel_id=dc.id AND dm2.user_id!=?
    JOIN users u ON u.id=dm2.user_id
    ORDER BY dc.created_at DESC
  `).all(req.user.id, req.user.id);
  res.json(dms);
});

app.post('/api/dms/:userId', authMiddleware, (req, res) => {
  const other = db.prepare('SELECT * FROM users WHERE id=?').get(req.params.userId);
  if (!other) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
  let dm = db.prepare(`
    SELECT dc.id FROM dm_channels dc
    JOIN dm_members dm1 ON dm1.dm_channel_id=dc.id AND dm1.user_id=?
    JOIN dm_members dm2 ON dm2.dm_channel_id=dc.id AND dm2.user_id=?
  `).get(req.user.id, other.id);
  if (!dm) {
    const id = uuidv4();
    db.prepare('INSERT INTO dm_channels (id) VALUES (?)').run(id);
    db.prepare('INSERT INTO dm_members (dm_channel_id,user_id) VALUES (?,?)').run(id, req.user.id);
    db.prepare('INSERT INTO dm_members (dm_channel_id,user_id) VALUES (?,?)').run(id, other.id);
    dm = { id };
  }
  const msgs = db.prepare(`
    SELECT m.*, u.username, u.avatar FROM dm_messages m
    JOIN users u ON u.id=m.user_id
    WHERE m.dm_channel_id=? ORDER BY m.created_at DESC LIMIT 50
  `).all(dm.id).reverse();
  res.json({ id: dm.id, user: { id: other.id, username: other.username, avatar: other.avatar, status: other.status }, messages: msgs });
});

app.get('/api/dms/:dmId/messages', authMiddleware, (req, res) => {
  const msgs = db.prepare(`
    SELECT m.*, u.username, u.avatar FROM dm_messages m
    JOIN users u ON u.id=m.user_id
    WHERE m.dm_channel_id=? ORDER BY m.created_at DESC LIMIT 50
  `).all(req.params.dmId).reverse();
  res.json(msgs);
});

// ─── USERS ───────────────────────────────────────────────────────────────────
app.get('/api/users/search', authMiddleware, (req, res) => {
  const q = `%${req.query.q || ''}%`;
  const users = db.prepare('SELECT id,username,avatar,status FROM users WHERE username LIKE ? AND id!=? LIMIT 10').all(q, req.user.id);
  res.json(users);
});

// ─── SOCKET.IO ───────────────────────────────────────────────────────────────
const onlineUsers = new Map(); // socketId -> { userId, username }
const voiceRooms = new Map();  // channelId -> Set of { socketId, userId, username }

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const user = verifySocket(token);
  if (!user) return next(new Error('Unauthorized'));
  socket.user = user;
  next();
});

io.on('connection', (socket) => {
  const { id: userId, username } = socket.user;
  onlineUsers.set(socket.id, { userId, username });
  db.prepare('UPDATE users SET status=? WHERE id=?').run('online', userId);
  io.emit('user:status', { userId, status: 'online' });

  // ── Text messages ──
  socket.on('message:send', ({ channelId, content }) => {
    if (!content?.trim()) return;
    const id = uuidv4();
    db.prepare('INSERT INTO messages (id,channel_id,user_id,content) VALUES (?,?,?,?)').run(id, channelId, userId, content.trim());
    const msg = db.prepare('SELECT m.*,u.username,u.avatar FROM messages m JOIN users u ON u.id=m.user_id WHERE m.id=?').get(id);
    io.to(`channel:${channelId}`).emit('message:new', msg);
  });

  socket.on('channel:join', (channelId) => {
    socket.join(`channel:${channelId}`);
  });

  socket.on('channel:leave', (channelId) => {
    socket.leave(`channel:${channelId}`);
  });

  // ── DM messages ──
  socket.on('dm:send', ({ dmChannelId, content }) => {
    if (!content?.trim()) return;
    const id = uuidv4();
    db.prepare('INSERT INTO dm_messages (id,dm_channel_id,user_id,content) VALUES (?,?,?,?)').run(id, dmChannelId, userId, content.trim());
    const msg = db.prepare('SELECT m.*,u.username,u.avatar FROM dm_messages m JOIN users u ON u.id=m.user_id WHERE m.id=?').get(id);
    io.to(`dm:${dmChannelId}`).emit('dm:new', msg);
  });

  socket.on('dm:join', (dmChannelId) => socket.join(`dm:${dmChannelId}`));
  socket.on('dm:leave', (dmChannelId) => socket.leave(`dm:${dmChannelId}`));

  // ── Voice / WebRTC ──
  socket.on('voice:join', ({ channelId }) => {
    if (!voiceRooms.has(channelId)) voiceRooms.set(channelId, new Map());
    const room = voiceRooms.get(channelId);
    const existing = Array.from(room.values());
    room.set(socket.id, { socketId: socket.id, userId, username });
    socket.join(`voice:${channelId}`);
    socket.emit('voice:peers', existing);
    socket.to(`voice:${channelId}`).emit('voice:user-joined', { socketId: socket.id, userId, username });
    broadcastVoiceMembers(channelId);
  });

  socket.on('voice:leave', ({ channelId }) => {
    leaveVoice(socket, channelId);
  });

  socket.on('voice:offer', ({ to, offer, channelId }) => {
    io.to(to).emit('voice:offer', { from: socket.id, offer, channelId, userId, username });
  });

  socket.on('voice:answer', ({ to, answer }) => {
    io.to(to).emit('voice:answer', { from: socket.id, answer });
  });

  socket.on('voice:ice', ({ to, candidate }) => {
    io.to(to).emit('voice:ice', { from: socket.id, candidate });
  });

  socket.on('voice:screen-share', ({ channelId, sharing }) => {
    socket.to(`voice:${channelId}`).emit('voice:screen-share', { socketId: socket.id, sharing });
  });

  // ── Disconnect ──
  socket.on('disconnect', () => {
    onlineUsers.delete(socket.id);
    for (const [channelId, room] of voiceRooms) {
      if (room.has(socket.id)) leaveVoice(socket, channelId);
    }
    const stillOnline = Array.from(onlineUsers.values()).some(u => u.userId === userId);
    if (!stillOnline) {
      db.prepare('UPDATE users SET status=? WHERE id=?').run('offline', userId);
      io.emit('user:status', { userId, status: 'offline' });
    }
  });
});

function leaveVoice(socket, channelId) {
  const room = voiceRooms.get(channelId);
  if (!room) return;
  room.delete(socket.id);
  socket.leave(`voice:${channelId}`);
  socket.to(`voice:${channelId}`).emit('voice:user-left', { socketId: socket.id });
  broadcastVoiceMembers(channelId);
  if (room.size === 0) voiceRooms.delete(channelId);
}

function broadcastVoiceMembers(channelId) {
  const room = voiceRooms.get(channelId);
  const members = room ? Array.from(room.values()) : [];
  io.to(`voice:${channelId}`).emit('voice:members', { channelId, members });
  io.emit('voice:members-update', { channelId, members });
}

server.listen(PORT, () => console.log(`EchoCord server running on port ${PORT}`));
