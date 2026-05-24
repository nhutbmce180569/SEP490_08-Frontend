# StayHub - Smart Tour Booking & Management System (Frontend)

**StayHub Frontend** is the client-side application of the StayHub ecosystem, built using modern web technologies. It delivers a seamless and interactive user experience for tour discovery, booking, and social interaction, integrating closely with the StayHub microservices backend.

The application focuses on performance, scalability, and user experience, featuring real-time updates, AI-assisted suggestions, and an engaging UI for travelers.

---

## 🛠 Technology Stack

### 🔹 Frontend Core

* **Runtime:** Node.js
* **Framework:** ReactJS (with TypeScript)
* **Build Tool:** Vite
* **Styling:** TailwindCSS / CSS Modules

---

### 🔹 State & Data Handling

* **State Management:** Context API / Redux
* **API Communication:** Axios
* **Routing:** React Router

---

### 🔹 Real-time Features

* **WebSockets / SignalR Client:**
  Used for:

  * Live Chat
  * SOS Emergency Alerts
  * Real-time notifications

---

### 🔹 Development Tools

* **Package Manager:** npm / yarn
* **Linting & Formatting:** ESLint + Prettier
* **Version Control:** Git & GitHub/GitLab
* **IDE:** Visual Studio Code

---

## 🚀 Getting Started

Follow these steps to run the frontend locally:

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd stayhub-frontend
```

---

### 2. Install dependencies

```bash
npm install
```

---

### 3. Configure environment variables

Create a `.env` file in the root directory and configure:

```env
VITE_API_BASE_URL=http://localhost:5000
```

---

### 4. Run the development server

```bash
npm run dev
```

The app will be available at:

```
http://localhost:5173
```

---

## 📁 Project Structure

```bash
src/
├── assets/
├── components/
├── config/
├── constants/
├── contexts/
├── features/
│   ├── auth/
│   │   ├── pages/        # LoginPage, RegisterPage, ...
│   │   ├── components/   # LoginForm, RegisterForm, ...
│   │   ├── hooks/        # useAuth, ...
│   │   ├── services/     # authService (API calls)
│   │   ├── store/        # auth state (Redux/Zustand)
│   │   ├── types/        # interfaces, types
│   │   └── utils/        # helper functions
│   │
│   ├── booking/
│   ├── social/
│   ├── tour/
│   └── voucher/
│
├── layouts/
├── pages/                # global pages (Home, NotFound, ...)
├── router/
└── store/
```

---

## 🔗 Integration with Backend

The frontend communicates with the StayHub microservices backend via REST APIs.

* Ensure backend services are running before starting the frontend
* API base URL must match `.env` configuration
* Supports authentication, booking, payment, and social features

---

## 🚀 Git Workflow: Handling `.vscode` and `node_modules`

### ❌ The Problem

Certain folders should NEVER be pushed to the repository:

* `node_modules/` → large and auto-generated
* `.vscode/` → local editor settings

---

### ✅ The Solution

Add them to `.gitignore`:

```bash
node_modules/
.vscode/
dist/
.env
```

---

If accidentally tracked:

```bash
git rm -r --cached node_modules
git rm -r --cached .vscode
```

Then commit:

```bash
git commit -m "chore: remove unnecessary files from tracking"
```

---

## 🧾 Git Commit Convention

StayHub uses **Conventional Commits**:

### 🔹 Format

```
<type>: <short description>
```

---

### 🔹 Types

* `feat`, `fix`, `chore`, `refactor`, `docs`, `style`, `test`

---

### 🔹 Examples

```bash
feat: implement tour booking UI
fix: resolve login form validation issue
refactor: optimize API handling logic
```

---

## 🌿 Branch Naming Convention

Follow tasks from backlog:

👉 Backlog:
[https://docs.google.com/spreadsheets/d/1D6swDBGxUkrj-zVbCGWIK_zgdPEWKOH8CQ5xSg2KrnA/edit?gid=0#gid=0](https://docs.google.com/spreadsheets/d/1D6swDBGxUkrj-zVbCGWIK_zgdPEWKOH8CQ5xSg2KrnA/edit?gid=0#gid=0)

---

### 🔹 Format

```
<type>/<task-id>-<description>
```

---

### 🔹 Examples

```bash
feature/UC-12-booking-ui
fix/UC-25-login-bug
```

---

### 💡 Rules

* Use `kebab-case`
* Match task ID from backlog
* 1 branch = 1 task
* Use Pull Request before merge

---

## 🎯 Final Note

StayHub Frontend is designed to work seamlessly with the backend microservices, delivering a modern, scalable, and real-time travel experience.

---
