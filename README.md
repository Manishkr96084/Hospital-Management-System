# Medivanta AI — Luxury Enterprise Hospital Management System

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0+-3178C6.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8.3+-646CFF.svg?style=flat&logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4+-38B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0+-D71F00.svg?style=flat&logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **Medivanta AI** is an enterprise-grade digital healthcare operating platform built for modern hospitals, medical centers, and clinical research institutes. It unites patients, physicians, nursing teams, reception staff, diagnostics, pharmacy, billing, and executive administrators into a unified, role-secured clinical operating system powered by assistive AI workflows.

---

## 🏛️ Application Architecture

```
                                  ┌────────────────────────────────────────────────────────┐
                                  │             Medivanta Frontend (React 19)              │
                                  │      TypeScript • Vite • TailwindCSS • Framer Motion   │
                                  └───────────────────────────┬────────────────────────────┘
                                                              │
                                            HTTP REST / JWT   │   WebSocket Gateway (/ws)
                                                              ▼
                                  ┌────────────────────────────────────────────────────────┐
                                  │              FastAPI Backend Engine (Python 3.10+)     │
                                  │        Pydantic V2 • SQLAlchemy ORM • Uvicorn Server  │
                                  └───────┬──────────────┬──────────────┬──────────────┬───┘
                                          │              │              │              │
                    ┌─────────────────────┴──┐   ┌───────┴──────┐   ┌───┴──────────┐   └───┐
                    │       Database         │   │  AI Engine   │   │ ReportLab PDF│   │ Realtime WS │
                    │ SQLite (Dev) /         │   │ Gemini API + │   │ Invoices, Rx │   │ Broadcasts  │
                    │ PostgreSQL (Prod ready)│   │ Local Triage │   │ Labs, EMR    │   │ & Handovers │
                    └────────────────────────┘   └──────────────┘   └──────────────┘   └─────────────┘
```

---

## ✨ Main Features

### 1. 🔐 Multi-Role Access Control (RBAC)
- 8 dedicated healthcare roles:
  - **Super Admin**: Enterprise system analytics, audit logs, doctor/department provisioning.
  - **Doctor**: Clinical queue, longitudinal EHR review, Doctor AI clinical assistant, digital prescription issuance.
  - **Nurse**: Ward floor census, vital telemetry monitoring, Medication Administration Record (MAR), shift handovers.
  - **Receptionist**: Patient intake, scheduling, check-ins, queue token generation.
  - **Laboratory Staff**: Diagnostic analyzer workflow, specimen tracking, flag thresholds (`NORMAL`, `LOW`, `HIGH`, `CRITICAL`), signed PDF reports.
  - **Pharmacist**: Pharmacy inventory stock control, threshold replenishment alerts, batch dispensing.
  - **Billing Staff**: Charge itemization, automated invoice generation, multiple payment channels (Cash, Cards, UPI, Insurance).
  - **Patient Portal**: Medical record timeline, prescription histories, appointment booking, lab downloads.
- Fast role-switching demo mechanism on login and navigation.

### 2. 🤖 AI Clinical Assistants & Predictive Triage
- **Medivanta Clinical Chatbot**: Interactive patient concierge with intelligent symptom categorization, specialty department routing, emergency alerts, and conversational health information.
- **Doctor AI Copilot**: Automated clinical SOAP note synthesis, medical history summarization, and discharge summary drafting.
- **Predictive Analytics**: 7-day patient inflow forecasting, bed occupancy prediction, and cancellation risk evaluation.

### 3. 🏥 Enterprise Clinical & Inpatient Management
- **OPD Queue Management**: Token generation, estimated wait times, and real-time next-patient calling.
- **Emergency Department (Level 1 Trauma)**: Triage stratification (`RED`, `YELLOW`, `GREEN`), rapid bed assignment, and priority queues.
- **Bed & Ward Map Matrix**: Interactive visual ward grid (ICU, Emergency, General Ward, Executive VIP Suites) with real-time occupancy toggling.
- **Doctor Ward Rounds & Bedside Notes**: Inpatient rounds documentation, treatment updates, and progress monitoring.
- **Cashless Insurance & Claims**: Pre-authorization tracking, policy verification, and claim adjudication.

### 4. 📄 Digital Documents & Official PDF Generation
- High-fidelity PDF generation using **ReportLab**:
  - Itemized Invoices & Payment Receipts
  - Official Medical Prescriptions (Rx)
  - Diagnostic Laboratory Test Reports
  - Formal Hospital Inpatient Discharge Summaries

---

## 💻 Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 19, TypeScript (~6.0), Vite 8 |
| **Styling & UI** | TailwindCSS 3.4, Lucide Icons, Framer Motion |
| **State & Networking** | React Router v7, Axios, React Hook Form, Zod |
| **Data Visualization** | Recharts, Canvas Confetti |
| **Backend Framework** | FastAPI (Python 3.10+), Uvicorn |
| **Data Validation & ORM**| Pydantic V2, SQLAlchemy 2.0 |
| **Security & Auth** | Passlib, Bcrypt, Python-Jose (JWT HS256) |
| **AI Integration** | Google Gemini API (Candidate models: Gemini 2.5/3.5/3.7 Flash) + Fallback Rules Engine |
| **Document Generation**| ReportLab (PDF), jsPDF |
| **Testing** | Pytest, FastAPI TestClient, Oxlint |

