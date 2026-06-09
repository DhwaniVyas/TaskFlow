# TaskFlow 🚀

TaskFlow is a premium, high-fidelity team collaboration and task management platform designed to streamline workspace productivity. It features a modern, ocean-depth visual design, a responsive dual-theme system, multi-view boards (List, Kanban, Calendar, and Agenda), and automated notification alerts powered by Twilio SMS and NodeMailer.

## 📱 User Interface Previews

### 1. Interactive Landing Page
![TaskFlow Landing Page](/images/landing_preview.png)

### 2. Main Workspace Dashboard
![TaskFlow Dashboard](/images/dashboard_preview.png)

### 3. Productivity Intelligence & Analytics
![TaskFlow Overview & Metrics](/images/overview_preview.png)

---

## 🎯 Core Features

- **Multi-View Task Workspaces**: Toggle seamlessly between a nested List View (with inline subtask progress checklists), a drag-and-drop Kanban Board, a date-grid Calendar, and a chronological Agenda showing approaching milestones.
- **Granular Project Collaborations**: Create shared project boards with custom theme colors and configure roles:
  - **Owner (Head)**: Full administrative permissions to modify projects, dispatch member invites, write tasks, and write comments.
  - **Member**: Permissions to toggle completion on assigned tasks, check subtask items, and comment on task cards.
  - **Viewer**: Read-only access to tasks, comments, and members.
- **Automated Alerts Gateway**: Integrated mail dispatch (via Brevo SMTP) for registration verification links, and instant SMS alerts (via Twilio API) for project creations, member invitations, acceptances, and task assignments.
- **Deadline Background Scans**: A recurring scheduler scans tasks for approaching deadlines and automatically sends alert reminders to assignees 24 hours prior to expiration.
- **Performance Intelligence**: Statistical analysis calculations detailing completed task ratios, overdue counts, busiest/fastest completion days, and active streak metrics with charts.

---

## 🛠️ Tech Stack & Versions

TaskFlow is organized as a decoupled monorepo containing a React SPA frontend and an Express REST API backend.

### Frontend
- **Framework**: React 19 (`react` / `react-dom` @ `^19.2.6`)
- **Build Server**: Vite 8 (`vite` @ `^8.0.12`, `@vitejs/plugin-react` @ `^6.0.1`)
- **Routing**: React Router DOM 7 (`react-router-dom` @ `^7.15.1`)
- **HTTP Client**: Axios (`axios` @ `^1.16.1`)
- **Google OAuth**: Google Sign-In wrapper (`@react-oauth/google` @ `^0.12.2`)
- **Animations**: Framer Motion 12 (`framer-motion` @ `^12.40.0`)
- **Charting**: Chart.js 4 (`chart.js` @ `^4.5.1`, `react-chartjs-2` @ `^5.3.1`)
- **Styling**: TailwindCSS 4 (`tailwindcss` @ `^4.3.0`, `@tailwindcss/vite` @ `^4.3.0`)
- **Icons**: React Icons 5 (`react-icons` @ `^5.6.0`)
- **Linter**: ESLint 10 (`eslint` @ `^10.3.0`)

### Backend
- **Framework**: Express 5 (`express` @ `^5.2.1`)
- **Database ODM**: Mongoose 9 (`mongoose` @ `^9.6.2`)
- **Authentication**: JWT (`jsonwebtoken` @ `^9.0.3`) & password hashing (`bcrypt` @ `^6.0.0`)
- **Google Authentication**: Google Auth SDK (`google-auth-library` @ `^10.6.2`)
- **Email Gateway**: Nodemailer 7 (`nodemailer` @ `^7.0.13`)
- **SMS Gateway**: Twilio SDK 6 (`twilio` @ `^6.0.2`)
- **Environment Handling**: Dotenv (`dotenv` @ `^17.4.2`)
- **Developer Tools**: Nodemon (`nodemon` @ `^3.1.14`)

