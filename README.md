# 🏨 StayWise — Smart Priority-Based Hostel Room Allocation & Roommate Matching System

A full-stack, production-ready college accommodation management platform and academic Data Structures & Algorithms (DSA) project. StayWise combines an intelligent, deterministic allocation engine powered by advanced data structures with a modern 4-step student booking wizard, dynamic room sharing options, and a comprehensive administrative control dashboard.

---

### 🌐 Live Cloud Deployment
* 🚀 **Interactive Web Application (Vercel):** **[https://smart-priority-based-hostel-room-al.vercel.app/](https://smart-priority-based-hostel-room-al.vercel.app/)**
* ⚙️ **Production REST API (Render):** **[https://smart-priority-based-hostel-room.onrender.com/](https://smart-priority-based-hostel-room.onrender.com/)**

---

## 👥 Team Contributions & DSA Architecture

The system is architected around 4 distinct Data Structures & Algorithms paradigms matching college evaluation criteria:

```
[Student Registration & B-Tree Schema] ──> [Roommate Clustering (DSU)] ──> [Candidate Ranking (Min-Heap)] ──> [Greedy Allocation Engine]
```

| Member | Module & Role | DSA Paradigms | Key Contributed Files |
| :--- | :--- | :--- | :--- |
| **Midhuna** | **Database Architecture & Roll Number System** | **B-Tree Database Indexing** ($\mathcal{O}(\log N)$), Schema Constraints, Deterministic Regex Tokenization | `backend/models.py`<br>`backend/roll_number_service.py`<br>`backend/routes/auth_routes.py`<br>`backend/tests/test_hostel_inventory.py`<br>`backend/tests/test_roll_number_system.py` |
| **Rubini** | **Roommate Clustering & Group Matching** | **Disjoint Set Union (DSU / Union-Find)** with Path Compression & Union by Rank ($\mathcal{O}(\alpha(N))$) | `backend/dsu.py`<br>`backend/routes/student_routes.py`<br>`backend/tests/test_dsu.py`<br>`backend/tests/test_workflow.py` |
| **Kanishka** | **Candidate Priority Ranking & Timers** | **Binary Min-Heap (`heapq`) Priority Queue**, Hash Maps ($\mathcal{O}(1)$ preference lookups) | `backend/app.py`<br>`backend/config.py`<br>`backend/scheduler.py`<br>`backend/routes/payment_routes.py`<br>`backend/tests/test_allocation.py` |
| **Kavyashree** | **Room Placement & Admin Management** | **Greedy Allocation Algorithm**, Atomic Group Placement, Constraint Satisfaction | `backend/allocation_engine.py`<br>`backend/routes/admin_routes.py`<br>`backend/tests/test_application_lifecycle.py` |

---

## 🎯 Deep Dive: DSA Implementations

### 1. Disjoint Set Union (DSU / Union-Find) — Roommate Clustering
* **Implementation:** `backend/dsu.py`, `backend/routes/student_routes.py`
* **Core Functions:**
  * `find(x)`: Canonical representative discovery with recursive **Path Compression**. Directly flattens the tree structure to the root node.
  * `union(x, y)`: Set union using **Union by Rank / Size**. Attaches the shallower tree root under the deeper tree root to prevent degenerate linked lists.
  * `connected(x, y)`: Rapid component equivalence check.
  * `can_form_group(member_ids, max_group_size=4)`: Validates that candidate groups do not exceed capacity and do not overlap with any existing confirmed groups.
  * `rebuild_from_db(active_groups)`: Reconstructs the in-memory DSU state dynamically from the database when invitations are cancelled or students leave groups.
* **Complexity:** Amortized nearly constant time $\mathcal{O}(\alpha(N))$ per operation, where $\alpha$ is the Inverse Ackermann function ($\alpha(N) \le 4$ for all practical universe sizes).

### 2. Priority Queue / Min-Heap — Candidate Ranking & Scheduling
* **Implementation:** `backend/allocation_engine.py`, `backend/scheduler.py`
* **Data Structure:** Python `heapq` (Binary Min-Heap).
* **Priority Key Tuple:**
  $$\text{Key} = (\text{capacity\_mismatch\_rank}, \text{submission\_timestamp}, \text{registration\_number})$$
  1. **Exact-Capacity Priority:** Rank `0` (Exact match: e.g. 4 students in 4-sharing) strictly outranks Rank `1` (Compatible match: e.g. 2 students placed in 4-sharing).
  2. **First-Come-First-Served (FCFS):** High-precision server submission timestamp orders candidates with equivalent capacity rank.
  3. **Deterministic Tie-Breaker:** Unique registration number (`SW-2026-XXXXX`).
  4. **Multi-Tier Preferences:** Evaluates Preference 1 $\rightarrow$ Preference 2 $\rightarrow$ Preference 3.
  5. **Floor Flexibility:** Preferred floor is checked first; alternate floors in the hostel are evaluated only if `flex_floor` is enabled.
* **Background Scheduler (`scheduler.py`):** APScheduler triggers automated allocation rounds and monitors payment deadline countdowns.

### 3. Greedy Algorithm — Room Placement & Atomic Placement
* **Implementation:** `backend/allocation_engine.py`, `backend/routes/admin_routes.py`
* **Greedy Choice Property:** Iteratively extracts the top-priority candidate from the heap and assigns the optimal matching room available in inventory.
* **Atomic Group Placement Guarantee:** Confirmed roommate groups are treated as indivisible single units; roommates are guaranteed to never be split across separate rooms.
* **Fallback Strategy:** If top preferences are full, searches all eligible campus hostels matching gender and academic year before placing applicants on a waitlist.
* **Admin Controls:** Endpoints for live allocation triggering, inventory management, room overrides, and analytics.

### 4. B-Tree Database Indexing & Relational Schema
* **Implementation:** `backend/models.py`, `backend/roll_number_service.py`
* **B-Tree Indexing:** High-performance B-Tree indexes on foreign keys and primary lookups (`registration_number`, `room_id`, `hostel_id`), reducing search queries from $\mathcal{O}(N)$ table scans to $\mathcal{O}(\log N)$.
* **VIT/Amrita Roll Number Standard:** Deterministic parser supporting campus, school, degree level, batch year, section digit, and sequence counter:
  $$\text{Pattern: } \texttt{CB.SC.U4CSE24001} \implies \text{Campus: CB, School: SC, Level: U4, Branch: CSE, Year: 2024, Sec: A, Seq: 01}$$

---

## 🛠️ Technology Stack

* **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, React Router DOM, Axios.
* **Backend:** Python 3.10+, Flask REST API, Flask-SQLAlchemy, Flask-CORS, Flask-JWT-Extended, APScheduler, Gunicorn.
* **Database:** SQLite / PostgreSQL with SQLAlchemy ORM, transaction isolation, and foreign key cascades.
* **Testing:** Python `pytest` test suite with 35 comprehensive test cases.
* **Cloud Infrastructure:** Vercel (Frontend SPA Hosting), Render (Dockerized Backend Web Service).

---

## 🏢 Hostel Inventory (13 Campus Blocks, 5,200 Rooms)

* **Girls' Hostels (5 Blocks):**
  * Mythreyi Bhavanam (2-sharing, 4-sharing)
  * Gargi Bhavanam (3-sharing, 4-sharing)
  * Ananya Residence (2-sharing, 4-sharing)
  * Varnika Hall (3-sharing, 4-sharing)
  * Aarohi House (2-sharing, 3-sharing, 4-sharing)
* **Boys' Hostels (8 Blocks):**
  * Agastya Bhavanam (2-sharing, 3-sharing, 4-sharing)
  * Kapila Bhavanam (1-sharing, 2-sharing — PG & Research Scholars)
  * Arjun Residence (2-sharing, 3-sharing)
  * Vikram Hall (4-sharing)
  * Aditya Residency (2-sharing, 4-sharing)
  * Surya House (3-sharing, 4-sharing)
  * Vedant Hall (2-sharing, 3-sharing, 4-sharing)
  * Dhruv Residency (4-sharing)

---

## 🔑 Demo Accounts & Sample Logins

The database includes **163 pre-seeded student accounts** (81 female, 82 male) and 1 Administrator account:

| Role | Roll Number | Password | Details |
| :--- | :--- | :--- | :--- |
| **Administrator** | `ADMIN` | `admin123` | Full Admin Console & Allocation Engine |
| **Student (Female - Year 3)** | `CB.SC.U4CSE24001` | `student123` | Ananya Sharma (Group Leader Demo) |
| **Student (Female - Year 3)** | `CB.SC.U4CSE24002` | `student123` | Riya Patel (Roommate Accept Demo) |
| **Student (Male - Year 3)** | `CB.SC.U4CSE24003` | `student123` | Aarav Gupta (Male Hostel Demo) |
| **Student (Male - Year 3)** | `CB.SC.U4CSE24004` | `student123` | Rohan Kumar (Male Roommate Demo) |
| **Student (Female - Year 2)** | `CB.SC.U4CSE25001` | `student123` | Meera Krishnan |
| **Student (PG Scholar - M.Tech)** | `CB.SC.P2CSE25001` | `student123` | Priya Singh (PG Hostel Booking) |
| **150+ Additional Students** | `CB.SC.U4CSE24201` – `CB.SC.U4CSE25325` | `student123` | Diverse student pool across branches & years |

*Note: Roll number input is case-insensitive (e.g. `cb.sc.u4cse24001` or `CB.SC.U4CSE24001`).*

---

## 💻 Running Locally

### 1. Backend Setup (Flask API)
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python seed.py
python app.py
```
*API runs locally at `http://127.0.0.1:5001`*

### 2. Frontend Setup (React + Vite)
```powershell
cd frontend
npm install
npm run dev
```
*Web app runs locally at `http://localhost:3000`*

---

## 🧪 Automated Unit & Integration Tests

Execute the full automated test suite using `pytest`:

```powershell
python -m pytest backend/tests -v
```

### Test Suite Results:
```text
======================= 35 passed in 141.30s (0:02:21) =======================
```
* **DSU Tests (`test_dsu.py`):** Path compression verification, union by rank, group overlap conflict detection, and dynamic DB rebuilds.
* **Allocation Tests (`test_allocation.py`):** Exact vs compatible priority ordering, FCFS timestamp tie-breaking, and atomic group placement.
* **Hostel Inventory Tests (`test_hostel_inventory.py`):** Room and bed count integrity across all 13 hostels, PG scholar restrictions, and idempotent seeding.
* **Roll Number System Tests (`test_roll_number_system.py`):** Regex parsing, 8-section CSE core capacity boundaries, and atomic sequence generation.
* **Auth Tests (`test_auth.py`):** Password hashing, case-insensitive roll number lookup, JWT validation.
* **Lifecycle Tests (`test_application_lifecycle.py`, `test_workflow.py`):** Full multi-student roommate booking and allocation workflows.
* **Pass Rate:** **35 passed out of 35 tests (100% pass rate)**.
