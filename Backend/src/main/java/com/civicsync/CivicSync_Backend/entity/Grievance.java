package com.civicsync.CivicSync_Backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import org.locationtech.jts.geom.Point;
import java.time.ZonedDateTime;

@Entity
@Table(name = "grievances")
@Data
public class Grievance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "citizen_id", referencedColumnName = "id", insertable = false, updatable = false)
    private User citizen;

    @Column(name = "citizen_id", nullable = false)
    private Long citizenId;

    @Column(name = "ticket_number", nullable = false, unique = true)
    private String ticketNumber;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "department_id", nullable = false)
    private Integer departmentId;

    // 🎯 NEW: Image file reference storage pointer string
    @Column(name = "image_url")
    private String imageUrl;

    // 🎯 NEW: Video file reference storage pointer string
    @Column(name = "video_url")
    private String videoUrl;

    private String priority = "MEDIUM";
    private String status = "PENDING";

    @Column(name = "district_id")
    private Integer districtId;

    @Column(name = "ward_id")
    private Integer wardId;

    @Column(name = "assigned_officer_id")
    private Long assignedOfficerId;

    @Column(name = "escalation_level")
    private Integer escalationLevel = 0;

    @Column(name = "is_duplicate")
    private Boolean isDuplicate = false;

    @JsonIgnore
    @Column(name = "location_pin", columnDefinition = "geometry(Point,4326)")
    private org.locationtech.jts.geom.Point locationPin;

    @Column(name = "sla_deadline", nullable = false)
    private ZonedDateTime slaDeadline;

    @Column(name = "citizen_photo_url")
    private String citizenPhotoUrl;

    @Column(name = "formatted_address")
    private String formattedAddress;

    @Column(name = "closure_notes", columnDefinition = "TEXT")
    private String closureNotes;

    @Column(name = "completion_photo_url")
    private String completionPhotoUrl;

    // 🎯 CITIZEN CONFIRMATION LOOP: when an officer marks a ticket RESOLVED, we start
    // a confirmation window. If the citizen doesn't respond by this deadline, a
    // scheduled job auto-closes the ticket (civic-tech pattern to prevent limbo).
    @Column(name = "citizen_confirmation_deadline")
    private ZonedDateTime citizenConfirmationDeadline;

    // How many times the citizen has rejected an officer's "resolved" claim.
    // Distinct from escalationLevel (which also increments on SLA breach) so we can
    // reason about "did this ticket bounce back from the citizen" separately.
    @Column(name = "citizen_reject_count")
    private Integer citizenRejectCount = 0;

    // ⏰ SLA ESCALATION: last time this ticket was flagged/notified for being past
    // its SLA deadline. Throttles the escalation job so a breached ticket only
    // re-escalates once per day instead of every hourly run.
    @Column(name = "sla_breach_notified_at")
    private ZonedDateTime slaBreachNotifiedAt;

    @Column(name = "created_at", insertable = false, updatable = false)
    private ZonedDateTime createdAt;

    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;
}