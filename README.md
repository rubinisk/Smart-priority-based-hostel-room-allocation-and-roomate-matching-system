# StayWise — Smart Hostel Booking & Intelligent Allocation System

**StayWise** is a full-stack college accommodation platform and DSA academic project. It features an automated, deterministic allocation engine powered by advanced data structures and algorithms, a 4-step student booking wizard, dynamic room sharing options, and a complete administrative console.

---

## 1. Advanced DSA Components

### A. Advanced Data Structure: Disjoint Set Union (DSU / Union-Find)
- **File**: `backend/dsu.py`
- **Core Operations**:
  - `find(x)`: Canonical set representative discovery with recursive **Path Compression**. Flattens tree structures directly to the root.
  - `union(x, y)`: Set union using **Union by Rank/Size**. Attaches the shallower tree to the deeper root to bound tree depth.
  - `connected(x, y)`: Constant-time component equivalence test.
  - `can_form_group(member_ids)`: Validates that candidate group members do not overlap with any existing multi-student components.
  - `rebuild_from_db(active_groups)`: Reconstructs DSU state when invitations are rejected, cancelled, or revised.
- **Time Complexity**: Amortized nearly constant time \(O(\alpha(N))\) per operation, where \(\alpha\) is the inverse Ackermann function (\(\alpha(N) < 5\) for all practical values of \(N\)).

### B. Advanced Algorithm: Priority-Based Greedy Heap Allocator
- **File**: `backend/allocation_engine.py`
- **Data Structure**: Python `heapq` (Min-Heap) as a deterministic Priority Queue.
- **Candidate Priority Key**:
  \[
  \text{Key} = (\text{capacity\_mismatch\_rank}, \text{submission\_timestamp}, \text{registration\_number})
  \]
  1. **Exact-Capacity Priority**: Rank `0` (Exact Match, e.g. 4 members in 4-sharing, 3 in 3-sharing, 2 in 2-sharing) outranks Rank `1` (Compatible Match, e.g. 2 members in 3- or 4-sharing).
  2. **First-Come-First-Served (FCFS)**: Server-generated submission timestamp orders candidates with equivalent capacity priority.
  3. **Deterministic Tie-Breaker**: Unique registration number (`SW-2026-XXXXX`).
  4. **Ranked Preferences**: Evaluates Preference 1 \(\rightarrow\) Preference 2 \(\rightarrow\) Preference 3.
  5. **Preferred Rooms & Floors**:
     - Preference 1 alone checks selected preferred room numbers first.
     - Preferred floor is prioritized. Alternate floors in the same hostel are considered **only** if the floor flexibility checkbox (*"I'm okay with another floor in this hostel"*) is checked.
  6. **Priority 5 Fallback**: If all 3 preferences fail, the algorithm searches all other active, eligible campus hostels matching gender and academic year with allowed sharing types.
  7. **Priority 6 Waitlisting**: If all options fail, the application is waitlisted with a recorded diagnostic reason.
  8. **Atomic Group Placement**: Confirmed groups are allocated together to the **same room** in one database transaction; groups are never split across rooms.
- **Complexity Analysis**:
  - Heap construction for \(A\) candidate applications: \(O(A \log A)\).
  - Candidate extraction: \(O(\log A)\) per pop.
  - Room searching across \(R\) inventory rooms: \(O(A \cdot R)\).
  - Total Time Complexity: \(O(A \log A + A \cdot R)\).
  - Space Complexity: \(O(A + R)\).

---

## 2. Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, React Router DOM.
- **Backend**: Python Flask REST API, Flask-SQLAlchemy, Flask-CORS, Flask-JWT-Extended, Werkzeug security.
- **Database**: SQLite with SQLAlchemy ORM models, transaction locking, and idempotent seeding.
- **Testing**: Python `pytest` test suite covering DSU, Heap Allocator, Authentication, and Workflow lifecycles.

---

## 3. Demo Accounts & Credentials

