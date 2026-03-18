# 🌐 NexusChat — Real-Time Messaging Platform

A modern, feature-rich chat application built with Node.js, React, MongoDB, and Socket.io.
NOT a WhatsApp clone — NexusChat has a unique design, feature set, and architecture.

---

## 🏗️ SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────┐
│                        CLIENT                           │
│   React + Vite  ──  Context API  ──  Socket.io Client   │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP / WebSocket
┌────────────────────────▼────────────────────────────────┐
│                       BACKEND                           │
│   Express REST API  +  Socket.io Server                 │
│   ┌────────────┐  ┌──────────────┐  ┌───────────────┐  │
│   │  Auth MW   │  │  Route Layer  │  │  Socket Layer  │  │
│   └────────────┘  └──────────────┘  └───────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ Mongoose ODM
┌────────────────────────▼────────────────────────────────┐
│                      DATABASE                           │
│              MongoDB Atlas (Cloud)                      │
│   Users ── Chats ── Messages ── Rooms                   │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ TECHNOLOGY CHOICES

| Layer         | Tech               | Why                                                    |
|---------------|--------------------|--------------------------------------------------------|
| Frontend      | React + Vite       | Fast HMR, component model, huge ecosystem              |
| State Mgmt    | Context API        | Lightweight, no boilerplate for this scale             |
| Styling       | CSS Modules + CSS  | Scoped styles, zero runtime cost                       |
| Backend       | Node.js + Express  | Non-blocking I/O perfect for real-time; fast to build  |
| Real-time     | Socket.io          | Reliable WS with fallback, rooms, namespaces built-in  |
| Database      | MongoDB + Mongoose | Flexible schema great for chat (varied message types)  |
| Auth          | JWT + bcrypt       | Stateless, scalable, industry standard                 |
| AI Features   | Anthropic API      | Smart replies powered by Claude                        |
| File Uploads  | Multer + Cloudinary| Handles avatars and media messages                     |

---

## ✨ UNIQUE FEATURES (Not WhatsApp)

1. **🤖 AI Smart Replies** — Claude suggests 3 contextual reply options per message
2. **🎭 Anonymous Mode** — Chat without revealing identity; auto-generated personas
3. **⏳ Pulse Rooms** — Temporary chat rooms that auto-delete after 1–24 hours
4. **🎨 Custom Themes** — Per-user color themes stored in DB, applied on login
5. **🔥 Reaction Storms** — Animated emoji reactions with particle effects
6. **🌊 Vibe Status** — Rich status: mood + emoji + color aura (not just online/offline)
7. **📝 Message Threads** — Reply in threads like Slack (not nested like WhatsApp)
8. **🔊 Voice Notes** — Record and send voice messages in-browser

---

## 📁 PROJECT STRUCTURE

```
nexus-chat/
├── backend/
│   ├── config/         # DB connection, env config
│   ├── controllers/    # Route logic (auth, chat, messages, rooms)
│   ├── middleware/     # JWT auth, error handler, upload
│   ├── models/         # Mongoose schemas
│   ├── routes/         # Express routers
│   ├── socket/         # Socket.io event handlers
│   ├── utils/          # Helpers (AI replies, token gen)
│   ├── server.js       # Entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── context/    # Global state (AuthContext, ChatContext)
│   │   ├── hooks/      # Custom hooks
│   │   ├── pages/      # Route-level pages
│   │   ├── services/   # API calls (axios)
│   │   └── styles/     # Global CSS, theme variables
│   ├── index.html
│   └── package.json
│
└── README.md
```

---

## 🚀 QUICK START

### 1. Clone & Install
```bash
git clone <your-repo>
cd nexus-chat

# Install backend deps
cd backend && npm install

# Install frontend deps
cd ../frontend && npm install
```

### 2. Environment Variables

**backend/.env**
```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/nexuschat
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRE=7d
ANTHROPIC_API_KEY=your_anthropic_key
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
CLIENT_URL=http://localhost:5173
```

**frontend/.env**
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Run Development
```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

App runs at: http://localhost:5173

---

## 🌍 DEPLOYMENT

### Backend → Render.com
1. Push code to GitHub
2. New Web Service on Render → connect repo → set root dir to `backend`
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add all environment variables in Render dashboard

### Frontend → Vercel
1. Import frontend folder to Vercel
2. Framework: Vite
3. Set `VITE_API_URL` and `VITE_SOCKET_URL` to your Render backend URL
4. Deploy

### Database → MongoDB Atlas
1. Create free M0 cluster at cloud.mongodb.com
2. Add IP whitelist: 0.0.0.0/0 (allow all for cloud deployment)
3. Create DB user, copy connection string to `MONGO_URI`

---

## 🔒 SECURITY CHECKLIST
- [x] Passwords hashed with bcrypt (12 salt rounds)
- [x] JWT in httpOnly cookies (XSS protection)
- [x] Input validation with express-validator
- [x] Rate limiting on auth routes
- [x] CORS restricted to CLIENT_URL
- [x] Helmet.js security headers
- [x] MongoDB injection protection via Mongoose
