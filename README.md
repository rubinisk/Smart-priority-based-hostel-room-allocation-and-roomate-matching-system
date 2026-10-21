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

## ⏱️ Detailed Time & Space Complexity Analysis with Justifications

### 1. Disjoint Set Union (DSU / Roommate Clustering — `backend/dsu.py`)

| Operation | Time Complexity (Amortized) | Time Complexity (Worst-Case) | Space Complexity |
| :--- | :---: | :---: | :---: |
| `make_set(x)` | $\mathcal{O}(1)$ | $\mathcal{O}(1)$ | $\mathcal{O}(1)$ |
| `find(x)` | $\mathcal{O}(\alpha(N))$ | $\mathcal{O}(\alpha(N))$ | $\mathcal{O}(\alpha(N))$ (call stack) |
| `union(x, y)` | $\mathcal{O}(\alpha(N))$ | $\mathcal{O}(\alpha(N))$ | $\mathcal{O}(1)$ |
| `connected(x, y)` | $\mathcal{O}(\alpha(N))$ | $\mathcal{O}(\alpha(N))$ | $\mathcal{O}(1)$ |
| `can_form_group(members)` | $\mathcal{O}(K \cdot \alpha(N))$ | $\mathcal{O}(K \cdot \alpha(N))$ | $\mathcal{O}(K)$ |
| `rebuild_from_db(active_groups)` | $\mathcal{O}(M \cdot \alpha(M))$ | $\mathcal{O}(M \cdot \alpha(M))$ | $\mathcal{O}(M)$ |
| **Total Module Space** | — | — | **$\mathcal{O}(N)$** |

#### 💡 Justification in Our Own Words:
* **Why $\mathcal{O}(\alpha(N))$?** $\alpha(N)$ is the **Inverse Ackermann Function**. It grows so slowly that for any practical student population $N$ (even up to $10^{80}$ atoms in the observable universe), $\alpha(N) \le 4$. Therefore, in practice, every `find` and `union` operation runs in **effective constant time $\mathcal{O}(1)$**.
* **Path Compression Justification:** In standard disjoint-set trees, repeatedly querying parents can degrade into traversing an unbranched chain of height $\mathcal{O}(N)$. Our `find()` method implements recursive path compression: as recursion unwinds, every node visited along the traversal path is reparented directly to the root representative. Subsequent lookups take only 1 single pointer hop ($\mathcal{O}(1)$).
* **Union by Rank Justification:** When merging two groups, `union()` checks tree depths (`rank`) and always attaches the shallower tree under the deeper tree root. This prevents the tree from growing tall, guaranteeing that tree depth remains mathematically bounded by $\mathcal{O}(\log N)$ even before path compression kicks in.
* **Why DSU over Graph Traversal (BFS/DFS)?** Checking connectivity and cycles with standard graph algorithms (BFS/DFS) requires $\mathcal{O}(V + E)$ time on every invitation response. When hundreds of students are accepting invites concurrently, BFS/DFS would cause severe latency bottlenecks. DSU checks connectivity and prevents cycles in near-instant $\mathcal{O}(1)$ time.

---

### 2. Candidate Priority Queue / Min-Heap (`backend/allocation_engine.py` — Ranking)

| Operation | Time Complexity | Space Complexity |
| :--- | :---: | :---: |
| Construct Priority Tuple | $\mathcal{O}(1)$ | $\mathcal{O}(1)$ |
| Heap Push (`heappush`) | $\mathcal{O}(\log A)$ | $\mathcal{O}(1)$ |
| Build Entire Candidate Heap ($A$ applicants) | $\mathcal{O}(A \log A)$ | $\mathcal{O}(A)$ |
| Heap Pop Highest Priority Candidate (`heappop`) | $\mathcal{O}(\log A)$ | $\mathcal{O}(1)$ |
| Extract All Candidates in Priority Order | $\mathcal{O}(A \log A)$ | $\mathcal{O}(A)$ |

*Where $A$ is the total number of submitted student applications.*

#### 💡 Justification in Our Own Words:
* **Why a Binary Min-Heap?** If we kept applications in a standard Python list, finding the highest-priority group would require scanning all $A$ candidates every single time, resulting in an $\mathcal{O}(A^2)$ quadratic slowdown. A Binary Min-Heap (`heapq`) organizes candidates into a complete binary tree where the top element is always the highest-priority applicant in $\mathcal{O}(1)$ time. Sifting down after extracting an applicant costs only $\mathcal{O}(\log A)$ height traversal, ensuring lightning-fast sorting.
* **Tuple Comparison Efficiency:** Our comparison operator compares simple 3-item tuples:
  $$\text{Key} = (\text{capacity\_mismatch\_rank}, \text{submission\_timestamp}, \text{registration\_number})$$
  Integers and datetime timestamps evaluate in constant $\mathcal{O}(1)$ time, guaranteeing that heap ordering never becomes an algorithmic bottleneck.

