# 📚 SmartStudy – Intelligent Study Planner

A production-ready, full-stack study task management web application with **automatic priority calculation**. Built as a Software Engineering portfolio project demonstrating clean architecture, REST APIs, JWT authentication, and Docker deployment.

---

## ✨ Features

- 🔐 **User Authentication** – Register, login with JWT tokens, bcrypt password hashing
- 📋 **Task Management** – Full CRUD: create, edit, delete, complete study tasks
- 🧮 **Smart Priority Engine** – Auto-calculates task priority based on deadline, effort, and complexity
- 📊 **Dashboard** – Tasks sorted by priority with color-coded badges and statistics
- 🐳 **Docker Ready** – One-command deployment with `docker-compose up --build`
- 🧪 **Tested** – Pytest suite covering auth, tasks, and priority logic

---

## 🏗 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, Tailwind CSS, Axios, React Router |
| **Backend** | Python FastAPI, SQLAlchemy, Pydantic |
| **Database** | PostgreSQL (Docker) / SQLite (local dev) |
| **Auth** | JWT (python-jose), Passlib (bcrypt) |
| **Testing** | Pytest, HTTPX |
| **Deployment** | Docker, Docker Compose |

---

## 📁 Project Structure

```
smartstudy/
├── frontend/                # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/      # Navbar, TaskCard, TaskForm, ProtectedRoute
│   │   ├── context/         # AuthContext (JWT state management)
│   │   ├── pages/           # Login, Register, Dashboard
│   │   ├── services/        # Axios API layer
│   │   ├── App.jsx          # Router configuration
│   │   └── main.jsx         # Entry point
│   ├── Dockerfile
│   └── package.json
│
├── backend/                 # FastAPI + SQLAlchemy
│   ├── app/
│   │   ├── routes/          # auth.py, tasks.py
│   │   ├── main.py          # FastAPI app entry
│   │   ├── models.py        # SQLAlchemy ORM models
│   │   ├── schemas.py       # Pydantic validation
│   │   ├── auth.py          # JWT + password utilities
│   │   ├── priority.py      # Priority calculation engine
│   │   ├── database.py      # DB connection
│   │   └── config.py        # Environment configuration
│   ├── tests/               # Pytest test suite
│   ├── Dockerfile
│   └── requirements.txt
│
├── docker-compose.yml       # Multi-service orchestration
├── .env.example             # Environment variable template
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18 and **npm**
- **Python** ≥ 3.10
- **Docker** & **Docker Compose** (for containerized setup)

### Option 1: Docker (Recommended)

```bash
# Clone the repo
git clone https://github.com/your-username/smartstudy.git
cd smartstudy

# Start all services
docker-compose up --build
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Option 2: Local Development

**Backend:**

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

> 💡 Local dev uses SQLite by default, no Postgres needed.

---

## 🔧 Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | SQLite (local) |
| `SECRET_KEY` | JWT signing secret | dev-secret |
| `ALGORITHM` | JWT algorithm | HS256 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifespan | 60 |

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create new account |
| `POST` | `/api/auth/login` | Login, receive JWT |
| `GET` | `/api/auth/me` | Get current user |

### Tasks (Protected – requires Bearer token)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks/` | Get all tasks (sorted by priority) |
| `POST` | `/api/tasks/` | Create new task |
| `GET` | `/api/tasks/{id}` | Get single task |
| `PUT` | `/api/tasks/{id}` | Update task |
| `PATCH` | `/api/tasks/{id}/complete` | Toggle complete |
| `DELETE` | `/api/tasks/{id}` | Delete task |

---

## 🧮 Priority Calculation Engine

The priority score is automatically calculated on task creation and update using a **weighted rule-based formula**:

```
urgency_score    = (30 - days_to_deadline) / 30
effort_score     = effort_hours / 20
complexity_score = complexity_level / 5

priority = 0.5 × urgency + 0.3 × effort + 0.2 × complexity
```

| Factor | Weight | Description |
|--------|--------|-------------|
| **Urgency** | 50% | How close is the deadline? |
| **Effort** | 30% | How many hours does it take? |
| **Complexity** | 20% | How difficult is the task (1–5)? |

- Returns a float between **0.0** (low) and **1.0** (critical)
- Dashboard color-codes: 🟢 Low → 🟡 Medium → 🟠 High → 🔴 Critical

---

## 🧪 Running Tests

```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v
```

**35 tests** across 4 test files:
- ✅ **Auth** (9 tests) – Registration, login, duplicate email, invalid input, /me endpoint
- ✅ **Priority Engine** (6 tests) – High/low urgency, max factors, clamping, medium range
- ✅ **Task CRUD** (8 tests) – Create, read, update, delete, complete, sorting, unauthorized access
- ✅ **End-to-End** (12 tests) – Full user journey, error handling (422/401/400/404), DB persistence, Swagger docs

---

## 🚀 Deployment

### Docker (any cloud with Docker support)

```bash
docker-compose up --build -d
```

### Cloud Platforms

| Platform | Method |
|----------|--------|
| **Railway** | Connect GitHub repo, auto-detects `docker-compose.yml` |
| **Render** | Create web services for frontend + backend, add Postgres |
| **AWS** | Use ECS/Fargate with the Docker images |

---

## 🔮 Future Improvements

- [ ] Study session timer / Pomodoro integration
- [ ] Calendar view for task deadlines
- [ ] AI-powered study recommendations
- [ ] Team collaboration features
- [ ] Email/push notifications for upcoming deadlines
- [ ] Mobile-responsive PWA support
- [ ] Analytics dashboard with study statistics
- [ ] OAuth2 social login (Google, GitHub)

---

## 📄 License

This project is built for educational purposes as part of a Software Engineering course.

---

<p align="center">
  Built with ❤️ using FastAPI + React + PostgreSQL
</p>
