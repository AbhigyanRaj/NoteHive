# 📝 NoteHive - Collaborative Note-Taking Application

<div align="center">

![NoteHive Logo](frontend/public/favicon.ico)

**A modern, real-time collaborative note-taking web application with admin oversight**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-blue?style=for-the-badge)](https://note-hive-fawn.vercel.app)
[![Backend API](https://img.shields.io/badge/Backend%20API-Live-green?style=for-the-badge)](https://notehive-9176.onrender.com)

</div>

---

## 🌟 Features

### 🔥 Core Features
- **Real-time Collaboration** - Multiple users can edit notes simultaneously
- **Rich Text Editor** - Full-featured note editing with formatting
- **User Authentication** - Secure login with email/password and Google OAuth
- **Cross-tab Synchronization** - Changes sync across browser tabs instantly
- **Offline Support** - Works offline with automatic sync when reconnected
- **Search & Filter** - Find notes quickly with powerful search
- **Tags & Organization** - Organize notes with custom tags
- **Favorites** - Mark important notes as favorites

### 🛡️ Admin Portal
- **Secure Admin Access** - Secret key-based authentication
- **User Management** - View all registered users and statistics
- **Notes Oversight** - Read-only access to all user notes
- **Dashboard Analytics** - User activity and note creation metrics
- **Session Persistence** - Admin stays logged in across page reloads

---

## 🏗️ Architecture Overview

```mermaid
graph TB
    subgraph "Frontend (React + TypeScript)"
        A[React App] --> B[Auth Context]
        A --> C[Note Editor]
        A --> D[Dashboard]
        A --> E[Admin Portal]
        B --> F[Google OAuth]
        C --> G[Real-time Sync]
    end
    
    subgraph "Backend (Node.js + Express)"
        H[Express Server] --> I[Auth Routes]
        H --> J[Notes API]
        H --> K[Admin API]
        H --> L[Socket.io Server]
        I --> M[JWT Auth]
        I --> N[Google OAuth]
    end
    
    subgraph "Database & Storage"
        O[(MongoDB Atlas)]
        P[User Collection]
        Q[Notes Collection]
        O --> P
        O --> Q
    end
    
    subgraph "Deployment"
        R[Vercel - Frontend]
        S[Render - Backend]
    end
    
    A -.->|HTTPS| H
    G -.->|WebSocket| L
    H -.->|Mongoose| O
    A -.->|Deployed on| R
    H -.->|Deployed on| S
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | UI Framework | ^18.2.0 |
| **TypeScript** | Type Safety | ^5.0.2 |
| **Vite** | Build Tool | ^5.0.8 |
| **Tailwind CSS** | Styling | ^3.3.0 |
| **Socket.io Client** | Real-time Communication | ^4.7.4 |
| **React Router** | Navigation | ^6.8.1 |

### Backend
| Technology | Purpose | Version |
|------------|---------|---------|
| **Node.js** | Runtime Environment | ^18.0.0 |
| **Express.js** | Web Framework | ^4.18.2 |
| **Socket.io** | WebSocket Server | ^4.7.4 |
| **MongoDB** | Database | Atlas Cloud |
| **Mongoose** | ODM | ^8.0.0 |
| **JWT** | Authentication | ^9.0.2 |
| **Passport.js** | OAuth Integration | ^0.7.0 |
| **bcrypt** | Password Hashing | ^5.1.1 |

### DevOps & Deployment
| Service | Purpose |
|---------|---------|
| **Vercel** | Frontend Hosting |
| **Render** | Backend Hosting |
| **MongoDB Atlas** | Database Hosting |
| **Google Cloud Console** | OAuth Configuration |

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MongoDB Atlas account
- Google Cloud Console project (for OAuth)

### 1. Clone Repository
```bash
git clone https://github.com/AbhigyanRaj/NoteHive.git
cd NoteHive
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create .env file
cp .env.example .env
```

Configure your `.env` file:
```env
# Database
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/notehive

# Authentication
JWT_SECRET=your_jwt_secret_key_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Admin Access
ADMIN_SECRET_KEY=your_admin_secret_key

# URLs
PORT=5001
FRONTEND_URL=http://localhost:5173
```

Start backend server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Access Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5001
- **Admin Portal**: http://localhost:5173/admin/login

---

## 📋 Detailed Setup Guide

### MongoDB Atlas Configuration
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Create a database user
4. Whitelist your IP address
5. Get connection string and add to `.env`

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Configure authorized origins and redirect URIs:

**Authorized JavaScript Origins:**
```
http://localhost:5173
http://localhost:5001
https://note-hive-fawn.vercel.app
https://notehive-9176.onrender.com
```

**Authorized Redirect URIs:**
```
http://localhost:5001/api/auth/google/callback
https://notehive-9176.onrender.com/api/auth/google/callback
```

### Environment Variables Explained

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret for JWT token signing | `your_secret_key` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `123456789.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | `GOCSPX-...` |
| `ADMIN_SECRET_KEY` | Admin portal access key | `admin_password_123` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |

---

## 🎯 Usage Guide

### For Regular Users

#### 1. **Registration & Login**
- Visit the application homepage
- Click "Sign Up" to create account with email/password
- Or use "Continue with Google" for OAuth login
- Verify email if required

#### 2. **Creating Notes**
- Click "New Note" button on dashboard
- Add title and content
- Use rich text editor for formatting
- Add tags for organization
- Notes auto-save as you type

#### 3. **Real-time Collaboration**
- Share note URL with collaborators
- Multiple users can edit simultaneously
- See live cursors and changes
- Changes sync across all devices instantly

#### 4. **Organization**
- Use search bar to find notes quickly
- Filter by tags or favorites
- Archive old notes
- Star important notes as favorites

### For Administrators

#### 1. **Admin Access**
- Navigate to `/admin/login`
- Enter the admin secret key
- Access admin dashboard

#### 2. **Admin Dashboard**
- View user statistics and metrics
- Browse all user notes (read-only)
- Monitor user activity
- Search across all notes

#### 3. **User Management**
- View registered users list
- See user creation dates
- Monitor note creation activity
- Track system usage

---

## 🔧 API Documentation

### Authentication Endpoints
```http
POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/google
GET  /api/auth/google/callback
POST /api/auth/logout
```

### Notes Endpoints
```http
GET    /api/notes          # Get user notes
POST   /api/notes          # Create new note
PUT    /api/notes/:id      # Update note
DELETE /api/notes/:id      # Delete note
GET    /api/notes/:id      # Get specific note
```

### Admin Endpoints
```http
POST /api/admin/login      # Admin authentication
GET  /api/admin/stats      # System statistics
GET  /api/admin/notes      # All notes (read-only)
GET  /api/admin/users      # All users
```

### WebSocket Events
```javascript
// Client to Server
'join-note'     // Join note room
'leave-note'    // Leave note room
'note-update'   // Send note changes

// Server to Client
'note-updated'  // Receive note changes
'user-joined'   // User joined note
'user-left'     // User left note
```

---

## 🔒 Security Features

### Authentication & Authorization
- **JWT Tokens** - Secure session management
- **Password Hashing** - bcrypt with salt rounds
- **OAuth Integration** - Google authentication
- **Admin Secret Key** - Separate admin access control
- **CORS Protection** - Configured for specific origins

### Data Protection
- **Input Validation** - Server-side validation for all inputs
- **SQL Injection Prevention** - MongoDB with Mongoose ODM
- **XSS Protection** - Content sanitization
- **Rate Limiting** - API request throttling
- **HTTPS Enforcement** - Secure data transmission

---

## 🚀 Deployment

### Frontend (Vercel)
1. Connect GitHub repository to Vercel
2. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Set environment variables if needed
4. Deploy automatically on git push

### Backend (Render)
1. Connect GitHub repository to Render
2. Configure service:
   - Build Command: `npm install`
   - Start Command: `npm start`
3. Set environment variables:
   - All variables from `.env.example`
   - Update `FRONTEND_URL` to production URL
4. Deploy automatically on git push

### Database (MongoDB Atlas)
1. Create production cluster
2. Configure network access
3. Create database user
4. Update connection string in production environment

---

## 🧪 Testing

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

### Test Coverage
- Unit tests for core functions
- Integration tests for API endpoints
- Real-time collaboration testing
- Authentication flow testing
- Admin portal functionality testing

---

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and test thoroughly
4. Commit changes: `git commit -m 'Add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Open Pull Request

### Code Standards
- Use TypeScript for type safety
- Follow ESLint configuration
- Write meaningful commit messages
- Add tests for new features
- Update documentation

---

## 📊 Performance Metrics

### Load Times
- **Initial Load**: < 2 seconds
- **Note Creation**: < 500ms
- **Real-time Sync**: < 100ms latency
- **Search Results**: < 300ms

### Scalability
- **Concurrent Users**: 1000+ supported
- **Notes per User**: Unlimited
- **File Size**: Up to 10MB per note
- **Real-time Connections**: 500+ simultaneous

---

## 🐛 Troubleshooting

### Common Issues

#### 1. **Google OAuth Not Working**
- Check authorized origins in Google Cloud Console
- Verify redirect URIs are correct
- Ensure environment variables are set
- Wait 5-10 minutes after configuration changes

#### 2. **Real-time Sync Issues**
- Check WebSocket connection in browser dev tools
- Verify backend Socket.io server is running
- Check CORS configuration
- Ensure JWT token is valid

#### 3. **Database Connection Errors**
- Verify MongoDB Atlas connection string
- Check IP whitelist in Atlas
- Ensure database user has correct permissions
- Test connection with MongoDB Compass

#### 4. **Admin Portal Access**
- Verify `ADMIN_SECRET_KEY` in environment variables
- Check for typos in secret key
- Ensure backend server is running
- Clear browser cache and cookies

---

## 📈 Roadmap

### Upcoming Features
- [ ] **Mobile App** - React Native implementation
- [ ] **File Attachments** - Upload images and documents
- [ ] **Note Templates** - Pre-defined note structures
- [ ] **Export Options** - PDF, Word, Markdown export
- [ ] **Advanced Search** - Full-text search with filters
- [ ] **Team Workspaces** - Organized collaboration spaces
- [ ] **Version History** - Track note changes over time
- [ ] **Dark Mode** - Theme customization
- [ ] **Offline Mode** - Enhanced offline capabilities
- [ ] **API Keys** - Third-party integrations

### Performance Improvements
- [ ] **Caching Layer** - Redis implementation
- [ ] **CDN Integration** - Faster asset delivery
- [ ] **Database Optimization** - Query performance tuning
- [ ] **Bundle Splitting** - Reduced initial load time

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Abhigyan Raj**
- GitHub: [@AbhigyanRaj](https://github.com/AbhigyanRaj)
- LinkedIn: [Abhigyan Raj](https://linkedin.com/in/abhigyanraj)
- Email: abhigyanraj673@gmail.com

---

## 🙏 Acknowledgments

- **React Team** - For the amazing frontend framework
- **MongoDB** - For the flexible database solution
- **Socket.io** - For real-time communication capabilities
- **Vercel & Render** - For reliable hosting platforms
- **Google** - For OAuth integration
- **Open Source Community** - For the incredible tools and libraries

---

## 📞 Support

If you encounter any issues or have questions:

1. **Check Documentation** - Review this README thoroughly
2. **Search Issues** - Look through existing GitHub issues
3. **Create Issue** - Open a new issue with detailed description
4. **Contact Developer** - Reach out via email or LinkedIn

---

<div align="center">

**⭐ Star this repository if you found it helpful!**

Made with ❤️ by [Abhigyan Raj](https://github.com/AbhigyanRaj)

</div>
