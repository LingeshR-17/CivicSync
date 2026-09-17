package com.civicsync.CivicSync_Backend.service;

import com.civicsync.CivicSync_Backend.dto.OfficerOptionDTO;
import com.civicsync.CivicSync_Backend.dto.SupervisorOverviewDTO;
import com.civicsync.CivicSync_Backend.dto.SupervisorTaskDTO;
import com.civicsync.CivicSync_Backend.entity.Grievance;
import com.civicsync.CivicSync_Backend.entity.User;
import com.civicsync.CivicSync_Backend.exception.ResourceNotFoundException;
import com.civicsync.CivicSync_Backend.repository.GrievanceRepository;
import com.civicsync.CivicSync_Backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 🧭 SUPERVISOR DASHBOARD SERVICE
 * Covers the gap called out as the #1 real risk in the architecture review:
 * "if a ward/department has no seeded field officer, a ticket sits at PENDING
 * with assigned_officer_id = null forever, with nobody looking at it."
 * This gives a human (supervisor) a surfaced view of exactly those tickets,
 * plus anything that's been escalated, and a way to manually route them.
 */
@Service
public class SupervisorServiceImpl implements SupervisorService {

    private static final List<String> OPEN_STATUSES =
            Arrays.asList("PENDING", "ASSIGNED", "IN_PROGRESS", "REOPENED_BY_CITIZEN");

    private final GrievanceRepository grievanceRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public SupervisorServiceImpl(GrievanceRepository grievanceRepository,
                                  UserRepository userRepository,
                                  NotificationService notificationService) {
        this.grievanceRepository = grievanceRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Override
    public List<SupervisorTaskDTO> getUnassignedTickets() {
        return grievanceRepository.findByAssignedOfficerIdIsNullOrderByCreatedAtAsc()
                .stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    public List<SupervisorTaskDTO> getEscalatedTickets() {
        return grievanceRepository.findByEscalationLevelGreaterThanOrderByEscalationLevelDescSlaDeadlineAsc(0)
                .stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    public List<OfficerOptionDTO> getOfficerOptions(Long grievanceId) {
        Grievance g = grievanceRepository.findById(grievanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Grievance not found with ID: " + grievanceId));

        if (g.getWardId() == null || g.getDepartmentId() == null) {
            // No ward/department detected at all (e.g. GPS pin fell outside every seeded ward
            // polygon) — nothing to auto-filter on, supervisor sees an empty pick list and
            // must escalate outside the app. Better to say so plainly than pretend a match exists.
            return List.of();
        }

        List<User> candidates = userRepository.findByRoleAndWardIdAndDepartmentId(
                "FIELD_OFFICER", g.getWardId(), g.getDepartmentId());

        return candidates.stream().map(officer -> {
            OfficerOptionDTO dto = new OfficerOptionDTO();
            dto.setId(officer.getId());
            dto.setName(officer.getName());
            dto.setWardId(officer.getWardId());
            dto.setDepartmentId(officer.getDepartmentId());
            dto.setActiveTicketCount((int) grievanceRepository
                    .findByAssignedOfficerIdAndStatusIn(officer.getId(), OPEN_STATUSES)
                    .size());
            return dto;
        })
        // Lowest current workload first, so the supervisor's default pick balances load
        // the same way the auto-routing engine would have.
        .sorted((a, b) -> Integer.compare(a.getActiveTicketCount(), b.getActiveTicketCount()))
        .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void assignOfficer(Long grievanceId, Long officerId, Long supervisorId) {
        Grievance g = grievanceRepository.findById(grievanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Grievance not found with ID: " + grievanceId));

        User officer = userRepository.findById(officerId)
                .orElseThrow(() -> new ResourceNotFoundException("Officer not found with ID: " + officerId));

        if (!"FIELD_OFFICER".equalsIgnoreCase(officer.getRole())) {
            throw new RuntimeException("User " + officerId + " is not a FIELD_OFFICER");
        }

        g.setAssignedOfficerId(officerId);
        if ("PENDING".equalsIgnoreCase(g.getStatus())) {
            g.setStatus("ASSIGNED");
        }
        // Give the newly-assigned officer a fresh SLA-breach notification window instead of
        // immediately re-flagging a ticket that was already overdue while unassigned.
        g.setSlaBreachNotifiedAt(ZonedDateTime.now());
        g.setUpdatedAt(ZonedDateTime.now());
        grievanceRepository.save(g);

        notificationService.notify(officerId, grievanceId, "STATUS_UPDATE",
                "New assignment: " + g.getTicketNumber(),
                "A supervisor manually routed \"" + g.getTitle() + "\" to you.");

        notificationService.notify(g.getCitizenId(), grievanceId, "STATUS_UPDATE",
                "Officer assigned: " + g.getTicketNumber(),
                "Your complaint \"" + g.getTitle() + "\" has been assigned to a field officer.");
    }

    @Override
    public SupervisorOverviewDTO getOverview() {
        SupervisorOverviewDTO dto = new SupervisorOverviewDTO();
        dto.setUnassignedCount(grievanceRepository.countByAssignedOfficerIdIsNull());
        dto.setEscalatedCount(grievanceRepository.countByEscalationLevelGreaterThan(0));
        dto.setOpenTicketCount(grievanceRepository.countByStatusIn(OPEN_STATUSES));
        return dto;
    }

    private SupervisorTaskDTO mapToDTO(Grievance g) {
        SupervisorTaskDTO dto = new SupervisorTaskDTO();
        dto.setId(g.getId());
        dto.setTicketNumber(g.getTicketNumber());
        dto.setTitle(g.getTitle());
        dto.setDescription(g.getDescription());
        dto.setStatus(g.getStatus());
        dto.setPriority(g.getPriority());
        dto.setFormattedAddress(g.getFormattedAddress());

        if (g.getLocationPin() != null) {
            dto.setLatitude(g.getLocationPin().getY());
            dto.setLongitude(g.getLocationPin().getX());
        }

        dto.setSlaDeadline(g.getSlaDeadline());
        dto.setEscalationLevel(g.getEscalationLevel());
        dto.setDepartmentId(g.getDepartmentId());
        dto.setWardId(g.getWardId());
        dto.setAssignedOfficerId(g.getAssignedOfficerId());
        dto.setCreatedAt(g.getCreatedAt());

        if (g.getAssignedOfficerId() != null) {
            userRepository.findById(g.getAssignedOfficerId())
                    .ifPresent(officer -> dto.setAssignedOfficerName(officer.getName()));
        }

        return dto;
    }
}