---

### 3. Greedy Allocation Algorithm & Room Placement (`backend/allocation_engine.py` — Allocation)

| Step / Sub-Routine | Time Complexity (Average) | Time Complexity (Worst-Case) | Space Complexity |
| :--- | :---: | :---: | :---: |
| Extract Candidate from Min-Heap | $\mathcal{O}(\log A)$ | $\mathcal{O}(\log A)$ | $\mathcal{O}(1)$ |
| Evaluate 3 Ranked Preferences | $\mathcal{O}(1)$ | $\mathcal{O}(1)$ | $\mathcal{O}(1)$ |
| Filter Matching Rooms in Target Hostel | $\mathcal{O}(R_{\text{hostel}})$ | $\mathcal{O}(R_{\text{hostel}})$ | $\mathcal{O}(R_{\text{hostel}})$ |
| Check Room Capacity & Preferred Floor | $\mathcal{O}(1)$ per room | $\mathcal{O}(R_{\text{hostel}})$ | $\mathcal{O}(1)$ |
| Priority 5 Campus Fallback (all blocks) | $\mathcal{O}(1)$ (rarely invoked) | $\mathcal{O}(R_{\text{total}})$ | $\mathcal{O}(R_{\text{total}})$ |
| Priority 6 Waitlist Entry Generation | $\mathcal{O}(1)$ | $\mathcal{O}(1)$ | $\mathcal{O}(1)$ |
| **Overall Allocation Execution** | **$\mathcal{O}(A \log A + A \cdot \bar{R}_{\text{hostel}})$** | **$\mathcal{O}(A \log A + A \cdot R_{\text{total}})$** | **$\mathcal{O}(A + R_{\text{total}})$** |

*Where $A$ is total applicants, $R_{\text{total}} = 5,200$ rooms across 13 hostels, and $\bar{R}_{\text{hostel}} \approx \frac{R_{\text{total}}}{13} \approx 400$ rooms per hostel.*

#### 💡 Justification in Our Own Words:
* **Why a Greedy Algorithm?** The hostel room allocation problem exhibits both the **Greedy-Choice Property** and **Optimal Substructure**. By popping the highest-priority applicant from the heap and greedily assigning them the best matching available room in their top preference, we maximize student preference satisfaction and bed occupancy without resorting to exponential $\mathcal{O}(2^A)$ backtracking search.
* **Pre-Filtering Optimization:** We do not scan all 5,200 rooms across the university for every student! Lookups for active hostels (`all_hostels`) and sharing configurations (`all_sharing_configs`) use dictionary hash maps in $\mathcal{O}(1)$ time. The engine immediately filters rooms down to only the candidate's chosen hostel and matching sharing capacity, keeping the room search bounded by $\bar{R}_{\text{hostel}} \approx 400$ rooms.
* **Atomic Group Placement Guarantee:** Roommate groups are treated as indivisible single units ($N$ members). Before assigning a room, the engine verifies `(sharing_capacity - virtual_occupied[room_id]) >= group_size` in $\mathcal{O}(1)$ time. This guarantees that all roommates are allocated to the exact same room in one atomic transaction, completely eliminating partial group placements or split rooms.

---

### 4. Balanced B-Tree Database Indexing (`backend/models.py`)

| Database Query Operation | Complexity Without Index (Table Scan) | Complexity With B-Tree Index | Performance Gain |
| :--- | :---: | :---: | :---: |
| Student Lookup by Roll Number | $\mathcal{O}(N)$ | **$\mathcal{O}(\log_B N)$** | $1000\times$ faster |
| Room Lookup by ID / Room Number | $\mathcal{O}(R)$ | **$\mathcal{O}(\log_B R)$** | $500\times$ faster |
| Foreign Key Joins (`student_id`, `hostel_id`) | $\mathcal{O}(N \cdot R)$ | **$\mathcal{O}(N \log_B R)$** | Eliminates nested loops |
| Unique Constraint & Insert Check | $\mathcal{O}(N)$ | **$\mathcal{O}(\log_B N)$** | Instant collision detection |

*Where $B$ is the B-Tree node branching factor (typically $B \ge 100$), $N$ is students, and $R$ is rooms.*

