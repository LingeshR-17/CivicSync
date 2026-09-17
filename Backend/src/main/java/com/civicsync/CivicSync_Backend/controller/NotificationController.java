package com.civicsync.CivicSync_Backend.controller;

import com.civicsync.CivicSync_Backend.entity.Notification;
import com.civicsync.CivicSync_Backend.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 🔔 In-app notifications, polled by the frontend (no paid SMS/push infra needed
 * for the hackathon demo). Works for both citizens and officers since both are
 * rows in enterprise_users and userId is just that id.
 */
@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<Notification>> getForUser(@RequestParam("userId") Long userId) {
        return ResponseEntity.ok(notificationService.getForUser(userId));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@RequestParam("userId") Long userId) {
        return ResponseEntity.ok(Map.of("unreadCount", notificationService.getUnreadCount(userId)));
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllRead(@RequestParam("userId") Long userId) {
        notificationService.markAllRead(userId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markOneRead(@PathVariable("id") Long id) {
        notificationService.markOneRead(id);
        return ResponseEntity.ok().build();
    }
}
