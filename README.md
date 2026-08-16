# Crop Health & Anomaly Agent - Hackathon Starter Pack

Welcome! This is your complete **Ultra-Safe MVP** structure for a 4-day hackathon.

---

## 📋 What You Get

This starter pack includes everything you need to build end-to-end in 4 days:

1. **API_CONTRACT.md** — Exact API spec (frontend + backend build against this)
2. **DATABASE_SCHEMA.sql** — PostgreSQL schema (7 tables, ready to run)
3. **BACKEND_SKELETON.md** — FastAPI setup + models + endpoints + services
4. **FRONTEND_SKELETON.md** — React/Next.js setup + components + mock data
5. **HACKATHON_SPRINT_PLAN.md** — Day-by-day tasks, checkpoints, demo prep
6. **README.md** — This file

---

## 🚀 Quick Start (Choose Your Role)

### **You: System Design / Team Lead**

**Before Day 1:**
1. Read HACKATHON_SPRINT_PLAN.md (15 min)
2. Read API_CONTRACT.md (10 min)
3. Share with team
4. Create GitHub repo
5. Add files to repo

**During Hackathon:**
- Lead standups
- Verify API contract compliance
- Unblock backend/frontend when questions arise
- Rehearse demo

**Time investment:** ~1 hour before, ~2-3 hours during hackathon

---

### **Frontend Engineer**

**Before Day 1:**
1. Read FRONTEND_SKELETON.md (20 min)
2. `npm create-next-app frontend`
3. Copy component code into your project

**Day 1:**
- Install dependencies
- Set `NEXT_PUBLIC_USE_MOCK=true`
- Copy all mock data + components
- Build components using mock data
- **No need to wait for backend**

**Day 2-3:**
- Switch to real API when backend is ready
- Integrate with real endpoints
- Polish styling

**Day 4:**
- Bug fixes + demo rehearsal

**Time investment:** ~8-10 hours

---

### **Backend Engineer**

**Before Day 1:**
1. Read BACKEND_SKELETON.md (20 min)
2. Read DATABASE_SCHEMA.sql (10 min)
3. Install PostgreSQL locally

**Day 1:**
- Copy backend skeleton into project
- Set up virtual environment + install dependencies
- Create PostgreSQL database
- Run DATABASE_SCHEMA.sql

**Day 2:**
- Build FastAPI endpoints
- Test with mock data

**Day 3:**
- Integrate Claude API for agent
- Full end-to-end testing

**Day 4:**
- Bug fixes + demo rehearsal

**Time investment:** ~8-10 hours

---

### **Backend Support / Second Backend**

**Focus areas:**
- Help backend engineer with setup
- Database troubleshooting
- Research Claude API docs
- Build `services/agent_service.py` (where AI agent logic goes)
- Test endpoints with Postman

**Time investment:** ~6-8 hours

---

## 📊 Project Structure

```
project-root/
├── API_CONTRACT.md              ← Both teams read this
├── DATABASE_SCHEMA.sql          ← Backend runs this
├── BACKEND_SKELETON.md          ← Backend follows this
├── FRONTEND_SKELETON.md         ← Frontend follows this
├── HACKATHON_SPRINT_PLAN.md     ← Team timeline & tasks
├── README.md                    ← You are here
│
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── api/
│   │   └── endpoints.py
│   └── services/
│       ├── anomaly_service.py
│       ├── agent_service.py        ← AI agent with Claude API
│       └── mock_data.py
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── FarmOverview.jsx
    │   │   ├── FieldMap.jsx
    │   │   ├── AnomalyDetailed.jsx
    │   │   ├── EvidenceCard.jsx
    │   │   ├── DiagnosisCard.jsx
    │   │   ├── RecommendationCard.jsx
    │   │   └── ImageUpload.jsx
    │   ├── pages/
    │   │   ├── index.jsx            ← Landing page
    │   │   ├── field/[fieldId].jsx
    │   │   └── anomaly/[anomalyId].jsx
    │   ├── api/
    │   │   └── api.js               ← Handles mock + real API
    │   ├── mock/
    │   │   └── mockData.js          ← Use while backend builds
    │   └── styles/
    │       └── globals.css
    ├── package.json
    ├── .env.example
    └── next.config.js
```

---

## 🔗 How It Works

### The Flow

```
1. Frontend: Upload image
   ↓
2. Backend: Receive image_url + field_id
   ↓
3. Backend: Detect anomaly (vision service)
   ↓
4. Backend: Create Anomaly record in DB
   ↓
5. Backend: Run AI Agent (Claude API)
   - Agent asks: "What tools do I need?"
   - Backend provides: soil data, weather, crop history
   - Claude analyzes and diagnoses
   ↓
6. Backend: Store diagnosis + recommendation in DB
   ↓
7. Backend: Return full result to frontend
   ↓
8. Frontend: Display analysis (evidence, diagnosis, action)
```

### The Data Flow

```
Farm → Field → Anomaly → Evidence + Diagnosis + Recommendation
                            (all stored together in DB)
```

### The API Contract

**All requests/responses must match exactly:**

```
POST /api/analyze
  Request: { image_url, field_id }
  Response: { anomaly_id, anomaly_type, severity, evidence, diagnosis, recommendation }

GET /api/anomalies/{anomaly_id}
  Response: { complete anomaly with all details }

GET /api/fields/{field_id}
  Response: { field info + list of anomalies }

GET /api/farms/{farm_id}
  Response: { farm info + list of fields }
```

