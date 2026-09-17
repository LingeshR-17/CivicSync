// 🖥️ Your active working computer IP configuration
const SERVER_ORIGIN = "http://192.168.0.4:8080"; // Replace with your actual local IP address and port
const BASE_URL = "http://192.168.0.4:8080/api/grievances";
const AUTH_URL = "http://192.168.0.4:8080/api/auth";
const OFFICER_URL = "http://192.168.0.4:8080/api/v1/officer";
const SUPERVISOR_URL = "http://192.168.0.4:8080/api/v1/supervisor";

/**
 * 🖼️ Resolves a relative media path (e.g. "/uploads/images/xyz.jpg") returned by
 * the backend into an absolute URL the React Native <Image>/<Video> tags can load.
 */
function getMediaUrl(relativePath) {
  if (!relativePath) return null;
  if (relativePath.startsWith("http")) return relativePath;
  return `${SERVER_ORIGIN}${relativePath}`;
}

/**
 * 📬 FETCH ALL COMPLAINTS FROM THE JAVA BACKEND
 */
async function fetchGrievances(citizenId) {
  try {
    // 🎯 Pass citizenId so the backend can flag which grievances this user already upvoted
    const url = citizenId ? `${BASE_URL}?citizenId=${citizenId}` : BASE_URL;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching live grievances:", error);
    return [];
  }
}

/**
 * 📩 SUBMIT A NEW COMPLAINT TO THE JAVA BACKEND (With Multipart Image & Video Support)
 */
