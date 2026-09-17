package com.civicsync.CivicSync_Backend.controller;

import com.civicsync.CivicSync_Backend.dto.OfficerScorecardDTO;
import com.civicsync.CivicSync_Backend.dto.OfficerTaskResponseDTO;
import com.civicsync.CivicSync_Backend.service.OfficerGrievanceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

// NOTE: There is currently no JWT/session auth filter wired up in SecurityConfig
// (the /api/v1/officer/** routes are permitAll for dev), so @AuthenticationPrincipal
// would always resolve to null here. Until real token-based auth is added, the
// officer's id is passed explicitly by the app (the same pattern already used by
// citizenId on the upvote endpoint).
@RestController
@RequestMapping("/api/v1/officer")
public class OfficerGrievanceController {

    private final OfficerGrievanceService officerGrievanceService;

    public OfficerGrievanceController(OfficerGrievanceService officerGrievanceService) {
        this.officerGrievanceService = officerGrievanceService;
    }

    @GetMapping("/grievances/assigned")
    public ResponseEntity<List<OfficerTaskResponseDTO>> getAssignedTasks(@RequestParam("officerId") Long officerId) {
        List<OfficerTaskResponseDTO> tasks = officerGrievanceService.getAssignedTasks(officerId);
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/grievances/history")
    public ResponseEntity<List<OfficerTaskResponseDTO>> getHistoryLogs(@RequestParam("officerId") Long officerId) {
        List<OfficerTaskResponseDTO> history = officerGrievanceService.getHistoryLogs(officerId);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/scorecard")
    public ResponseEntity<OfficerScorecardDTO> getScorecard(@RequestParam("officerId") Long officerId) {
        OfficerScorecardDTO scorecard = officerGrievanceService.getScorecard(officerId);
        return ResponseEntity.ok(scorecard);
    }

    @PutMapping(value = "/grievances/{id}/status", consumes = {"multipart/form-data"})
    public ResponseEntity<Void> updateGrievanceStatus(
            @PathVariable("id") Long grievanceId,
            @RequestParam("officerId") Long officerId,
            @RequestParam("status") String status,
            @RequestParam(value = "closure_notes", required = false) String closureNotes,
            @RequestPart(value = "completionProof", required = false) MultipartFile completionProof) {

        officerGrievanceService.updateGrievanceStatus(grievanceId, officerId, status, closureNotes, completionProof);
        return ResponseEntity.ok().build();
    }
}
