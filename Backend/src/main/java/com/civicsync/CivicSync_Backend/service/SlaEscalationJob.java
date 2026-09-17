package com.civicsync.CivicSync_Backend.service;

import com.civicsync.CivicSync_Backend.entity.Grievance;
import com.civicsync.CivicSync_Backend.entity.OfficerPerformanceMetrics;
import com.civicsync.CivicSync_Backend.entity.User;
import com.civicsync.CivicSync_Backend.repository.GrievanceRepository;
import com.civicsync.CivicSync_Backend.repository.OfficerMetricsRepository;
import com.civicsync.CivicSync_Backend.repository.UserRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.List;

/**
 * ⏰ SLA ESCALATION JOB
 * Runs hourly. For every open ticket (not RESOLVED/CLOSED) whose slaDeadline has
 * passed, bumps escalationLevel and notifies people up the chain:
 *   - Level 1 (first breach): notify the assigned officer only.
 *   - Level 2+: also notify a supervisor (same department if one exists, else
 *     any supervisor) so a human can intervene.
 *   - Unassigned tickets (no officer — ward/dept had no seeded officer, the #1
 *     real risk called out in the architecture notes): notify supervisors
 *     immediately as "needs manual routing", since no officer will ever pick
 *     this up on their own.
 * Escalations are throttled to once per 24h per ticket via slaBreachNotifiedAt,
 * so a ticket that's been overdue for a week doesn't spam 168 notifications.
 */
@Component
public class SlaEscalationJob {

    private final GrievanceRepository grievanceRepository;
    private final OfficerMetricsRepository officerMetricsRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    private static final int MAX_ESCALATION_LEVEL = 3;

    public SlaEscalationJob(GrievanceRepository grievanceRepository,
                             OfficerMetricsRepository officerMetricsRepository,
                             UserRepository userRepository,
                             NotificationService notificationService) {
        this.grievanceRepository = grievanceRepository;
        this.officerMetricsRepository = officerMetricsRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    // Every hour, 5 minutes past, so it doesn't collide with the confirmation auto-close job.
    @Scheduled(cron = "0 5 * * * *")
    @Transactional
    public void escalateOverdueTickets() {
        ZonedDateTime now = ZonedDateTime.now();
        ZonedDateTime throttleCutoff = now.minusHours(24);

        List<Grievance> breached = grievanceRepository.findSlaBreachedTicketsNeedingEscalation(now, throttleCutoff);

        for (Grievance g : breached) {
            int newLevel = Math.min((g.getEscalationLevel() == null ? 0 : g.getEscalationLevel()) + 1, MAX_ESCALATION_LEVEL);
            g.setEscalationLevel(newLevel);
            g.setSlaBreachNotifiedAt(now);
            grievanceRepository.save(g);

            if (g.getAssignedOfficerId() != null) {
                handleAssignedOverdueTicket(g, newLevel);
            } else {
                handleUnassignedOverdueTicket(g);
            }
        }
    }

    private void handleAssignedOverdueTicket(Grievance g, int newLevel) {
        notificationService.notify(g.getAssignedOfficerId(), g.getId(), "ESCALATION",
                "SLA breached (level " + newLevel + "): " + g.getTicketNumber(),
                "\"" + g.getTitle() + "\" is past its SLA deadline and still " + g.getStatus() + ". Please act now.");

        OfficerPerformanceMetrics metrics = officerMetricsRepository.findByOfficerId(g.getAssignedOfficerId())
                .orElseGet(() -> {
                    OfficerPerformanceMetrics m = new OfficerPerformanceMetrics();
                    m.setOfficerId(g.getAssignedOfficerId());
                    return m;
                });
        metrics.setMissedSlaCount(metrics.getMissedSlaCount() + 1);
        if (newLevel >= 2) {
            metrics.setWarningLevel(metrics.getWarningLevel() + 1);
        }
        officerMetricsRepository.save(metrics);

        if (newLevel >= 2) {
            for (User supervisor : findSupervisorsFor(g.getDepartmentId())) {
                notificationService.notify(supervisor.getId(), g.getId(), "ESCALATION",
                        "Officer missing SLA (level " + newLevel + "): " + g.getTicketNumber(),
                        "\"" + g.getTitle() + "\" has breached SLA " + newLevel + " time(s) under the assigned officer. May need reassignment.");
            }
        }
    }

    private void handleUnassignedOverdueTicket(Grievance g) {
        for (User supervisor : findSupervisorsFor(g.getDepartmentId())) {
            notificationService.notify(supervisor.getId(), g.getId(), "ESCALATION",
                    "Unassigned & overdue: " + g.getTicketNumber(),
                    "\"" + g.getTitle() + "\" has no field officer assigned (ward/department has no matching officer seeded) and is now past its SLA deadline. Needs manual routing.");
        }
    }

    private List<User> findSupervisorsFor(Integer departmentId) {
        List<User> deptSupervisors = departmentId != null
                ? userRepository.findByRoleAndDepartmentId("SUPERVISOR", departmentId)
                : List.of();
        if (!deptSupervisors.isEmpty()) {
            return deptSupervisors;
        }
        // Fall back to any supervisor so an overdue/unassigned ticket is never silently dropped.
        return userRepository.findByRole("SUPERVISOR");
    }
}
