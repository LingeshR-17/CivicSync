package com.civicsync.CivicSync_Backend.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class OfficerTaskResponseDTO {
    private Long id;
    private String ticketNumber;
    private String title;
    private String description;
    private String status;
    private String priority;
    private String formattedAddress;
    private Double latitude;
    private Double longitude;
    private LocalDateTime slaDeadline;
    private String citizenPhotoUrl;
    private String closureNotes;

    // 🎯 Evidence submitted by the citizen with the complaint — must reach the
    // assigned officer alongside the ticket so they can verify the issue.
    private String imageUrl;
    private String videoUrl;
    private String completionPhotoUrl;

    // ⏰ SLA ESCALATION: lets the officer app show a warning badge on tickets
    // that have already breached SLA (escalationLevel > 0).
    private Integer escalationLevel;
}
