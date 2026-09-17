package com.civicsync.CivicSync_Backend.service;

import com.civicsync.CivicSync_Backend.dto.OfficerOptionDTO;
import com.civicsync.CivicSync_Backend.dto.SupervisorOverviewDTO;
import com.civicsync.CivicSync_Backend.dto.SupervisorTaskDTO;

import java.util.List;

public interface SupervisorService {

    // 🧭 Tickets the auto-routing engine couldn't place (no officer for that ward/dept).
    List<SupervisorTaskDTO> getUnassignedTickets();

    // 🧭 Tickets that have breached SLA or been rejected by the citizen at least once.
    List<SupervisorTaskDTO> getEscalatedTickets();

    // 🧭 Candidate field officers for a given ticket's ward + department, sorted by current workload.
    List<OfficerOptionDTO> getOfficerOptions(Long grievanceId);

    // 🧭 Manually route a ticket to a chosen officer. Resets SLA-breach throttle so a fresh
    // clock effectively starts on visibility, and notifies both the officer and citizen.
    void assignOfficer(Long grievanceId, Long officerId, Long supervisorId);

    // 🧭 Quick counts for the overview tab.
    SupervisorOverviewDTO getOverview();
}