---

## 📁 Project Folder Structure

```
Hospital Management System/
├── backend/                        # FastAPI Python backend
│   ├── app/
│   │   ├── api/                    # Modular API route controllers
│   │   │   ├── auth.py             # Authentication & registration
│   │   │   ├── patients.py         # Patient directory & management
│   │   │   ├── doctors.py          # Physician roster & schedules
│   │   │   ├── appointments.py     # Appointment booking engine
│   │   │   ├── medical_records.py  # EMR / EHR documentation
│   │   │   ├── prescriptions.py    # Digital prescriptions (Rx)
│   │   │   ├── labs.py             # Laboratory orders & test results
│   │   │   ├── pharmacy.py         # Drug inventory & dispensing
│   │   │   ├── beds.py             # Bed allocation & wards
│   │   │   ├── admissions.py       # Inpatient admission & discharge
│   │   │   ├── billing.py          # Invoices & payment collection
│   │   │   ├── emergency.py        # Emergency triage & trauma bay
│   │   │   ├── opd.py              # Outpatient queue tokens
│   │   │   ├── nursing.py          # Nurse station, tasks, MAR
│   │   │   ├── insurance.py        # Health policies & cashless claims
│   │   │   ├── ai.py               # AI triage & doctor assist
│   │   │   ├── analytics.py        # Operational telemetry & metrics
│   │   │   ├── audit.py            # HIPAA audit logging
│   │   │   └── search.py           # Global instant search
│   │   ├── auth/                   # Security dependencies & RBAC checkers
│   │   ├── core/                   # Configuration, Database engine, Security
│   │   ├── models/                 # SQLAlchemy ORM database models
│   │   ├── schemas/                # Pydantic request/response schemas
│   │   └── services/               # Business logic, PDF service, Seed data, AI
│   ├── tests/                      # Automated API test suite
│   ├── seed_db.py                  # Standalone database initialization script
│   ├── verify_system.py            # Runtime enterprise verification script
│   ├── requirements.txt            # Python dependencies
│   └── .env.example                # Backend environment template
├── frontend/                       # React + TypeScript frontend
│   ├── public/                     # Static assets & icons
│   ├── src/
│   │   ├── components/             # Reusable UI components & layouts
│   │   ├── contexts/               # React Contexts (Auth, Theme, Toast)
│   │   ├── pages/                  # Application views & dashboards
│   │   ├── services/               # Frontend API clients & endpoints
│   │   ├── types/                  # TypeScript interface definitions
│   │   ├── App.tsx                 # Root application routes
│   │   └── main.tsx                # Frontend entrypoint
│   ├── package.json                # Node dependencies & build scripts
│   ├── vite.config.ts              # Vite bundling configuration
│   ├── tailwind.config.js          # Tailwind design tokens & colors
│   └── .env.example                # Frontend environment template
├── .env.example                    # Global environment configuration template
├── .gitignore                      # Comprehensive Git exclusion rules
├── run_system.py                   # Single-command concurrent launcher
└── README.md                       # System documentation
```

---

## 🖼️ Screenshots

