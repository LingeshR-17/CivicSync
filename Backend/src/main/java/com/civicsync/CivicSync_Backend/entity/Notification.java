package com.civicsync.CivicSync_Backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.ZonedDateTime;

/**
 * 🔔 IN-APP NOTIFICATION: DB-backed, polled by the frontend (no paid SMS/push
 * infra required for the demo). Covers the full status lifecycle a citizen or
 * officer needs to know about: ASSIGNED -> RESOLVED (needs confirmation) ->
 * CLOSED / REOPENED_BY_CITIZEN, plus SLA escalations for officers/supervisors.
 */
@Entity
@Table(name = "notifications")
@Data
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Who this notification is for (citizen id or officer id from enterprise_users)
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "grievance_id")
    private Long grievanceId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String message;

    // STATUS_UPDATE, CONFIRMATION_REQUEST, ESCALATION, SYSTEM
    @Column(nullable = false)
    private String type = "STATUS_UPDATE";

    @Column(name = "is_read")
    private Boolean isRead = false;

    @Column(name = "created_at")
    private ZonedDateTime createdAt = ZonedDateTime.now();
}
