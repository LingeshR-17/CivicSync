package com.civicsync.CivicSync_Backend.dto;

import lombok.Data;

@Data
public class OfficerScorecardDTO {
    private Integer totalHandled;
    private Double slaCompliance;
    private Double reopenedRate;
    private Integer warningLevel;
}
