package com.civicsync.CivicSync_Backend.service;

import com.civicsync.CivicSync_Backend.entity.Notification;
import com.civicsync.CivicSync_Backend.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 🔔 Centralized notification creator. Every lifecycle transition in the app
 * (grievance created/assigned/resolved/confirmed/reopened/escalated) should
 * call through here instead of writing to the notifications table directly,
 * so the "who gets told what, when" logic lives in one place.
 */
@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public Notification notify(Long userId, Long grievanceId, String type, String title, String message) {
        if (userId == null) return null; // e.g. grievance with no officer assigned yet
        Notification n = new Notification();
        n.setUserId(userId);
        n.setGrievanceId(grievanceId);
        n.setType(type);
        n.setTitle(title);
        n.setMessage(message);
        return notificationRepository.save(n);
    }

    public List<Notification> getForUser(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    // 🎯 FIX: @Modifying queries must run inside a transaction, or Spring throws
    // "Executing an update/delete query" at runtime. Every screen that opens the
    // notification list calls this on mount, so it was failing silently every time
    // (frontend swallows the error) and the unread badge/list never behaved right.
    @Transactional
    public void markAllRead(Long userId) {
        notificationRepository.markAllReadForUser(userId);
    }

    public void markOneRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setIsRead(true);
            notificationRepository.save(n);
        });
    }
}
