package com.civicsync.CivicSync_Backend.service;

import com.civicsync.CivicSync_Backend.entity.Grievance;
import com.civicsync.CivicSync_Backend.repository.GrievanceRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.List;

/**
 * ⏰ Closes the confirmation loop for citizens who never respond.
 * Runs hourly. Any ticket sitting in RESOLVED past its
 * citizenConfirmationDeadline (72h after the officer marked it fixed) is
 * auto-closed, matching the common civic-tech pattern of not leaving tickets
 * in indefinite limbo just because a citizen didn't open the app.
 */
@Component
public class ConfirmationAutoCloseJob {

    private final GrievanceRepository grievanceRepository;
    private final NotificationService notificationService;

    public ConfirmationAutoCloseJob(GrievanceRepository grievanceRepository, NotificationService notificationService) {
        this.grievanceRepository = grievanceRepository;
        this.notificationService = notificationService;
    }

    // Every hour, on the hour.
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void autoCloseUnconfirmedResolutions() {
        List<Grievance> overdue = grievanceRepository
                .findByStatusAndCitizenConfirmationDeadlineBefore("RESOLVED", ZonedDateTime.now());

        for (Grievance g : overdue) {
            g.setStatus("CLOSED");
            g.setUpdatedAt(ZonedDateTime.now());
            grievanceRepository.save(g);

            notificationService.notify(g.getCitizenId(), g.getId(), "STATUS_UPDATE",
                    "Auto-closed: " + g.getTicketNumber(),
                    "You didn't respond within 72 hours, so \"" + g.getTitle() + "\" was automatically closed. Reply if it's still not fixed.");
            notificationService.notify(g.getAssignedOfficerId(), g.getId(), "STATUS_UPDATE",
                    "Auto-closed (no citizen response): " + g.getTicketNumber(),
                    "\"" + g.getTitle() + "\" was auto-closed after 72h with no citizen response.");
        }
    }
}
