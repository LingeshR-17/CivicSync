package com.civicsync.CivicSync_Backend.repository;

import com.civicsync.CivicSync_Backend.entity.Grievance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.ZonedDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface GrievanceRepository extends JpaRepository<Grievance, Long> {

    // 🚥 ADD THIS FOR TIMELINE & OPERATION QUEUES (Fixes the compiler error)
    List<Grievance> findByAssignedOfficerIdAndStatusIn(Long assignedOfficerId, Collection<String> statuses);

    // 🎯 CONFIRMATION LOOP: tickets marked RESOLVED whose 72h citizen-confirmation window has lapsed
    List<Grievance> findByStatusAndCitizenConfirmationDeadlineBefore(String status, ZonedDateTime cutoff);

    // ⏰ SLA ESCALATION: still-open tickets (not resolved/closed) past their SLA deadline,
    // that haven't already been escalated in the last 24h (slaBreachNotifiedAt is null
    // or older than the throttle cutoff passed in).
    @Query("SELECT g FROM Grievance g WHERE g.status NOT IN ('RESOLVED', 'CLOSED') " +
           "AND g.slaDeadline < :now " +
           "AND (g.slaBreachNotifiedAt IS NULL OR g.slaBreachNotifiedAt < :throttleCutoff)")
    List<Grievance> findSlaBreachedTicketsNeedingEscalation(@Param("now") ZonedDateTime now,
                                                             @Param("throttleCutoff") ZonedDateTime throttleCutoff);

    // 🎯 PostGIS Boundary Intersect Lookups: Finds which ward polygon fully contains the coordinate point
    @Query(value = "SELECT id FROM tn_wards WHERE ST_Contains(geom, ST_SetSRID(ST_Point(:lng, :lat), 4326)) LIMIT 1", nativeQuery = true)
    Optional<Integer> autoDetectWardByCoordinates(@Param("lat") double lat, @Param("lng") double lng);

    @Query(value = "SELECT district_id FROM tn_local_bodies lb JOIN tn_zones z ON z.local_body_id = lb.id JOIN tn_wards w ON w.zone_id = z.id WHERE w.id = :wardId LIMIT 1", nativeQuery = true)
    Optional<Integer> autoDetectDistrictByWard(@Param("wardId") int wardId);

    // 🎛️ Dynamic Allocation Engine: Matches ticket to the Field Officer assigned to this ward/department with the lowest active workload
    @Query(value = "SELECT id FROM enterprise_users WHERE role = 'FIELD_OFFICER' AND ward_id = :wardId AND department_id = :deptId " +
            "ORDER BY (SELECT COUNT(*) FROM grievances WHERE assigned_officer_id = enterprise_users.id AND status IN ('PENDING', 'ASSIGNED', 'IN_PROGRESS')) ASC LIMIT 1", nativeQuery = true)
    Optional<Long> findAvailableFieldOfficer(@Param("wardId") int wardId, @Param("deptId") int deptId);

    // 🧭 SUPERVISOR DASHBOARD: tickets the auto-routing engine couldn't place — no ward/dept
    // had a matching officer seeded, so they're stuck at PENDING with no one looking at them.
    // This is the "#1 real risk" gap: a human needs a surfaced view to manually route these.
    List<Grievance> findByAssignedOfficerIdIsNullOrderByCreatedAtAsc();

    // 🧭 SUPERVISOR DASHBOARD: tickets that have been escalated at least once (SLA breach or
    // repeated citizen rejection), worst-first, so a supervisor can triage what needs attention.
    List<Grievance> findByEscalationLevelGreaterThanOrderByEscalationLevelDescSlaDeadlineAsc(Integer level);

    // 🧭 Quick counts for the supervisor overview tab.
    long countByAssignedOfficerIdIsNull();
    long countByEscalationLevelGreaterThan(Integer level);
    long countByStatusIn(Collection<String> statuses);
}