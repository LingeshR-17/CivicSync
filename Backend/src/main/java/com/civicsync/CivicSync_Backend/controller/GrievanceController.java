package com.civicsync.CivicSync_Backend.controller;

import com.civicsync.CivicSync_Backend.dto.GrievanceRequestDTO;
import com.civicsync.CivicSync_Backend.dto.GrievanceResponseDTO;
import com.civicsync.CivicSync_Backend.entity.Grievance;
import com.civicsync.CivicSync_Backend.service.GrievanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/grievances")
@CrossOrigin(origins = "*") // Allows local phone, emulator, and dashboards to talk to this endpoint
public class GrievanceController {

    @Autowired
    private GrievanceService grievanceService;

    /**
     * 📩 1. LIVE COMPLAINT BROADCAST WITH MULTIPART FILE ATTACHMENTS (Images & Videos)
     * 🎯 Changed from @RequestBody to @ModelAttribute to automatically parse incoming FormData fields
     */
    @PostMapping
    public ResponseEntity<?> createGrievance(
            @ModelAttribute GrievanceRequestDTO dto,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestParam(value = "video", required = false) MultipartFile video,
            @RequestParam(value = "citizenId", required = false) Long citizenIdParam) {

        // 🎯 FIX: Use the real logged-in user's ID sent from the app instead of a hardcoded value.
        // Falls back to 1L only if the frontend somehow fails to send it (keeps old clients from crashing).
        Long citizenId = citizenIdParam != null ? citizenIdParam : 1L;

        // Log parameters to your terminal console for real-time validation monitoring
        System.out.println("Processing multipart grievance payload upload stream...");
        System.out.println("Title received: " + dto.getTitle());
        if (image != null) System.out.println("Captured Image attached: " + image.getOriginalFilename() + " (" + image.getSize() + " bytes)");
        if (video != null) System.out.println("Captured Video attached: " + video.getOriginalFilename() + " (" + video.getSize() + " bytes)");

        // 🚀 ROUTE: Pass execution directly down into your high-performance storage routing engine!
        // Note: Make sure to update your service method signature to handle these files next!
        Grievance savedGrievance = grievanceService.processAndCreateGrievance(dto, citizenId, image, video);

        // 🎯 RETURN: Clean, safe JSON Key-Value Data Map
        return ResponseEntity.ok(Map.of(
                "message", "Grievance lodged successfully with file evidence into Tamil Nadu State systems!",
                "ticketNumber", savedGrievance.getTicketNumber(),
                "status", savedGrievance.getStatus(),
                "id", savedGrievance.getId()
        ));
    }

    /**
     * 📬 2. GET ALL COMPLAINTS: Fetches real-time spatial records for map dashboards
     * 🎯 Accepts an optional citizenId so the response can flag which grievances
     * the requesting citizen has already upvoted (upvotedByMe).
     */
    @GetMapping
    public ResponseEntity<List<GrievanceResponseDTO>> getAllGrievances(
            @RequestParam(value = "citizenId", required = false) Long citizenId) {
        return ResponseEntity.ok(grievanceService.getAllGrievances(citizenId));
    }

    /**
     * ❤️ 3. TOGGLE UPVOTE: One upvote per citizen per grievance, enforced server-side
     * via a unique constraint on (grievance_id, citizen_id). Calling this again on
     * a grievance you already upvoted removes your upvote (un-upvote).
     */
    @PostMapping("/{id}/upvote")
    public ResponseEntity<?> toggleUpvote(
            @PathVariable Long id,
            @RequestParam Long citizenId) {
        return ResponseEntity.ok(grievanceService.toggleUpvote(id, citizenId));
    }

    /**
     * ✅ 4. CITIZEN CONFIRMATION LOOP: the citizen responds to an officer's
     * "RESOLVED" claim. confirmed=true closes the ticket for good; confirmed=false
     * reopens it and sends it back to the same officer with a fresh SLA window.
     */
    @PostMapping("/{id}/confirm-resolution")
    public ResponseEntity<?> confirmResolution(
            @PathVariable("id") Long grievanceId,
            @RequestParam("citizenId") Long citizenId,
            @RequestParam("confirmed") boolean confirmed,
            @RequestParam(value = "note", required = false) String note) {
        Grievance updated = grievanceService.confirmResolution(grievanceId, citizenId, confirmed, note);
        return ResponseEntity.ok(Map.of(
                "id", updated.getId(),
                "ticketNumber", updated.getTicketNumber(),
                "status", updated.getStatus()
        ));
    }
}