| Clinical Command Center | Bed & Ward Matrix |
| :---: | :---: |
| ![Dashboard Screenshot Placeholder](https://placehold.co/600x340/1e293b/38bdf8?text=Medivanta+Executive+Dashboard) | ![Bed Matrix Screenshot Placeholder](https://placehold.co/600x340/1e293b/38bdf8?text=Interactive+Bed+Floor+Map) |

| AI Clinical Assistant & Triage | Diagnostic Laboratory Reports |
| :---: | :---: |
| ![AI Assistant Screenshot Placeholder](https://placehold.co/600x340/1e293b/38bdf8?text=Doctor+AI+Copilot+%26+Triage) | ![Lab Reports Screenshot Placeholder](https://placehold.co/600x340/1e293b/38bdf8?text=Official+PDF+Laboratory+Reports) |

---

## 🔑 Demo User Accounts

All demo accounts are pre-seeded and use the password: **`Password123!`**

| Role | Email | Name | Typical Tasks |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@medivanta.health` | Dr. Alexander Wright | Executive dashboard, analytics, audit log oversight |
| **Doctor** | `doctor.smith@medivanta.health` | Dr. Julian Smith, MD | Consultations, EMR updates, AI Copilot, prescriptions |
| **Nurse** | `nurse.emily@medivanta.health` | Emily Vance, RN | Ward telemetry, MAR dispensing, shift handovers |
| **Receptionist** | `reception.clara@medivanta.health` | Clara Oswald | Patient intake, appointment booking, desk check-ins |
| **Lab Staff** | `lab.marcus@medivanta.health` | Marcus Sterling, MLS | Analyzer entries, result flags, PDF lab verification |
| **Pharmacist** | `pharmacy.david@medivanta.health` | David Thorne, PharmD | Stock tracking, batch management, dispensing |
| **Billing Staff** | `billing.sophia@medivanta.health` | Sophia Montgomery | Invoice generation, payment settlement, balance audit |
| **Patient** | `patient.john@medivanta.health` | Johnathan Reynolds | Personal medical portal, history, lab/invoice downloads |

---

## 🚀 Installation & Setup

### Prerequisites
- **Python**: Version 3.10 or higher
- **Node.js**: Version 18.0 or higher
- **npm** or **yarn** / **pnpm**
- **Git**

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/<your-username>/<your-repo-name>.git
cd "Hospital Management System"
```

---

### Step 2: Environment Configuration

Copy the example environment files:
```bash
# Root & Backend configuration
cp .env.example .env
cp backend/.env.example backend/.env

# Frontend configuration
cp frontend/.env.example frontend/.env
```

Review `.env` and fill in your values:
```env
PROJECT_NAME="Medivanta AI Hospital Management"
SECRET_KEY="replace-with-a-secure-random-secret-key-in-production"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=1440
DATABASE_URL="sqlite:///./medivanta.db"

# Optional: Google Gemini API Key for live AI responses
GEMINI_API_KEY="your-gemini-api-key-here"
```

---

### Step 3: Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
venv\Scripts\Activate.ps1
# Windows (Command Prompt):
venv\Scripts\activate.bat
# Linux / macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Initialize database schema and demo dataset
python seed_db.py

# Start the FastAPI server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- **Backend API**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc Documentation**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

### Step 4: Frontend Setup
In a new terminal window:
```bash
cd frontend

# Install npm packages
npm install

# Start Vite dev server
npm run dev
```
- **Frontend Application**: [http://localhost:5173](http://localhost:5173)

---

### Quick Launch (Concurrent Single Command)
You can also launch both the backend and frontend simultaneously using the included launcher:
```bash
python run_system.py
```

---

## 🧪 Testing & Verification

### Running the Backend Test Suite
```bash
cd backend
python -m pytest tests/test_api.py -v
```

### Running the End-to-End Enterprise Verification Script
```bash
cd backend
python verify_system.py
```
This script exercises:
- Health check & API availability
- Authentication & JWT token issuance across all 8 roles
- Analytics summary queries
- OPD queue token generation & doctor calls
- Emergency triage status & census
- MAR medication tracking & nursing tasks
- Inpatient doctor rounds
- Cashless insurance claims & pre-authorization
- ReportLab PDF engines for Invoices, Prescriptions, Labs, and Discharges

### Running the Frontend Build
```bash
cd frontend
npm run build
```

---

## 🚢 Deployment Guidance

### Production Recommendations
1. **Database**: Switch from SQLite to managed PostgreSQL:
   ```env
   DATABASE_URL="postgresql+psycopg2://<user>:<password>@<db-host>:5432/<dbname>"
   ```
2. **Reverse Proxy**: Use Nginx or Traefik in front of Uvicorn:
   ```bash
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000
   ```
3. **Frontend**: Serve the static build artifacts from `frontend/dist` using Nginx, Cloudflare Pages, AWS S3 + CloudFront, or Vercel.
4. **Environment Variables**: Store production secrets, JWT keys, and API tokens in secret managers (e.g. AWS Secrets Manager, Doppler, or HashiCorp Vault). Never commit real `.env` files.
5. **CORS Origins**: Adjust `CORS_ORIGINS` in `backend/app/core/config.py` to match your production domain.

---

## 🔒 Security & Privacy Notes

- **Credential Safety**: Real secrets, API keys, and local SQLite databases are excluded from Git version control via `.gitignore`.
- **Password Security**: Strong salted `bcrypt` hashing with salt rounds.
- **JWT Authorization**: Authenticated sessions use signed `HS256` tokens with role validation middleware.
- **Audit Logging**: Sensitive reads, admissions, discharges, and dispensing are logged into the audit table.
- **Data Privacy**: Medical demo data included in the repository is 100% synthetic for testing and development purposes.

---

## ⚠️ Known Limitations & Considerations

- **Database Concurrency**: The default development database is SQLite. For high-concurrency production deployments, migrating to PostgreSQL with a connection pooler (e.g., PgBouncer) is strongly recommended.
- **AI Latency**: When an external LLM API key is configured, chat and summarization response times depend on network latency and provider rate limits. An offline rule-based fallback engine is provided to ensure continuous uptime.

---

## 🔮 Future Enhancements

- [ ] HL7 / FHIR R4 interoperability standard compliance.
- [ ] DICOM medical imaging viewer integration for PACS radiology workflows.
- [ ] Telemedicine WebRTC video consultations.
- [ ] Automated SMS / WhatsApp appointment reminders via Twilio gateway.
- [ ] Multi-tenant branch isolation with regional data residency compliance.

---

## 👥 Authors & Acknowledgments

- **Medivanta AI Engineering Team**
- Built with [FastAPI](https://fastapi.tiangolo.com/), [React](https://react.dev/), [Vite](https://vitejs.dev/), and [TailwindCSS](https://tailwindcss.com/).

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