### Hosting & Deployment Platforms
- **Frontend SPA**: Vercel (read rewrite rules from `vercel.json`)
- **Backend API**: Render / Heroku / Node-compatible server host
- **Database Server**: MongoDB Atlas (Cloud NoSQL)

---

## 📂 Project Architecture

```text
TaskFlow/
├── backend/                  # Node.js + Express REST API
│   ├── src/
│   │   ├── config/           # Database connections & Env validations
│   │   ├── controllers/      # Routes logic (Auth, Projects, Tasks, Analytics, Comments)
│   │   ├── middleware/       # JWT protection, request logger, error handlers
│   │   ├── models/           # Mongoose Data Schemas (User, Project, Task, Comment, Notification, ActivityLog)
│   │   ├── routes/           # REST endpoints
│   │   └── utils/            # Twilio SMS wrapper, Mailer templates, Token utilities
│   ├── server.js             # Entry point & 30-minute cron scheduling
│   ├── .env.example          # Sample environment variables
│   └── package.json          # Server dependencies
│
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── api/              # Axios Client setup
│   │   ├── components/       # UI Modals & Protection wrapper components
│   │   ├── pages/            # View pages (Landing, Login, Register, Verification)
│   │   │   └── dashboard/    # Tab modules (Overview, Tasks, Projects, Analytics, Notifications, Profile)
│   │   ├── routes/           # App routes mapping
│   │   ├── styles/           # CSS themes, variables, and animations
│   │   └── utils/            # JWT Token management
│   ├── public/               # Favicon & assets
│   ├── .env.example          # Sample client environment variables
│   └── package.json          # SPA dependencies
│
├── images/                   # UI previews
└── vercel.json               # Frontend redirect rules for Router routing
```

---

## 🔑 Environment Variables Reference

### Backend Server Settings (`backend/.env`)

