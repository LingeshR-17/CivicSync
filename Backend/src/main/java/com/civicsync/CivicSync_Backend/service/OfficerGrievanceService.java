package com.civicsync.CivicSync_Backend.service;

import com.civicsync.CivicSync_Backend.dto.OfficerScorecardDTO;
import com.civicsync.CivicSync_Backend.dto.OfficerTaskResponseDTO;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface OfficerGrievanceService {
    List<OfficerTaskResponseDTO> getAssignedTasks(Long officerId);
    List<OfficerTaskResponseDTO> getHistoryLogs(Long officerId);
    OfficerScorecardDTO getScorecard(Long officerId);
    void updateGrievanceStatus(Long grievanceId, Long officerId, String status, String closureNotes, MultipartFile completionProof);
}
