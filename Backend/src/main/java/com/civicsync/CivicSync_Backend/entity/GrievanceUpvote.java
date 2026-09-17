package com.civicsync.CivicSync_Backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.ZonedDateTime;

/**
 * 🎯 Join table enforcing ONE upvote per citizen per grievance.
 * The unique constraint on (grievance_id, citizen_id) is what actually stops
 * infinite upvoting — the old code had no such record at all.
 */
@Entity
@Table(
    name = "grievance_upvotes",
    uniqueConstraints = @UniqueConstraint(columnNames = {"grievance_id", "citizen_id"})
)
@Data
public class GrievanceUpvote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "grievance_id", nullable = false)
    private Long grievanceId;

    @Column(name = "citizen_id", nullable = false)
    private Long citizenId;

    @Column(name = "created_at", insertable = false, updatable = false)
    private ZonedDateTime createdAt;
}
