# 🏙️ CivicSync

**A civic grievance redressal platform connecting citizens, field officers, and supervisors on one live system.**

CivicSync lets citizens report civic issues (potholes, garbage, streetlights, water leaks, etc.) with photo evidence and precise location tagging, tracks each complaint through its full lifecycle, and holds the responsible department accountable with SLA timers, escalations, and performance scorecards.

---

## ✨ Key Features

### For Citizens
- 📝 **File a grievance** with a photo, description, and auto-tagged department/category
- 📍 **Automatic location detection** — reverse geocodes GPS coordinates to city, district, and municipal ward
- 📧 **Email OTP verification** during signup for account security
- 🔎 **Track tickets** with a live status timeline (Filed → Assigned → In Progress → Resolved)
- 👍 **Upvote** grievances filed by others in your area to signal priority
- 🏢 **Browse by department** — see every open issue under Sanitation, Water Supply, Roads, Electricity, etc.
- 🔁 **Dispute a resolution** — reopen a ticket if the issue isn't actually fixed
- 🔔 **Real-time notifications** on status changes

### For Field Officers
- 📋 **Assigned ticket queue** with SLA deadlines clearly visible
- ✅ **Update ticket status** (Assigned → In Progress → Resolved)
- 📊 **Performance Scorecard** — total handled, SLA compliance %, reopened rate, and warning level
- 🔔 **Notifications** for new assignments and citizen disputes

### For Supervisors
- 🗺️ **Department-wide overview** of all tickets and officer workloads
- ⏰ **Automated SLA escalation** — an hourly job flags overdue tickets and notifies up the chain (officer → supervisor → higher authority) based on how badly the deadline was missed
- 📈 Visibility into officer performance across the team

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React Native (Expo 54, React 19), Expo Location, Expo Linear Gradient |
| **Backend** | Java 21, Spring Boot (Web MVC, Data JPA, Security, Mail, Scheduling) |
| **Database** | PostgreSQL with Hibernate Spatial (for storing/querying grievance coordinates) |
| **Auth** | Custom email/password + OTP verification, Google sign-up flow, Spring Security (BCrypt password hashing) |
| **Geocoding** | OpenStreetMap Nominatim (reverse geocoding for Indian administrative boundaries) |

---

## 📂 Project Structure

```
CivicSync/
├── Backend/                          # Spring Boot REST API
│   └── src/main/java/com/civicsync/CivicSync_Backend/
│       ├── controller/                # AuthController, GrievanceController,
│       │                              # OfficerGrievanceController, SupervisorController,
│       │                              # NotificationController
│       ├── service/                   # Business logic + SlaEscalationJob (scheduled)
│       ├── entity/                    # Grievance, User, Notification,
│       │                              # OfficerPerformanceMetrics, GrievanceUpvote
│       ├── repository/                # Spring Data JPA repositories
│       ├── dto/                       # Request/response payloads
│       └── config/                    # Security & app configuration
│
└── FrontEnd/                          # React Native (Expo) app
    └── src/
        ├── screens/
        │   ├── officer/                # Officer dashboard (tabs: queue, scorecard)
        │   ├── supervisor/              # Supervisor dashboard
        │   ├── GrievancesScreen.js      # "My Grievances" (citizen)
        │   ├── DepartmentsScreen.js      # Department directory
        │   ├── DepartmentFeedScreen.js   # Tickets filed under one department
        │   ├── RegisterScreen.js / LoginScreen.js
        │   └── NotificationsScreen.js
        ├── components/                  # NotificationBell, UpvoteButton, StatusProgressSteps...
        ├── context/AuthContext.js       # Auth/session state
        ├── api/api.js                   # All backend API calls
        └── styles/globalStyles.js
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Java 21 and Maven
- PostgreSQL (with PostGIS extension enabled, for `hibernate-spatial`)
- Expo Go app (for testing on a physical device) or an Android/iOS simulator

### 1. Backend Setup
```bash
cd Backend
# Configure your DB credentials, mail server, etc. in:
#   src/main/resources/application.properties
./mvnw spring-boot:run
```
The API will start on `http://localhost:8080`.

### 2. Frontend Setup
```bash
cd FrontEnd
npm install
```
Update the backend base URL to point at your machine's local IP (so a phone on the same Wi-Fi can reach it) in:
- `src/api/api.js`
- `src/screens/RegisterScreen.js`

```bash
npx expo start
```
Scan the QR code with Expo Go, or press `a` / `i` to launch on an emulator.

---

## 🔑 User Roles

| Role | Access |
|---|---|
| `CITIZEN` | File/track/upvote grievances, browse departments |
| `FIELD_OFFICER` | Manage assigned tickets, view personal scorecard |
| `SUPERVISOR` | Department-wide oversight, escalation visibility |

---

## 🎯 What Makes CivicSync Different

- **Accountability built in** — every ticket carries an SLA deadline; missed deadlines auto-escalate up the chain instead of silently piling up.
- **Location-aware from the start** — reverse geocoding maps a citizen's GPS position to the *correct* Indian administrative ward/district, not just raw coordinates.
- **Closed-loop resolution** — citizens confirm or dispute a resolution, so a ticket can't be marked "solved" and forgotten if the problem persists.
- **Officer performance is measurable** — SLA compliance and reopened-ticket rate are tracked automatically, not self-reported.

---

## 🛠️ Team / Hackathon Notes

_Add your team name, members, and hackathon track/theme here._
