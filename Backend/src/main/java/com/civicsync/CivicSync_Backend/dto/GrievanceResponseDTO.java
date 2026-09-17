package com.civicsync.CivicSync_Backend.dto;

import lombok.Data;
import java.time.ZonedDateTime;

@Data
public class GrievanceResponseDTO {
    private Long id;
    private Long citizenId; // 🎯 ADDED: So the app can filter "my grievances" and check upvote ownership
    private String title;
    private String description;
    private String ticketNumber;
    private String status;
    private String priority;
    private Integer departmentId; // 🎯 ADDED: Raw numeric ID for icon-mapping on the frontend
    private String department; // We will map the department name here
    private Double latitude;   // 🎯 Extracted primitive number for React Native
    private Double longitude;  // 🎯 Extracted primitive number for React Native
    private Integer upvotes;
    private Boolean upvotedByMe; // 🎯 ADDED: Tells the frontend whether the requesting citizen already upvoted
    private ZonedDateTime slaDeadline;

    // 🎯 ADDED: Media asset serving pathways for your frontend feed cards
    private String imageUrl;
    private String videoUrl;

    // 🎯 ADDED: Human-readable location string ("place where it is filed") so the
    // Grievances tab and Map pin details can show where the issue was reported.
    private String formattedAddress;

    // 🎯 ADDED: Citizen confirmation loop fields, so the app can show a
    // "Yes, fixed / No, not fixed" prompt when status == RESOLVED.
    private String closureNotes;
    private String completionPhotoUrl;
    private ZonedDateTime citizenConfirmationDeadline;
    private Integer escalationLevel;
}