**See API_CONTRACT.md for complete spec.**

---

## ⚡ Key Decisions (Ultra-Safe MVP)

### What's Included
- ✅ Image upload
- ✅ Anomaly detection (hardcoded water stress for MVP)
- ✅ AI agent with tool calling (Claude API)
- ✅ Diagnosis generation
- ✅ Recommendation generation
- ✅ Dashboard display
- ✅ PostgreSQL storage

### What's NOT Included (v2 features)
- ❌ Multiple anomaly types (pick one: water_stress)
- ❌ Heatmap visualization
- ❌ NDVI calculations
- ❌ Historical timeline
- ❌ Real vision model (use mock)
- ❌ Multi-farm support (hardcode one farm)

**Why?** These cuts reduce scope by 40% while keeping the demo impressive.

---

## 📅 Timeline at a Glance

| Day | Morning | Afternoon | Goal |
|-----|---------|-----------|------|
| 1 | Setup | Build components | Frontend mock-ready, Backend DB setup |
| 2 | Endpoints | Integration | Backend returns mock data, Frontend on real API |
| 3 | Agent logic | Full E2E test | AI diagnoses, complete flow working |
| 4 | Bug fixes | Demo rehearsal | Polished, confidence high |

---

## ✅ Before Day 1 Starts

**Team Lead (You):**
- [ ] Create GitHub repo
- [ ] Add all .md files to repo
- [ ] Share HACKATHON_SPRINT_PLAN.md in team chat
- [ ] Post API_CONTRACT.md in shared docs

**Backend Engineer:**
- [ ] Install PostgreSQL
- [ ] Test: `psql --version` works
- [ ] Test: Can create new database

**Frontend Engineer:**
- [ ] Install Node.js 16+
- [ ] Test: `node --version` works
- [ ] Test: `npm create-next-app --help` works

**Everyone:**
- [ ] Read API_CONTRACT.md once
- [ ] Read your role section in README.md
- [ ] Ask questions NOW (not during hackathon)

---

## 🛠 Tech Stack (Don't Deviate)

**Frontend:**
- React 18+
- Next.js 14+
- Axios (API calls)

**Backend:**
- Python 3.9+
- FastAPI
- SQLAlchemy
- PostgreSQL 12+
- Claude API (for AI agent)

**Database:**
- PostgreSQL (7 tables, schema provided)

**Hosting (Optional):**
- Frontend: Vercel
- Backend: Railway / Render / AWS

---

## 🚨 Critical Rules

1. **Don't deviate from API contract** — It's your binding agreement
2. **Use mock data for frontend** — Don't block on backend
3. **Test integrations early** — Day 2, not Day 4
4. **No heroics Day 4** — Polish only, no new features
5. **Document as you go** — Not at the end

---

## 💡 Pro Tips

### For Frontend
- Build with mock data first (NEXT_PUBLIC_USE_MOCK=true)
- Swap real API when backend is ready
- Test mobile early (use DevTools)
- Load spinner = user trust

### For Backend
- Verify DB schema before writing code
- Test endpoints with Postman before Frontend touches them
- Use mock tools for agent (don't call real weather APIs)
- Error handling matters (bad field_id, missing data, etc.)

### For Everyone
- Commit to Git every 2 hours (not 1 giant commit at end)
- Slack standup every 6 hours (5 min, brief updates)
- Demo to each other mid-Day 3 (catch issues early)
- Rehearse demo 3 times Day 4 (no surprises)

---

## ❓ FAQ

**Q: Do I need to deploy?**  
A: No. Local setup (localhost) is fine for demo.

**Q: What if backend isn't ready Day 2?**  
A: Frontend uses NEXT_PUBLIC_USE_MOCK=true, keeps building.

**Q: What if Claude API fails?**  
A: Use hardcoded diagnosis as fallback (have it ready).

**Q: Can we add more features after the MVP?**  
A: Yes, if Day 3 goes perfectly. See HACKATHON_SPRINT_PLAN.md for optional features.

**Q: How long is the demo?**  
A: 5 minutes max. Upload → Analyze → Diagnose → Done.

---

## 🎯 Success Criteria (Day 4)

- ✅ Upload image without errors
- ✅ System detects anomaly and assigns to zone
- ✅ AI agent investigates (soil, weather, history)
- ✅ Claude generates diagnosis with confidence score
- ✅ Dashboard shows evidence + diagnosis + recommendation
- ✅ Data stored in database
- ✅ Full demo runs in < 5 minutes
- ✅ No console errors or warnings
- ✅ Team confident explaining each part

---

## 📞 Support During Hackathon

**Stuck? Try this order:**
1. Check API_CONTRACT.md (99% of issues are contract mismatches)
2. Check HACKATHON_SPRINT_PLAN.md for that day's section
3. Ask team lead (You)
4. Ask Claude :)

---

## 🚀 Next Step

1. **Right now:** Create GitHub repo
2. **Copy files** into repo (this README + all .md files)
3. **Share with team** (especially API_CONTRACT.md)
4. **Each person** reads their role section in README.md
5. **Day 1 morning:** Everyone runs their setup checklist

---

## Final Words

This is a **proven structure** for 4-day hackathons. It's designed to ship a demo, not win a hackathon. Ship > Perfect.

You've got this. 🚜💨

---

**Questions? Ask now. Once Day 1 starts, no time for questions.**

Good luck!
