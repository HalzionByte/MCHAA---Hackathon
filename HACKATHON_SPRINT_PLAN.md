# Hackathon Sprint Plan (4 Days, Ultra-Safe MVP)

**Start:** Day 1 (Monday morning)  
**End:** Day 4 (Thursday evening)  
**Team:** 4 people (You: Design/Lead, Frontend, Backend, Backend Support)  
**Goal:** Fully functional end-to-end demo by Day 4 evening

---

## Phase 0: Pre-Hackathon (Before Day 1)

### Tasks (Total: 3-4 hours)
- [ ] All files below are already created and ready
- [ ] Create GitHub repository
- [ ] Post API_CONTRACT.md in shared docs (Notion/Google Drive)
- [ ] Post this sprint plan in team Slack
- [ ] Backend: Set up PostgreSQL locally (install + create crop_health db)
- [ ] Frontend: npm create-next-app frontend
- [ ] Everyone: Read API_CONTRACT.md once

---

## Day 1: Setup & Parallel Start

**Duration:** 8 hours  
**Goal:** Everyone has working skeleton, frontend can build with mocks, backend DB ready

### Morning (2 hours)

**You (Design/Lead):**
- [ ] Confirm all skeletons are downloaded into team repo
- [ ] Clarify any questions on API contract
- [ ] Assign specific components to frontend engineer
- [ ] Walk team through mock data flow

**Frontend Engineer:**
- [ ] Copy FRONTEND_SKELETON files into project
- [ ] Install dependencies (axios, next)
- [ ] Set NEXT_PUBLIC_USE_MOCK=true in .env.local
- [ ] Verify mock anomaly data loads on localhost:3000

**Backend Engineer:**
- [ ] Copy BACKEND_SKELETON files into project
- [ ] Set up virtual environment: `python -m venv venv && source venv/bin/activate`
- [ ] Install dependencies: `pip install -r requirements.txt`
- [ ] Create PostgreSQL database: `createdb crop_health`

**Backend Support:**
- [ ] Help backend engineer with setup
- [ ] Create .env file with DB credentials
- [ ] Test database connection

### Afternoon (6 hours)

**Frontend Engineer (Can work independently):**
- [ ] Build FarmOverview component ✓ (uses MOCK_FARM)
- [ ] Build FieldMap component (simple SVG map) ✓
- [ ] Build EvidenceCard component ✓
- [ ] Build DiagnosisCard component ✓
- [ ] Build RecommendationCard component ✓
- [ ] Build ImageUpload component ✓
- [ ] Style globals.css ✓
- [ ] Create pages: index.jsx, field/[fieldId].jsx, anomaly/[anomalyId].jsx ✓
- [ ] Test with mock data — should see full flow

**Backend Engineer:**
- [ ] Run DB schema (DATABASE_SCHEMA.sql): `psql crop_health < DATABASE_SCHEMA.sql`
- [ ] Verify 7 tables created in PostgreSQL
- [ ] Create models.py from skeleton ✓
- [ ] Create schemas.py from skeleton ✓
- [ ] Create database.py from skeleton ✓
- [ ] Create services/mock_data.py from skeleton ✓
- [ ] Create api/endpoints.py from skeleton ✓

**Backend Support:**
- [ ] Help troubleshoot DB issues
- [ ] Assist with model/schema setup

**You (Design/Lead):**
- [ ] Answer questions as they come up
- [ ] Verify frontend is on track
- [ ] Verify backend DB setup is solid

### End of Day 1 Checklist
- [ ] Frontend: npm run dev works, landing page shows mock farm
- [ ] Backend: PostgreSQL tables created, models defined
- [ ] Both: API contract confirmed and locked
- [ ] Both: No deviations from contract without team approval

---

## Day 2: Backend Core + Frontend Refinement

**Duration:** 8 hours  
**Goal:** Backend can handle image upload → anomaly storage, Frontend polished with real styling

### Morning (2 hours)

