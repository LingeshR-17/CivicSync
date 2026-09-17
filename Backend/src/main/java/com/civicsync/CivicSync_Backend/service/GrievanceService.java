package com.civicsync.CivicSync_Backend.service;

import com.civicsync.CivicSync_Backend.dto.GrievanceRequestDTO;
import com.civicsync.CivicSync_Backend.dto.GrievanceResponseDTO;
import com.civicsync.CivicSync_Backend.entity.Grievance;
// 🎯 ADD THIS IMPORT HERE:
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

public interface GrievanceService {

    // 🎯 Update this method signature to match the files:
    Grievance processAndCreateGrievance(GrievanceRequestDTO dto, Long citizenId, MultipartFile image, MultipartFile video);

    // 🎯 CHANGED: now takes the viewing citizen's id so each response can include
    // whether *that* citizen has already upvoted a given grievance.
    List<GrievanceResponseDTO> getAllGrievances(Long viewingCitizenId);

    // 🎯 ADDED: enforces one-upvote-per-citizen and returns the updated count.
    Map<String, Object> toggleUpvote(Long grievanceId, Long citizenId);

    // ✅ CITIZEN CONFIRMATION LOOP: citizen confirms or disputes an officer's RESOLVED claim.
    Grievance confirmResolution(Long grievanceId, Long citizenId, boolean confirmed, String citizenNote);
}