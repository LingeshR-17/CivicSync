package com.civicsync.CivicSync_Backend.dto;

import lombok.Data;
import java.time.ZonedDateTime;

@Data
public class SupervisorTaskDTO {
    private Long id;
    private String ticketNumber;
    private String title;
    private String description;
    private String status;
    private String priority;
    private String formattedAddress;
    private Double latitude;
    private Double longitude;
    private ZonedDateTime slaDeadline;
    private Integer escalationLevel;
    private Integer departmentId;
    private Integer wardId;
    private Long assignedOfficerId;
    private String assignedOfficerName; // null when unassigned
    private ZonedDateTime createdAt;
}