Configure a `.env` file inside the `backend/` directory by copying [backend/.env.example](file:///d:/Projects/TaskFlow/backend/.env.example):

| Key | Required | Description | Origin / Example |
| :--- | :---: | :--- | :--- |
| `PORT` | Yes | Local port for Express API | `5000` |
| `NODE_ENV` | Yes | Server environment state | `development` or `production` |
| `MONGO_URI` | Yes | MongoDB Atlas connection string | Get connection SRV string from MongoDB Atlas |
| `JWT_SECRET` | Yes | Secret key used to sign session JWTs | Create a long random secure string |
| `JWT_EXPIRES_IN` | Yes | JWT duration window | `20d` |
| `CLIENT_URL` | Yes | Address of client SPA frontend | `http://localhost:5173` |
| `CLIENT_URLS` | No | Additional CORS allowed urls (comma-split)| `https://domain1.com,https://domain2.com` |
| `APP_URL` | Yes | Core base frontend address | `http://localhost:5173` |
| `SMTP_HOST` | Yes | Mail server server endpoint | E.g. `smtp-relay.brevo.com` |
| `SMTP_PORT` | Yes | Mail server connection port | `587` (TLS) or `465` (SSL) |
| `SMTP_SECURE` | Yes | Enable SSL protocol (`true`/`false`) | `false` (for port 587) |
| `SMTP_USER` | Yes | Mail server login name | SMTP account user email |
| `SMTP_PASS` | Yes | Mail server password key | SMTP API password key |
| `MAIL_FROM` | Yes | Sender identity displayed on emails | `TaskFlow <noreply@taskflow.com>` |
| `GOOGLE_CLIENT_ID` | Yes | OAuth Client ID for SSO | Google Developer Console |
| `GOOGLE_CLIENT_SECRET`| No | OAuth Client Secret for SSO | Google Developer Console |
| `TWILIO_ACCOUNT_SID` | No | Twilio Account SID | Twilio Console dashboard |
| `TWILIO_AUTH_TOKEN` | No | Twilio API auth token | Twilio Console dashboard |
| `TWILIO_PHONE_NUMBER` | No | Purchased Twilio SMS number | Twilio Dashboard |

### Frontend Client Settings (`frontend/.env`)

Configure a `.env` file inside the `frontend/` directory by copying [frontend/.env.example](file:///d:/Projects/TaskFlow/frontend/.env.example):

| Key | Required | Description | Origin / Example |
| :--- | :---: | :--- | :--- |
| `VITE_API_URL` | Yes | Base URL target for backend requests | `http://localhost:5000/api` |
| `VITE_GOOGLE_CLIENT_ID`| Yes | Google OAuth Client ID (matching backend) | Google Developer Console |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.0.0` or higher is required.
- **Package Manager**: `npm` (included with Node.js).
- **Database**: A running MongoDB instance (locally or cloud-hosted on MongoDB Atlas).

### Installation & Run Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/TaskFlow.git
   cd TaskFlow
   ```

2. **Set up the backend server**:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Open .env and insert your database, SMTP, and optional Twilio credentials
   ```

3. **Start the backend server in development mode**:
   ```bash
   npm run dev
   ```
   The backend REST server will start listening on `http://localhost:5000`.

4. **Set up the frontend client**:
   Open a new terminal window at the project root directory, then run:
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Open .env and insert your VITE_API_URL and VITE_GOOGLE_CLIENT_ID credentials
   ```

5. **Start the frontend application**:
   ```bash
   npm run dev
   ```
   The Vite client server will compile and open the client interface on `http://localhost:5173`.

---

## 🗄️ Database Setup

TaskFlow uses **MongoDB** as its database system. 

- **Schemas**: Schemas are configured and validated programmatically at the application level using Mongoose models (located in `backend/src/models/`).
- **Setup & Migrations**: There are **no SQL schemas, manual migrations, or seed files** required. When the Express server establishes a connection to MongoDB (via `MONGO_URI`), Mongoose automatically creates the necessary collections and indexes.
- **Indexes**: On startup, TaskFlow dynamically checks and builds a partial filter index (`googleId_1`) on the `users` collection to support both local email registration and Google Auth SSO without unique constraint clashes.

---

## 🚢 Production Deployment

### Frontend Deployment (Vercel)
1. Register and sign in to Vercel.
2. Link your GitHub account and import the TaskFlow repository.
3. Configure the following project parameters:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Register the frontend environment variables (`VITE_API_URL` and `VITE_GOOGLE_CLIENT_ID`).
5. Click **Deploy**. Vercel will automatically read `vercel.json` to handle SPA route rewrites.

### Backend Deployment (Render / Heroku)
1. Import the repository into Render or your preferred Node.js hosting platform.
2. Set the build parameters:
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. Enter all required environment variables outlined in the `Environment Variables` table. Ensure `CLIENT_URL` points to your final frontend Vercel address.
4. Deploy the service. Make sure to update the frontend's `VITE_API_URL` to point to this backend service endpoint.

---

## 🤝 Contributing Guide

We welcome project contributions! Please review the guidelines below:

### Branch Naming Conventions
- New features: `feature/short-description`
- Bug fixes: `bugfix/short-description`
- Refactoring tasks: `refactor/short-description`

### Contribution Workflow
1. Fork the repository and create your branch from `main`.
2. Implement your changes, keeping business logic intact.
3. Before committing, run ESLint from the `frontend` folder to guarantee compliance:
   ```bash
   cd frontend
   npm run lint
   ```
4. Commit your changes with clear, descriptive commit messages.
5. Push your branch to GitHub and open a Pull Request.

---

## 🛣️ Roadmap & Planned Features

- [ ] Add attachments support (PDFs, images) for project tasks and comment threads.
- [ ] Add editable statuses and column additions on the Kanban Board.
- [ ] Establish socket connections for live board updates and collaborative comments.
- [ ] Integrate SMS alerts with WhatsApp API configurations.
