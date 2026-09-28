# CAMPUSLINK
### AI-Powered Campus-to-Corporate Placement Management & Analytics Platform

CAMPUSLINK is an intelligent, unified college placement management ecosystem that connects:
**Student → AI Readiness Analysis → Skill Gap Detection → Company Requirements → AI Matching → Eligibility → Shortlisting → Conflict-Free Scheduling → Notifications → Interview/Drive → Selection → Offer Letter → Documentation → Joining Status → Analytics**

The platform replaces fragmented spreadsheets, disconnected emails, and manual shortlisting with a single, end-to-end institutional workflow.

---

## 🚀 Key Features

1. **Student Readiness Profiling & ATS Evaluation**:
   - Comprehensive profiles capturing Personal, Academic, Verified CGPA, 0-Backlog records, GitHub/LinkedIn links, Projects, Certifications, Aptitude Diagnostics, and Mock Interview Scores.
   - Built-in ATS Resume Scorer with keyword density checks and Harvard/Stanford standard placement format adherence.

2. **AI Employability & Readiness Scoring**:
   - Multi-dimensional scoring (0–100) combining Technical Skills, Academic Standing, Hands-on Projects, Industry Certifications, Aptitude, Communication, and Mock Technical Interview.
   - 4 Institutional Benchmark Tiers: `HIGHLY EMPLOYABLE` (90–100), `READY` (75–89), `DEVELOPING` (60–74), and `NOT READY` (<60).
   - Configurable Scoring Weights engine allowing TPOs to adjust model weights with real-time student recalculations.

3. **AI Skill Gap Detection & Adaptive Roadmap**:
   - Target Role selector (Full Stack Developer, Backend Developer, Data Analyst, Cloud DevOps Engineer, AI/ML Engineer).
   - Matrix comparison of student's verified skills against corporate JD requirements with `HIGH`, `MEDIUM`, and `LOW` priority classifications.
   - Adaptive Preparation Center with interactive task checklists, simulated mock tests, and interview Q&A.

4. **TF-IDF + Rule-Based AI Matching Engine**:
   - Two-tier matching logic:
     - **Stage 1 (Hard Eligibility Rules)**: Strict automated checks for minimum CGPA, active backlogs, and allowed degree disciplines.
     - **Stage 2 (Content Similarity)**: TF-IDF and keyword similarity across candidate technical skills, project tech stacks, certifications, and mock interview benchmarks.
   - Generates overall match scores (e.g., 91%) and detailed 5-factor breakdown bars.

5. **Explainable AI (XAI)**:
   - Eliminates generic rejections.
   - For **Shortlisted** candidates: Highlights positive drivers (+ Strong Python skills, + Relevant project portfolio, + CGPA benchmark, + High interview score).
   - For **Not Shortlisted** candidates: Details exact gap factors (e.g., missing AWS/Docker, backlog violation, or mock interview cutoff shortfall) along with actionable remedial next steps.

6. **Conflict-Free Placement Drive Scheduling**:
   - Calendar and timeline monitoring for all campus recruitment drives.
   - Automated conflict detection checking:
     - Company drive overlap on the same date/time
     - Student shortlist conflicts (students shortlisted for 2 overlapping drives)
     - Venue clash (e.g., Turing Hall or Campus Auditorium double-booked)
     - Panel member clashing commitments
   - Automated AI suggested alternative slot (e.g., "2:00 PM – 5:00 PM") with one-click resolution.

7. **TPO Placement Command Center & Funnel Analytics**:
   - Real-time institutional KPIs: Total Students (1,248), Placement Ready (842), Active Drives, Total Offers (326), Placed Students (302), and Placement Rate (72.4%).
   - Interactive Conversion Funnel: **Registered → Eligible → Shortlisted → Interviewed → Selected → Offer Accepted → Joined**.
   - Recharts visual analytics: Branch-wise placement rates, Skill demand frequencies, Package brackets, and Annual average/highest CTC trends.

8. **At-Risk Student Intervention Hub**:
   - Proactive diagnostic indicators flagging students with low readiness (<60), repeated interview hurdles, limited technical skill coverage, or academic backlogs.
   - Actionable counseling recommendations and remedial workshop schedules.

9. **Interview Management & Scorecards**:
   - Multi-round tracking (Technical Round 1, System Design, HR & Culture).
   - Interviewer scorecard entry with sliders for Technical proficiency, Problem solving, and Communication, plus qualitative feedback notes.

10. **Official Campus Offer Letters & Document Verification Hub**:
    - Digital Offer Letter generator with detailed compensation breakdown (Base Fixed, Performance Bonus, Equity RSUs, and Joining Date).
    - Student digital signing ("Sign & Accept Offer") and university placement record locking.
    - Document verification workflow for Resumes, ID proofs, Grade transcripts, and Joining dossiers.

11. **Context-Aware AI Career Advisor Chatbot**:
    - Embedded AI advisor powered by student profile records and live drive criteria.
    - Responds to student queries such as:
      - *"Am I eligible for TechNova?"*
      - *"What skills should I improve?"*
      - *"Which jobs match my profile best?"*
      - *"Why was I not shortlisted?"*

---

## 🛠️ Architecture & Tech Stack

```
CAMPUSLINK Web Application
├── Frontend: React 19, TypeScript, Vite, Tailwind CSS, Recharts, Lucide Icons, Framer Motion
├── REST API Layer: Express router with modular endpoints (/api/*)
├── AI / ML Services Layer:
│   ├── Readiness Scoring Engine (Deterministic Weighted Model)
│   ├── TF-IDF & Skill Overlap Matching Engine
│   ├── Explainable AI (XAI) Generation Engine
│   └── Conflict-Free Scheduling Engine
└── Database: JSON Document Store (data/campuslink_db.json) with MongoDB Atlas compatible schema
```

---

## 👥 Demo Personas & Credentials

The platform features a **1-Click Persona Switcher** in the top bar:

| Role | Name | Title / Details |
|---|---|---|
| **Student (Primary)** | Bishnu Sahoo | B.Tech CSE · CGPA 8.92 · Full Stack Developer |
| **Student** | Priya Sharma | B.Tech AI & DS · CGPA 9.40 · Google Super Dream Placed (₹34.5 LPA) |
| **Student (At-Risk)** | Manish Pandey | B.Tech IT · CGPA 6.40 · 2 Backlogs · Needs Remediation |
| **TPO Officer** | Dr. Rajesh Rao | Head of Training & Placement Cell · University Placement Office |
| **Recruiter** | Sarah Jenkins | Senior University Talent Lead @ Microsoft India |
| **Recruiter** | Arjun Mehta | Staff University Recruiter @ Google India |
| **Recruiter** | Neha Kapoor | Talent Acquisition Director @ TechNova Solutions |

---

## 📦 Installation & Local Development

### Prerequisites
- Node.js (v18+ or v20+)
- npm or bun

### Setup
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Start the integrated full-stack development server:
   ```bash
   npm run dev
   ```
   The application will start on `http://localhost:3000`.

3. Build for production:
   ```bash
   npm run build
   ```

4. Run linter and type-checks:
   ```bash
   npm run lint
   ```

---

## 🐳 Docker Deployment

To run with Docker:
```bash
docker-compose up --build
```
The Docker setup encapsulates the Node.js runtime and serves the production build through port 3000.
