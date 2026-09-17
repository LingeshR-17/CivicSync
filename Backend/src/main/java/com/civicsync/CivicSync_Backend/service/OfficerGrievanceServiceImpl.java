package com.civicsync.CivicSync_Backend.service;

import com.civicsync.CivicSync_Backend.dto.OfficerScorecardDTO;
import com.civicsync.CivicSync_Backend.dto.OfficerTaskResponseDTO;
import com.civicsync.CivicSync_Backend.entity.Grievance;
import com.civicsync.CivicSync_Backend.entity.OfficerPerformanceMetrics;
import com.civicsync.CivicSync_Backend.exception.ResourceNotFoundException;
import com.civicsync.CivicSync_Backend.repository.GrievanceRepository;
import com.civicsync.CivicSync_Backend.repository.OfficerMetricsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.ZonedDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OfficerGrievanceServiceImpl implements OfficerGrievanceService {

    private final GrievanceRepository grievanceRepository;
    private final OfficerMetricsRepository officerMetricsRepository;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;

    public OfficerGrievanceServiceImpl(GrievanceRepository grievanceRepository, 
                                       OfficerMetricsRepository officerMetricsRepository, 
                                       FileStorageService fileStorageService,
                                       NotificationService notificationService) {
        this.grievanceRepository = grievanceRepository;
        this.officerMetricsRepository = officerMetricsRepository;
        this.fileStorageService = fileStorageService;
        this.notificationService = notificationService;
    }

    @Override
    public List<OfficerTaskResponseDTO> getAssignedTasks(Long officerId) {
        List<Grievance> grievances = grievanceRepository.findByAssignedOfficerIdAndStatusIn(
                officerId, Arrays.asList("ASSIGNED", "IN_PROGRESS", "REOPENED_BY_CITIZEN"));
        return grievances.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    public List<OfficerTaskResponseDTO> getHistoryLogs(Long officerId) {
        List<Grievance> grievances = grievanceRepository.findByAssignedOfficerIdAndStatusIn(
                officerId, Arrays.asList("RESOLVED", "CLOSED"));
        return grievances.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    public OfficerScorecardDTO getScorecard(Long officerId) {
        OfficerPerformanceMetrics metrics = officerMetricsRepository.findByOfficerId(officerId)
            .orElseGet(() -> {
                OfficerPerformanceMetrics m = new OfficerPerformanceMetrics();
                m.setOfficerId(officerId);
                return m;
            });

        OfficerScorecardDTO dto = new OfficerScorecardDTO();
        dto.setTotalHandled(metrics.getTotalHandled());
        dto.setSlaCompliance(metrics.getSlaCompliance());
        dto.setReopenedRate(metrics.getReopenedRate());
        dto.setWarningLevel(metrics.getWarningLevel());
        return dto;
    }

    @Override
    @Transactional
    public void updateGrievanceStatus(Long grievanceId, Long officerId, String status, String closureNotes, MultipartFile completionProof) {
        Grievance grievance = grievanceRepository.findById(grievanceId)
            .orElseThrow(() -> new ResourceNotFoundException("Grievance not found with ID: " + grievanceId));

        if (grievance.getAssignedOfficerId() == null || !grievance.getAssignedOfficerId().equals(officerId)) {
            throw new RuntimeException("Unauthorized: Officer not assigned to this grievance");
        }

        // 🎯 CITIZEN CONFIRMATION LOOP: an officer is NOT allowed to jump straight to
        // CLOSED. They can only mark RESOLVED (meaning "I fixed it, please confirm").
        // The ticket only becomes CLOSED when the citizen confirms, or the 72h
        // auto-close job runs. This is the single biggest gap the old flow had.
        String effectiveStatus = "CLOSED".equalsIgnoreCase(status) ? "RESOLVED" : status;
        grievance.setStatus(effectiveStatus);

        if (closureNotes != null && !closureNotes.isEmpty()) {
            grievance.setClosureNotes(closureNotes);
        }

        if (completionProof != null && !completionProof.isEmpty()) {
            String photoUrl = fileStorageService.uploadFile(completionProof);
            grievance.setCompletionPhotoUrl(photoUrl);
        }

        if ("RESOLVED".equalsIgnoreCase(effectiveStatus)) {
            // Start a 72h window for the citizen to confirm; auto-close job picks up stragglers.
            grievance.setCitizenConfirmationDeadline(ZonedDateTime.now().plusHours(72));
        }

        grievance.setUpdatedAt(ZonedDateTime.now());
        grievanceRepository.save(grievance);

        if ("RESOLVED".equalsIgnoreCase(effectiveStatus)) {
            notificationService.notify(grievance.getCitizenId(), grievanceId, "CONFIRMATION_REQUEST",
                    "Please confirm: " + grievance.getTicketNumber(),
                    "The officer marked \"" + grievance.getTitle() + "\" as fixed. Please confirm within 72 hours, or it will auto-close.");

            OfficerPerformanceMetrics metrics = officerMetricsRepository.findByOfficerId(officerId)
                .orElseGet(() -> {
                    OfficerPerformanceMetrics newMetrics = new OfficerPerformanceMetrics();
                    newMetrics.setOfficerId(officerId);
                    return newMetrics;
                });
            metrics.setTotalHandled(metrics.getTotalHandled() + 1);
            metrics.setResolvedComplaintsCount(metrics.getResolvedComplaintsCount() + 1);
            // 🎯 FIX: this was the reason SLA Compliance always showed 0% on the
            // scorecard — slaCompliantCount was never incremented anywhere.
            if (grievance.getSlaDeadline() == null || !ZonedDateTime.now().isAfter(grievance.getSlaDeadline())) {
                metrics.setSlaCompliantCount(metrics.getSlaCompliantCount() + 1);
            }
            officerMetricsRepository.save(metrics);
        } else {
            notificationService.notify(grievance.getCitizenId(), grievanceId, "STATUS_UPDATE",
                    "Status updated: " + grievance.getTicketNumber(),
                    "Your complaint \"" + grievance.getTitle() + "\" is now " + effectiveStatus + ".");
        }
    }

    private OfficerTaskResponseDTO mapToDTO(Grievance g) {
        OfficerTaskResponseDTO dto = new OfficerTaskResponseDTO();
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
        
        if (g.getSlaDeadline() != null) {
            dto.setSlaDeadline(g.getSlaDeadline().toLocalDateTime());
        }
        
        dto.setCitizenPhotoUrl(g.getCitizenPhotoUrl());
        dto.setClosureNotes(g.getClosureNotes());

        // 🎯 Pass the citizen-submitted evidence (photo/video) through to the
        // officer so they can view proof of the complaint, not just the text.
        dto.setImageUrl(g.getImageUrl());
        dto.setVideoUrl(g.getVideoUrl());
        dto.setCompletionPhotoUrl(g.getCompletionPhotoUrl());
        dto.setEscalationLevel(g.getEscalationLevel());
        return dto;
    }
}