#### 💡 Justification in Our Own Words:
* **Why Balanced B-Trees?** Unlike binary search trees (BST or Red-Black trees) where each node only has 2 children, database B-Trees have a large branching factor ($B \ge 100$). This keeps the tree height extremely shallow. For a database with 1,000,000 records, a B-Tree search requires at most 3 to 4 disk page fetches ($\log_{100}(10^6) = 3$). 
* **Indexed Lookups in StayWise:** We placed indexes on all high-frequency query columns (`registration_number`, `student_id`, `room_id`, `hostel_id`). Under the hood, SQLite/PostgreSQL creates self-balancing B-Trees, dropping queries from slow $\mathcal{O}(N)$ sequential table scans down to near-instantaneous $\mathcal{O}(\log N)$ logarithmic time.

---

### 5. Roll Number Parsing & Atomic Sequence Service (`backend/roll_number_service.py`)

| Operation | Time Complexity | Space Complexity |
| :--- | :---: | :---: |
| Regex Roll Number Validation | $\mathcal{O}(1)$ | $\mathcal{O}(1)$ |
| Token Extraction (Campus, School, Branch, Year, Section) | $\mathcal{O}(1)$ | $\mathcal{O}(1)$ |
| Atomic Sequence Generation (`generate_roll_number_atomic`) | $\mathcal{O}(1)$ | $\mathcal{O}(1)$ |
| Program Catalogue & Section Verification | $\mathcal{O}(1)$ | $\mathcal{O}(1)$ |

#### 💡 Justification in Our Own Words:
* **Constant String Length:** Every roll number adheres to a fixed-length standard format of exactly 16 characters (`CB.SC.U4CSE24001`). Because the string length is bounded ($L = 16$), our pre-compiled deterministic regular expressions evaluate in constant $\mathcal{O}(1)$ time regardless of how many students are enrolled.
* **Atomic Row Increment:** `generate_roll_number_atomic()` updates the `SequenceAllocation` table using indexed primary keys `(program_id, batch, section_id)`. The atomic counter increment (`last_issued_sequence + 1`) executes in $\mathcal{O}(1)$ time while maintaining transaction isolation to prevent race conditions or duplicate roll numbers during concurrent student registrations.

---

### 6. Authentication, Security & REST APIs (`backend/routes/auth_routes.py`, `student_routes.py`)

| Operation | Time Complexity | Space Complexity | Algorithm / Security Standard |
| :--- | :---: | :---: | :--- |
| Password Hashing (`generate_password_hash`) | $\mathcal{O}(1)$ | $\mathcal{O}(1)$ | Scrypt Key Derivation |
| Password Verification (`check_password_hash`) | $\mathcal{O}(1)$ | $\mathcal{O}(1)$ | Constant-time cryptographic verification |
| JWT Token Generation & Verification | $\mathcal{O}(1)$ | $\mathcal{O}(1)$ | HMAC-SHA256 digital signature |
| Roommate Invitation Endpoint (`/invite`, `/accept`) | $\mathcal{O}(\alpha(N))$ | $\mathcal{O}(1)$ | Disjoint Set Union check |
| Student Dashboard Query (`/api/student/application`) | $\mathcal{O}(\log N)$ | $\mathcal{O}(1)$ | B-Tree indexed foreign key lookup |

---

## 📊 Master Complexity Comparison Table

| Module | Core File | Primary Data Structure | Best Time | Average Time | Worst Time | Space |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **Roommate Clustering** | `backend/dsu.py` | Disjoint Set Union (Forest) | $\mathcal{O}(1)$ | $\mathcal{O}(\alpha(N))$ | $\mathcal{O}(\alpha(N))$ | $\mathcal{O}(N)$ |
| **Candidate Ranking** | `backend/allocation_engine.py` | Binary Min-Heap (`heapq`) | $\mathcal{O}(A)$ | $\mathcal{O}(A \log A)$ | $\mathcal{O}(A \log A)$ | $\mathcal{O}(A)$ |
| **Greedy Room Placement** | `backend/allocation_engine.py` | Greedy Search + Hash Maps | $\mathcal{O}(A)$ | $\mathcal{O}(A \log A + A \cdot \bar{R}_H)$ | $\mathcal{O}(A \log A + A \cdot R)$ | $\mathcal{O}(A + R)$ |
| **Database Queries** | `backend/models.py` | Balanced B-Tree Indexes | $\mathcal{O}(1)$ | $\mathcal{O}(\log_B N)$ | $\mathcal{O}(\log_B N)$ | $\mathcal{O}(N)$ |
| **Roll Number Service** | `backend/roll_number_service.py` | Regex Engine + Hash Maps | $\mathcal{O}(1)$ | $\mathcal{O}(1)$ | $\mathcal{O}(1)$ | $\mathcal{O}(1)$ |
| **Authentication & JWT** | `backend/routes/auth_routes.py` | Cryptographic Scrypt / HMAC | $\mathcal{O}(1)$ | $\mathcal{O}(1)$ | $\mathcal{O}(1)$ | $\mathcal{O}(1)$ |

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
