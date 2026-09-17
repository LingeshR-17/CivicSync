package com.civicsync.CivicSync_Backend.dto;

import lombok.Data;

@Data
public class SupervisorOverviewDTO {
    private long unassignedCount;
    private long escalatedCount;
    private long openTicketCount; // PENDING, ASSIGNED, IN_PROGRESS, REOPENED_BY_CITIZEN
}
