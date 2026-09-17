package com.civicsync.CivicSync_Backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "officer_performance_metrics")
public class OfficerPerformanceMetrics {

    @Id
    @Column(name = "officer_id")
    private Long officerId;

    @Column(name = "total_complaints_handled")
    private int totalHandled = 0;

    @Column(name = "resolved_complaints_count")
    private int resolvedComplaintsCount = 0;

    @Column(name = "sla_compliant_count")
    private int slaCompliantCount = 0;

    @Column(name = "reopened_complaints_count")
    private int reopenedComplaintsCount = 0;

    @Column(name = "false_closure_warnings")
    private int warningLevel = 0;

    // ⏰ How many times an assigned ticket blew past its SLA deadline under this
    // officer. Distinct from reopenedComplaintsCount (citizen disputes) — this is
    // purely "never acted in time".
    @Column(name = "missed_sla_count")
    private int missedSlaCount = 0;

    @Column(name = "citizen_satisfaction_sum")
    private BigDecimal citizenSatisfactionSum = BigDecimal.ZERO;

    @Column(name = "average_resolution_seconds")
    private long averageResolutionSeconds = 0;

    // --- HELPER CALCULATIONS FOR THE DTOs ---

    public double getSlaCompliance() {
        if (totalHandled == 0) return 100.0;
        return ((double) slaCompliantCount / totalHandled) * 100.0;
    }

    public double getReopenedRate() {
        if (totalHandled == 0) return 0.0;
        return ((double) reopenedComplaintsCount / totalHandled) * 100.0;
    }

    // --- STANDARD GETTERS AND SETTERS ---
    public Long getOfficerId() { return officerId; }
    public void setOfficerId(Long officerId) { this.officerId = officerId; }

    public int getTotalHandled() { return totalHandled; }
    public void setTotalHandled(int totalHandled) { this.totalHandled = totalHandled; }

    public int getWarningLevel() { return warningLevel; }
    public void setWarningLevel(int warningLevel) { this.warningLevel = warningLevel; }

    public int getMissedSlaCount() { return missedSlaCount; }
    public void setMissedSlaCount(int missedSlaCount) { this.missedSlaCount = missedSlaCount; }

    public int getResolvedComplaintsCount() { return resolvedComplaintsCount; }
    public void setResolvedComplaintsCount(int resolvedComplaintsCount) { this.resolvedComplaintsCount = resolvedComplaintsCount; }

    public int getSlaCompliantCount() { return slaCompliantCount; }
    public void setSlaCompliantCount(int slaCompliantCount) { this.slaCompliantCount = slaCompliantCount; }

    public int getReopenedComplaintsCount() { return reopenedComplaintsCount; }
    public void setReopenedComplaintsCount(int reopenedComplaintsCount) { this.reopenedComplaintsCount = reopenedComplaintsCount; }

    public BigDecimal getCitizenSatisfactionSum() { return citizenSatisfactionSum; }
    public void setCitizenSatisfactionSum(BigDecimal citizenSatisfactionSum) { this.citizenSatisfactionSum = citizenSatisfactionSum; }

    public long getAverageResolutionSeconds() { return averageResolutionSeconds; }
    public void setAverageResolutionSeconds(long averageResolutionSeconds) { this.averageResolutionSeconds = averageResolutionSeconds; }
}