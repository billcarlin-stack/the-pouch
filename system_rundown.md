# System Rundown — The Pouch

**The Pouch** is a premium high-performance analytics platform built for the **North Melbourne Football Club**. It serves as a unified command center for coaches and a personalized performance portal for players.

## 🏢 Core Architecture
- **Frontend**: React + Vite + Tailwind CSS (Premium Dark Theme).
- **Backend**: Flask API (Python).
- **Database**: Google BigQuery (Data Lakehouse).
- **AI Engine**: Kanga AI (Custom logic engine integrated with BigQuery analytics).

---

## 🔐 Access & Security
- **PIN-Based Login**: Simplistic, jersey-number-based access for players; master access for coaching staff.
- **Role-Based Views**: Automatic detection of Coach vs. Player roles to customize navigation and data visibility.

---

## 📊 Performance Modules

### 1. Dashboard (The Hub)
- **KPI Tracking**: Real-time squad averages for Sleep, Soreness, and Stress.
- **Unified Health Alerts**: A combined panel showing active injuries and critical player check-in notes.
- **Daily Schedule**: Personalized calendar widget for immediate tactical visibility.
- **AI Insights**: Automated performance narratives generated from squad data.

### 2. Players & Squad (Coach Only)
- **Squad Grid**: Visual list of all players with real-time "Readiness Status" indicators.
- **Search & Filter**: Powerful personnel lookup by name, number, or position.

### 3. Player Profiles (Detailed Analytics)
- **Season Averages**: AF Avg, Disposals, Marks, Tackles, and Goals pinned at the top.
- **Health Radar**: Visual "spiky" radar comparing Coach vs. Self vs. Squad averages.
- **Match Ratings**: Rolling performance graphs for the 2026 season.
- **Injury History**: Complete log of past and active medical statuses.
- **Wellbeing integration**: The latest daily check-in results and notes are visible directly on the profile.

### 4. Squad Stats HUB
- **Complete Benchmarks**: Sortable table of all 2025 player statistics.
- **Deep Analytics**: Comparison of AF Scores, Rating Points, and traditional on-field metrics.

### 5. Team Builder (Tactical Planning)
- **Visual Field Map**: Drag-and-drop style selection for the 23-man squad.
- **Interchange & Consideration**: Sections for bench rotation and extended squad planning.
- **Position Notes**: Persistent coaching notes for specific tactical roles.

---

## 🩺 Health & Wellbeing

### 6. Injury Log
- **Medical Dashboard**: Master list of squad health status.
- **CRUD Operations**: Coaches can log new injuries, update severity, and clear players for selection.

### 7. Daily Check-In (Player Only)
- **Metric Sliders**: 1-10 scores for Sleep, Soreness, Mood, and Confidence.
- **Readiness Engine**: Automated calculation of daily training readiness.
- **Notes Field**: Direct feedback line to coaching staff (triggers dashboard alerts).

### 8. WOOP Goals
- **Scientific Goal Setting**: Wish, Outcome, Obstacle, Plan framework.
- **Engagement**: Track active and completed personal development goals.

---

## 📅 Squad Calendar
- **Weekly View**: Full-page calendar for team-wide scheduling.
- **Event Management**: Coaches can create sessions, weights, and rehab meetings.
- **Visual Coding**: Color-coded events (e.g., Royal Blue for Main Sessions, Red for Rehab).

---

## 🦘 KANGA.AI (Squad Agent)
- **Natural Language Query**: "Who had the lowest sleep?" or "Who is training best?".
- **BigQuery Integration**: Real-time data processing to answer coaching questions.
- **Accessible to All**: Full-screen chat interface for both roles.
