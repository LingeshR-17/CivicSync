package com.civicsync.CivicSync_Backend.controller;

import com.civicsync.CivicSync_Backend.dto.OfficerOptionDTO;
import com.civicsync.CivicSync_Backend.dto.SupervisorOverviewDTO;
import com.civicsync.CivicSync_Backend.dto.SupervisorTaskDTO;
import com.civicsync.CivicSync_Backend.service.SupervisorService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

// NOTE: same pattern as OfficerGrievanceController — no JWT/session auth wired up yet
// (/api/v1/supervisor/** is permitAll for dev), so the supervisor's id is passed
// explicitly by the app rather than resolved from a security principal.
@RestController
@RequestMapping("/api/v1/supervisor")
@CrossOrigin(origins = "*")
public class SupervisorController {

    private final SupervisorService supervisorService;

    public SupervisorController(SupervisorService supervisorService) {
        this.supervisorService = supervisorService;
    }

    /**
     * 🧭 Tickets the auto-routing engine couldn't place — no field officer seeded
     * for that ticket's ward/department combo. These need manual routing.
     */
    @GetMapping("/grievances/unassigned")
    public ResponseEntity<List<SupervisorTaskDTO>> getUnassigned() {
        return ResponseEntity.ok(supervisorService.getUnassignedTickets());
    }

    /**
     * 🧭 Tickets that have been escalated: SLA breached (SlaEscalationJob) or
     * rejected by the citizen at least once via the confirmation loop.
     */
    @GetMapping("/grievances/escalated")
    public ResponseEntity<List<SupervisorTaskDTO>> getEscalated() {
        return ResponseEntity.ok(supervisorService.getEscalatedTickets());
    }

    /**
     * 🧭 Candidate field officers for a specific ticket's ward + department,
     * sorted by current active-ticket load (lowest first) so the supervisor's
     * top pick balances work the way the auto-routing engine would have.
     */
    @GetMapping("/grievances/{id}/officer-options")
    public ResponseEntity<List<OfficerOptionDTO>> getOfficerOptions(@PathVariable("id") Long grievanceId) {
        return ResponseEntity.ok(supervisorService.getOfficerOptions(grievanceId));
    }

    /**
     * 🧭 Manually route a ticket to a chosen officer.
     */
    @PutMapping("/grievances/{id}/assign")
    public ResponseEntity<?> assignOfficer(
            @PathVariable("id") Long grievanceId,
            @RequestParam("officerId") Long officerId,
            @RequestParam("supervisorId") Long supervisorId) {
        supervisorService.assignOfficer(grievanceId, officerId, supervisorId);
        return ResponseEntity.ok(Map.of("message", "Ticket assigned successfully."));
    }

    /**
     * 🧭 Quick summary counts for the overview tab.
     */
    @GetMapping("/overview")
    public ResponseEntity<SupervisorOverviewDTO> getOverview() {
        return ResponseEntity.ok(supervisorService.getOverview());
    }
}