**Backend Engineer (High Priority):**
- [ ] Create main.py FastAPI entry point
- [ ] Test: `uvicorn main:app --reload` runs on http://localhost:8000
- [ ] Test health endpoint: GET /health returns status
- [ ] Create POST /api/analyze endpoint (mock detection for now)
- [ ] Create GET /api/anomalies/{anomaly_id} endpoint
- [ ] Create GET /api/fields/{field_id} endpoint
- [ ] Create GET /api/farms/{farm_id} endpoint
- [ ] Test all endpoints with mock requests (use Postman or curl)

**Backend Support:**
- [ ] Help with endpoint testing
- [ ] Start building agent_service.py stub

**Frontend Engineer:**
- [ ] Refine styling (colors, spacing, responsiveness)
- [ ] Add loading states to all components
- [ ] Add error handling to all API calls
- [ ] Test mobile responsiveness (use DevTools)

**You (Design/Lead):**
- [ ] Verify backend endpoints match API contract exactly
- [ ] Flag any deviations immediately

### Afternoon (6 hours)

**Backend Engineer:**
- [ ] Build POST /api/analyze full logic:
  - Accept image_url + field_id
  - Call detect_anomaly() → returns mock anomaly
  - Create Anomaly record in DB
  - Call run_agent() (mock diagnosis for now)
  - Return response matching API contract
- [ ] Test: Send curl request to POST /api/analyze, verify DB stores anomaly
- [ ] Build GET endpoints to retrieve from DB
- [ ] Add error handling (field not found, etc.)

**Backend Support:**
- [ ] Test endpoints with various inputs
- [ ] Help debug any DB issues
- [ ] Start researching Claude API for tool calling (read docs)