| Role | Roll Number / ID | Password | Access & Notes |
|---|---|---|---|
| **Student (Female)** | `CB.SC.U4CSE24001` | `student123` | Year 2 — Group Leader / Booking |
| **Student (Female)** | `CB.SC.U4CSE24002` | `student123` | Year 2 — Roommate Invite Acceptance |
| **Student (Female)** | `CB.SC.P2CSE25001` | `student123` | Year 1 — PG Scholar (M.Tech) |
| **Student (Male)** | `CB.SC.U4CSE24003` | `student123` | Year 2 — Male Hostel Booking |
| **Administrator** | `ADMIN` | `admin123` | Full Console & Allocation Engine |

*Note: Roll number inputs are case-insensitive (e.g. `cb.sc.u4cse24001` or `CB.SC.U4CSE24001`).*

---

## 4. 12 Seeded Campus Hostels

- **Girls' Hostels (4 Blocks)**:
  - Ananya Residence (2-sharing, 4-sharing)
  - Varnika Hall (3-sharing, 4-sharing)
  - Nila Residency (2-sharing)
  - Aarohi House (2-sharing, 3-sharing, 4-sharing)
- **Boys' Hostels (8 Blocks)**:
  - Arjun Residence (2-sharing, 3-sharing)
  - Vikram Hall (4-sharing)
  - Aditya Residency (2-sharing, 4-sharing)
  - Surya House (3-sharing, 4-sharing)
  - Kaveri Residence (2-sharing)
  - Vedant Hall (2-sharing, 3-sharing, 4-sharing)
  - Dhruv Residency (4-sharing)
  - Pranav House (2-sharing, 3-sharing, 4-sharing)

---

## 5. Running the Application Locally

Both servers run simultaneously:

### Terminal 1 — Backend Flask API (Port 5001)
```powershell
cd backend
python seed.py
python app.py
```
*Runs on `http://127.0.0.1:5001`*

### Terminal 2 — Frontend React App (Port 3000)
```powershell
cd frontend
npm run dev
```
*Access in browser at **`http://localhost:3000`***

---

## 6. Running Automated Tests

Run the complete test suite:

```powershell
python -m pytest backend/tests
```

**Test Coverage**:
- `test_dsu.py`: Path compression, union by rank, connectivity, overlap conflict detection, dynamic rebuilds.
- `test_allocation.py`: Exact-capacity priority over compatible matches, FCFS timestamp tie-breaking, no split groups.
- `test_auth.py`: Password hashing, roll number normalization, student lookup.
- `test_workflow.py`: Full invitation lifecycle, gender mismatch rejection, capacity validation.
- **Results**: **15 passed out of 15 tests (100% pass rate)**.

---

## 7. Deployment Guide

### Deploying the Frontend to Vercel
1. Go to [Vercel](https://vercel.com) and click **"Add New" > "Project"**.
2. Select your repository: `rubinisk/Smart-priority-based-hostel-room-allocation-and-roomate-matching-system`.
3. Configure the Project Settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `.` (Root) or `frontend`
   - If Root Directory is `.` (default): The included root `vercel.json` will automatically build `frontend` and serve `frontend/dist`.
   - If Root Directory is set to `frontend`: `frontend/vercel.json` handles all client-side routing rewrites.
4. Set Environment Variables in Vercel:
   - `VITE_API_BASE_URL`: URL of your deployed Python Flask backend (e.g. `https://your-staywise-backend.onrender.com/api` or `https://your-api.railway.app/api`).
5. Click **Deploy**. Vercel will build and publish the live React web application with a free SSL domain.

### Deploying the Backend (Render / Railway / Fly.io / PythonAnywhere)
1. Push this repository to GitHub.
2. Create a new Web Service pointing to `backend/`.
3. Set Build Command: `pip install -r requirements.txt`
4. Set Start Command: `gunicorn app:app` or `python app.py`
5. Seed initial data: Run `python seed.py` once to populate hostels, rooms, and students.