async function createGrievance(formData) {
  try {
    // 🎯 FIX: Hits BASE_URL directly to map perfectly with @PostMapping in your GrievanceController.java
    // Do not manually add a "Content-Type" header; Fetch auto-generates multi-part boundaries.
    const response = await fetch(BASE_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error creating live grievance with media assets:", error);
    throw error;
  }
}

/**
 * ❤️ TOGGLE UPVOTE STATUS PERMANENTLY IN POSTGRES DB
 */
async function toggleUpvote(id, citizenId) {
  try {
    const response = await fetch(
      `${BASE_URL}/${id}/upvote?citizenId=${citizenId}`,
      {
        method: "POST",
      },
    );

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error updating database upvote metric transaction:", error);
    throw error;
  }
}

/**
 * 🔑 REGISTER USER VIA EMAIL & PASSWORD (Unified to use Fetch)
 */
async function registerCitizen(userPayload) {
  try {
    const response = await fetch(`${AUTH_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userPayload),
    });

    return await response.json();
  } catch (error) {
    console.error("API Registration Error:", error);
    return { error: "Cannot connect to backend verification server" };
  }
}

/**
 * 🔐 LOGIN USER VIA EMAIL & PASSWORD
 */
async function loginCitizen(email, password) {
  try {
    const response = await fetch(`${AUTH_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return await response.json();
  } catch (error) {
    console.error("Login failed:", error);
    return { error: "Network error. Check server status." };
  }
}

/**
 * 🌐 GOOGLE SIGN-IN INTEGRATION
 */
async function loginWithGoogleBackend(name, email, googleId) {
  try {
    const response = await fetch(`${AUTH_URL}/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, googleId }),
    });
    return await response.json();
  } catch (error) {
    console.error("Google authentication failed:", error);
    return { error: "Failed to authenticate Google user." };
  }
}

/**
 * 👮 FETCH ACTIVE TASKS ASSIGNED TO THE LOGGED-IN FIELD OFFICER
 */
async function fetchAssignedTasks(officerId) {
  try {
    const response = await fetch(`${OFFICER_URL}/grievances/assigned?officerId=${officerId}`);
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching officer's assigned tasks:", error);
    throw error;
  }
}

/**
 * 🗂️ FETCH RESOLVED / CLOSED HISTORY LOGS FOR THE OFFICER
 */
async function fetchOfficerHistory(officerId) {
  try {
    const response = await fetch(`${OFFICER_URL}/grievances/history?officerId=${officerId}`);
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching officer's history logs:", error);
    throw error;
  }
}

/**
 * 📊 FETCH PERFORMANCE SCORECARD FOR THE OFFICER
 */
async function fetchOfficerScorecard(officerId) {
  try {
    const response = await fetch(`${OFFICER_URL}/scorecard?officerId=${officerId}`);
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching officer's scorecard:", error);
    throw error;
  }
}

/**
 * ✅ UPDATE A GRIEVANCE'S STATUS (e.g. mark resolved) AS THE ASSIGNED OFFICER
 */
async function updateGrievanceStatus(grievanceId, officerId, status, closureNotes, completionProofFile) {
  try {
    const formData = new FormData();
    formData.append("status", status);
    if (closureNotes) {
      formData.append("closure_notes", closureNotes);
    }
    if (completionProofFile) {
      formData.append("completionProof", completionProofFile);
    }

    const response = await fetch(
      `${OFFICER_URL}/grievances/${grievanceId}/status?officerId=${officerId}`,
      {
        method: "PUT",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    return true;
  } catch (error) {
    console.error("Error updating grievance status:", error);
    throw error;
  }
}

/**
 * ✅ CITIZEN CONFIRMATION LOOP: citizen taps "Yes, fixed" or "No, not fixed"
 * on a RESOLVED ticket. confirmed=false can carry an optional note explaining why.
 */
async function confirmResolution(grievanceId, citizenId, confirmed, note) {
  try {
    const params = new URLSearchParams({
      citizenId: String(citizenId),
      confirmed: String(confirmed),
    });
    if (note) params.append("note", note);

    const response = await fetch(
      `${BASE_URL}/${grievanceId}/confirm-resolution?${params.toString()}`,
      { method: "POST" },
    );

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error confirming resolution:", error);
    throw error;
  }
}

const NOTIFICATIONS_URL = `${SERVER_ORIGIN}/api/notifications`;

/**
 * 🔔 FETCH IN-APP NOTIFICATIONS for a user (citizen or officer id).
 */
async function fetchNotifications(userId) {
  try {
    const response = await fetch(`${NOTIFICATIONS_URL}?userId=${userId}`);
    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
}

async function fetchUnreadNotificationCount(userId) {
  try {
    const response = await fetch(`${NOTIFICATIONS_URL}/unread-count?userId=${userId}`);
    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    const data = await response.json();
    return data.unreadCount || 0;
  } catch (error) {
    console.error("Error fetching unread notification count:", error);
    return 0;
  }
}

async function markAllNotificationsRead(userId) {
  try {
    await fetch(`${NOTIFICATIONS_URL}/read-all?userId=${userId}`, { method: "PUT" });
  } catch (error) {
    console.error("Error marking notifications read:", error);
  }
}

/**
 * 🧭 SUPERVISOR: fetch tickets the auto-routing engine couldn't place
 * (no field officer seeded for that ward/department).
 */
async function fetchUnassignedTickets() {
  try {
    const response = await fetch(`${SUPERVISOR_URL}/grievances/unassigned`);
    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching unassigned tickets:", error);
    return [];
  }
}

/**
 * 🧭 SUPERVISOR: fetch tickets that have breached SLA or been rejected
 * by the citizen (escalationLevel > 0).
 */
async function fetchEscalatedTickets() {
  try {
    const response = await fetch(`${SUPERVISOR_URL}/grievances/escalated`);
    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching escalated tickets:", error);
    return [];
  }
}

/**
 * 🧭 SUPERVISOR: fetch candidate field officers for a ticket's ward + department,
 * sorted by current workload (lowest first).
 */
async function fetchOfficerOptions(grievanceId) {
  try {
    const response = await fetch(`${SUPERVISOR_URL}/grievances/${grievanceId}/officer-options`);
    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching officer options:", error);
    return [];
  }
}

/**
 * 🧭 SUPERVISOR: manually route a ticket to a chosen officer.
 */
async function assignOfficerToGrievance(grievanceId, officerId, supervisorId) {
  try {
    const params = new URLSearchParams({
      officerId: String(officerId),
      supervisorId: String(supervisorId),
    });
    const response = await fetch(
      `${SUPERVISOR_URL}/grievances/${grievanceId}/assign?${params.toString()}`,
      { method: "PUT" },
    );
    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error assigning officer:", error);
    throw error;
  }
}

/**
 * 🧭 SUPERVISOR: quick summary counts for the overview tab.
 */
async function fetchSupervisorOverview() {
  try {
    const response = await fetch(`${SUPERVISOR_URL}/overview`);
    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching supervisor overview:", error);
    return { unassignedCount: 0, escalatedCount: 0, openTicketCount: 0 };
  }
}

// 📦 Unified Clean Exports Block (No duplicates!)
export {
  fetchGrievances,
  createGrievance,
  toggleUpvote,
  registerCitizen,
  loginCitizen,
  loginWithGoogleBackend,
  fetchAssignedTasks,
  fetchOfficerHistory,
  fetchOfficerScorecard,
  updateGrievanceStatus,
  getMediaUrl,
  confirmResolution,
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  fetchUnassignedTickets,
  fetchEscalatedTickets,
  fetchOfficerOptions,
  assignOfficerToGrievance,
  fetchSupervisorOverview,
};
