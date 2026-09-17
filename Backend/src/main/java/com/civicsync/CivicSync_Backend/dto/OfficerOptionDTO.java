package com.civicsync.CivicSync_Backend.dto;

import lombok.Data;

@Data
public class OfficerOptionDTO {
    private Long id;
    private String name;
    private Integer wardId;
    private Integer departmentId;
    private int activeTicketCount; // how loaded this officer currently is, so the supervisor can balance work
}