**Frontend Engineer:**
- [ ] Switch to real API: Set NEXT_PUBLIC_USE_MOCK=false in .env.local (but backend still returns mock)
- [ ] Test: Does FarmOverview still work? (might fail if backend doesn't exist yet)
- [ ] Build out pages: field/[fieldId].jsx, anomaly/[anomalyId].jsx
- [ ] Implement navigation between pages
- [ ] Add "Upload & Analyze" flow

**You (Design/Lead):**
- [ ] Test backend endpoints with Postman
- [ ] Verify frontend can make API calls
- [ ] Document any issues in Slack

### End of Day 2 Checklist
- [ ] Backend: POST /api/analyze works, stores anomaly in DB, returns correct JSON
- [ ] Backend: All GET endpoints working
- [ ] Frontend: All pages built and styled
- [ ] Frontend: Can switch between mock/real mode
- [ ] Both: Ready for integration tomorrow

---

## Day 3: AI Agent Integration + Full Integration Testing

**Duration:** 8 hours  
**Goal:** AI agent generating diagnoses, full end-to-end flow working

### Morning (4 hours)

**Backend Support/Agent Engineer (High Priority):**
- [ ] Study Claude API documentation for tool calling
- [ ] Build services/agent_service.py with real Claude API calls:
  - Define tools: get_soil_data, get_weather_data, get_crop_history
  - Create system prompt for Claude
  - Call Claude API with tool definitions
  - Parse Claude's tool calls
  - Execute mock tools (return simulated data)
  - Get Claude's diagnosis
  - Store diagnosis in DB
- [ ] Test agent with one anomaly
- [ ] Verify diagnosis, evidence, recommendation stored in DB

**Backend Engineer:**
- [ ] Integrate agent_service into POST /api/analyze
- [ ] Test full flow: image upload → anomaly → agent → diagnosis → stored

**Frontend Engineer:**
- [ ] Fix any issues with real API calls
- [ ] Test with backend running
- [ ] Add real-time status updates (if image is being analyzed, show spinner)

**You (Design/Lead):**
- [ ] Test full flow: upload image → see analysis on dashboard
- [ ] Document any bugs or issues

### Afternoon (4 hours)

**All Team Members:**
- [ ] **Full End-to-End Test:**
  1. Frontend: Go to http://localhost:3000
  2. Click "Upload Image" for Field B
  3. Enter any image URL (even fake)
  4. Click "Analyze"
  5. Backend receives request, creates anomaly, runs agent
  6. Frontend gets response with anomaly_id
  7. Click anomaly → see full diagnosis + recommendation
  8. Verify all 4 pages load without errors

**Backend Engineer:**
- [ ] Debug any API mismatches
- [ ] Ensure all error cases handled
- [ ] Performance test (upload, analyze, return all within 5 seconds)

**Backend Support:**
- [ ] Help with debugging
- [ ] Document database state after each test

**Frontend Engineer:**
- [ ] Test all navigation flows
- [ ] Verify charts/cards display correctly
- [ ] Check for any console errors

**You (Design/Lead):**
- [ ] Create test checklist for demo day
- [ ] Ensure nothing was cut/compromised from API contract

### End of Day 3 Checklist
- [ ] Full end-to-end flow working: Upload → Analyze → Diagnose → Display
- [ ] No errors when navigating pages
- [ ] Backend + Frontend seamlessly integrated
- [ ] AI agent generating real diagnoses
- [ ] Database has data from test runs
- [ ] Everything matches API contract

---

## Day 4: Polish, Testing & Demo Rehearsal

**Duration:** 4-6 hours  
**Goal:** Bulletproof demo, no surprises

### Morning (2-3 hours)

**All Team Members:**
- [ ] **Bug Hunt:**
  - [ ] Test every user flow 3 times each
  - [ ] Check mobile responsiveness
  - [ ] Test with real URLs (Cloudinary, S3, etc.)
  - [ ] Test error cases (bad field_id, bad URL, etc.)

**Backend Engineer:**
- [ ] Final endpoint testing
- [ ] Verify database doesn't have stale data (clean if needed)
- [ ] Ensure server doesn't crash under stress

**Frontend Engineer:**
- [ ] Final UI polish (no typos, spacing correct, colors consistent)
- [ ] Ensure all images load
- [ ] No console errors or warnings

**Backend Support:**
- [ ] Help with any last-minute bugs
- [ ] Verify database integrity

**You (Design/Lead):**
- [ ] Prepare demo talking points:
  - "Here's a field with a problem..."
  - "We upload this image..."
  - "The system detects an anomaly in Zone B3..."
  - "The AI agent asks: what's causing this?"
  - "It checks soil moisture (18%), rainfall (2mm), temperature (34°C)..."
  - "It diagnoses: water stress with 87% confidence..."
  - "It recommends: immediate irrigation for Zone B3..."

### Afternoon (2-3 hours)

**All Team Members:**
- [ ] **Demo Rehearsal (3 full run-throughs):**
  - [ ] Run 1: Go slow, explain each step
  - [ ] Run 2: Normal speed, show smooth flow
  - [ ] Run 3: Handle a question/issue gracefully
- [ ] Time it: Should take ~5 minutes
- [ ] Record it (backup if live demo fails)

**You (Design/Lead):**
- [ ] Lead the rehearsal
- [ ] Call out any issues
- [ ] Finalize demo script

**Before Demo:**
- [ ] Restart servers (fresh state)
- [ ] Clear browser cache
- [ ] Open both frontend + backend in separate terminals
- [ ] Have backup data ready (test images, test URLs)
- [ ] Have phone ready to show mobile UI

### End of Day 4 Checklist
- [ ] ✅ No bugs encountered in rehearsal
- [ ] ✅ Demo runs smoothly from start to finish
- [ ] ✅ Team knows talking points
- [ ] ✅ Backup plan if something fails (e.g., recorded demo)
- [ ] ✅ Database populated with good test data
- [ ] ✅ Servers running stable

---

## Critical Integration Points

These are where things break. Double-check:

### 1. API Contract (Both Teams)
**Verify before moving forward:**
- Request/response JSON matches exactly
- No extra fields, no missing fields
- Status codes correct (200 for success, 400 for error)

### 2. Image Upload Flow
**Frontend → Backend:**
- Frontend sends: { image_url, field_id }
- Backend receives correctly
- Backend stores in images table ✓

### 3. Anomaly Creation
**Backend:**
- Anomaly created when POST /api/analyze called
- Anomaly stored in anomalies table with all fields
- Response includes anomaly_id ✓

### 4. Agent Diagnosis
**Backend/Claude:**
- Agent receives anomaly_id
- Agent calls get_soil_data, get_weather_data, get_crop_history
- Agent receives mock tool responses
- Agent sends to Claude API
- Claude returns diagnosis + reasoning
- Diagnosis stored in diagnoses table ✓

### 5. Full Response
**Backend → Frontend:**
- GET /api/anomalies/{anomaly_id} returns complete structured result
- All fields populated (evidence, diagnosis, recommendation)
- Frontend can display without errors ✓

### 6. Navigation
**Frontend:**
- Click farm → see fields ✓
- Click field → see anomalies ✓
- Click anomaly → see full analysis ✓
- Browser back button works ✓

---

## Fallback Plan (If Something Breaks)

### If Backend Crashes Day 4 Morning:
- Use API mocks from Day 1
- Frontend reverts to NEXT_PUBLIC_USE_MOCK=true
- Demo still works, explains "simplified for demo purposes"

### If Claude API Fails:
- Use hardcoded diagnosis (same as mock data)
- Backend returns pre-baked response
- Demo still shows full flow

### If Frontend UI Has Bug Day 4:
- Show mobile version or use browser DevTools
- Or show recorded demo from Day 3

### If Database Corrupt:
- Restore from backup or recreate with seed data
- Have SQL dump ready to reload

---

## Team Communication

**Standup Times (5 min each):**
- Day 1 morning: 9:00 AM (kickoff)
- Day 1 afternoon: 2:00 PM (check-in)
- Day 2 morning: 9:00 AM
- Day 2 afternoon: 2:00 PM
- Day 3 morning: 9:00 AM (integration test)
- Day 3 afternoon: 3:00 PM (blockers)
- Day 4 morning: 10:00 AM (final check)

**Slack Channels:**
- #general: Standup updates
- #blockers: Issues that need help
- #demo: Demo prep + talking points

---

## Success Metrics

**Day 4 End:**
- ✅ Live demo runs without errors
- ✅ Shows upload → anomaly detection → diagnosis → recommendation
- ✅ Code is clean (no hardcoded test values)
- ✅ Database has real data
- ✅ Team can explain the AI reasoning

---

## Optional Enhancements (Only if Time)

If you finish early:
- [ ] Add historical anomaly timeline
- [ ] Add NDVI visualization (graph, not heatmap)
- [ ] Add multiple anomaly types (disease, nutrient deficiency)
- [ ] Add exportable JSON report
- [ ] Deploy to Vercel (frontend) + Render/Railway (backend)

**But don't start these until Day 4 afternoon if everything is done.**

---

## Key Reminders

1. **Don't deviate from API contract** — it's your safety net
2. **Use mock data for frontend** — don't block on backend
3. **Test integrations early** — not on Day 4
4. **Document everything** — future-you will thank present-you
5. **Demo the happy path** — save edge cases for Q&A
6. **Rehearse 3 times** — confidence matters

---

## Files to Upload to GitHub (Day 1)

- API_CONTRACT.md
- DATABASE_SCHEMA.sql
- BACKEND_SKELETON.md (+ actual code files)
- FRONTEND_SKELETON.md (+ actual code files)
- .gitignore
- README.md (with setup instructions)

---

## Questions Before You Start?

- Clarify backend DB setup?
- Clarify Claude API integration?
- Clarify any component logic?

**Ask now, iterate later.**

Good luck! 🚜💨
