package com.civicsync.CivicSync_Backend.service;

import com.civicsync.CivicSync_Backend.dto.GrievanceResponseDTO;
import com.civicsync.CivicSync_Backend.dto.GrievanceRequestDTO;
import com.civicsync.CivicSync_Backend.entity.Grievance;
import com.civicsync.CivicSync_Backend.repository.GrievanceRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class GrievanceServiceImpl implements GrievanceService {

    @Autowired
    private GrievanceRepository grievanceRepository;

    @Autowired
    private com.civicsync.CivicSync_Backend.repository.GrievanceUpvoteRepository upvoteRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private com.civicsync.CivicSync_Backend.repository.OfficerMetricsRepository officerMetricsRepository;

    // 🎯 Reuse one Jackson mapper instance instead of "new ObjectMapper()" per call
    private final ObjectMapper objectMapper = new ObjectMapper();

    // 🎯 Reuse one HttpClient instance too (it's thread-safe and meant to be shared)
    private final HttpClient httpClient = HttpClient.newHttpClient();

    // Define where to store media files on the local server machine
    private final String UPLOAD_DIR = System.getProperty("user.dir") + "/uploads/";

    // Spatial coordinate system builder factory (SRID 4326 stands for WGS 84 GPS Standard)
    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    @Override
    @Transactional
    public Grievance processAndCreateGrievance(GrievanceRequestDTO dto, Long citizenId, MultipartFile image, MultipartFile video) {
        Grievance grievance = new Grievance();
        grievance.setTitle(dto.getTitle());
        grievance.setDescription(dto.getDescription());
        grievance.setCitizenId(citizenId);

        // 1. Convert incoming double primitives into a PostGIS Spatial Object
        Point pinLocation = geometryFactory.createPoint(new Coordinate(dto.getLongitude(), dto.getLatitude()));
        grievance.setLocationPin(pinLocation);

        // 1a. Resolve a human-readable place name for this pin so citizens can see
        // "where it was filed" on both the Grievances tab and the Map pin details.
        grievance.setFormattedAddress(reverseGeocodeAddress(dto.getLatitude(), dto.getLongitude()));

        // 2. Resolve Department Reference Link from Code / Text
        // 🎯 Note: Using departmentId if provided by form-data fallback, else category string lookup
        Integer deptId = dto.getDepartmentId() != null ? dto.getDepartmentId() : fetchDepartmentIdByName(dto.getCategory());
        grievance.setDepartmentId(deptId);

        // 🎯 NEW: PROCESS AND SAVE BINARY FILES TO DISK
        if (image != null && !image.isEmpty()) {
            String imagePath = saveFileToDisk(image, "images");
            grievance.setImageUrl(imagePath); // Assuming your entity has getImageUrl / setImageUrl
        }
        if (video != null && !video.isEmpty()) {
            String videoPath = saveFileToDisk(video, "videos");
            grievance.setVideoUrl(videoPath); // Assuming your entity has getVideoUrl / setVideoUrl
        }

        // 3. 🗺️ GIS AUTO-ROUTING ENGINE INTERCEPTOR (ST_Contains calculation)
        Optional<Integer> resolvedWardId = grievanceRepository.autoDetectWardByCoordinates(dto.getLatitude(), dto.getLongitude());

        if (resolvedWardId.isPresent()) {
            int wardId = resolvedWardId.get();
            grievance.setWardId(wardId);

            // Auto-detect matching parent district structure
            Optional<Integer> resolvedDistrictId = grievanceRepository.autoDetectDistrictByWard(wardId);
            resolvedDistrictId.ifPresent(grievance::setDistrictId);

            // 🎛️ AUTOMATED OFFICER ALLOCATION
            Optional<Long> officerId = grievanceRepository.findAvailableFieldOfficer(wardId, deptId);
            if (officerId.isPresent()) {
                grievance.setAssignedOfficerId(officerId.get());
                grievance.setStatus("ASSIGNED");
            } else {
                grievance.setStatus("PENDING");
            }
        } else {
            grievance.setStatus("PENDING");
        }

        // 4. PREDICT PRIORITY & SLA TIMELINE BASED ON CATEGORY
        determinePriorityAndSla(grievance, dto.getCategory());

        // 5. GENERATE STATE-WIDE TRACEABLE TICKET NUMBER
        String cleanDeptCode = fetchDepartmentCodeById(deptId);
        String generationId = UUID.randomUUID().toString().substring(0, 5).toUpperCase();
        grievance.setTicketNumber("TN-" + cleanDeptCode + "-2026-" + generationId);

        grievance.setUpdatedAt(ZonedDateTime.now());
        Grievance saved = grievanceRepository.save(grievance);

        // 🔔 Notify the citizen their ticket was filed, and (if auto-routing found
        // an officer) notify that officer they have a new assignment.
        notificationService.notify(saved.getCitizenId(), saved.getId(), "STATUS_UPDATE",
                "Grievance filed: " + saved.getTicketNumber(),
                "Your complaint \"" + saved.getTitle() + "\" was filed and is now " + saved.getStatus() + ".");
        if (saved.getAssignedOfficerId() != null) {
            notificationService.notify(saved.getAssignedOfficerId(), saved.getId(), "STATUS_UPDATE",
                    "New task assigned: " + saved.getTicketNumber(),
                    "You've been assigned a new " + saved.getPriority() + " priority complaint: \"" + saved.getTitle() + "\".");
        }
        return saved;
    }

    /**
     * CITIZEN CONFIRMATION LOOP
     * Called when a citizen responds to an officer's RESOLVED claim.
     * confirmed = true  -> ticket is genuinely fixed, close it out.
     * confirmed = false -> citizen disputes it, reopen and send back to the same officer.
     */
    @Override
    @Transactional
    public Grievance confirmResolution(Long grievanceId, Long citizenId, boolean confirmed, String citizenNote) {
        Grievance grievance = grievanceRepository.findById(grievanceId)
                .orElseThrow(() -> new com.civicsync.CivicSync_Backend.exception.ResourceNotFoundException(
                        "Grievance not found with id: " + grievanceId));

        if (!grievance.getCitizenId().equals(citizenId)) {
            throw new RuntimeException("Unauthorized: this grievance does not belong to this citizen");
        }
        if (!"RESOLVED".equalsIgnoreCase(grievance.getStatus())) {
            throw new RuntimeException("This ticket is not awaiting confirmation (status = " + grievance.getStatus() + ")");
        }

        if (confirmed) {
            grievance.setStatus("CLOSED");
            grievance.setCitizenConfirmationDeadline(null);
            grievance.setUpdatedAt(ZonedDateTime.now());
            grievanceRepository.save(grievance);

            notificationService.notify(grievance.getAssignedOfficerId(), grievanceId, "STATUS_UPDATE",
                    "Ticket confirmed fixed: " + grievance.getTicketNumber(),
                    "The citizen confirmed \"" + grievance.getTitle() + "\" is fixed. Ticket closed.");
        } else {
            grievance.setStatus("REOPENED_BY_CITIZEN");
            grievance.setEscalationLevel((grievance.getEscalationLevel() == null ? 0 : grievance.getEscalationLevel()) + 1);
            grievance.setCitizenRejectCount((grievance.getCitizenRejectCount() == null ? 0 : grievance.getCitizenRejectCount()) + 1);
            grievance.setCitizenConfirmationDeadline(null);
            if (citizenNote != null && !citizenNote.isBlank()) {
                grievance.setClosureNotes("[Citizen disputed resolution] " + citizenNote);
            }
            // Give the officer a fresh, shorter SLA window to genuinely fix it this time.
            grievance.setSlaDeadline(ZonedDateTime.now().plusHours(24));
            grievance.setUpdatedAt(ZonedDateTime.now());
            grievanceRepository.save(grievance);

            notificationService.notify(grievance.getAssignedOfficerId(), grievanceId, "STATUS_UPDATE",
                    "Reopened by citizen: " + grievance.getTicketNumber(),
                    "The citizen said \"" + grievance.getTitle() + "\" is NOT actually fixed. It's back on your active tasks with a 24h window.");

            // 🎯 FIX: reopenedComplaintsCount was never incremented anywhere, so the
            // scorecard's "Reopened Rate" was always stuck at 0% regardless of disputes.
            if (grievance.getAssignedOfficerId() != null) {
                com.civicsync.CivicSync_Backend.entity.OfficerPerformanceMetrics metrics = officerMetricsRepository
                        .findByOfficerId(grievance.getAssignedOfficerId())
                        .orElseGet(() -> {
                            com.civicsync.CivicSync_Backend.entity.OfficerPerformanceMetrics m =
                                    new com.civicsync.CivicSync_Backend.entity.OfficerPerformanceMetrics();
                            m.setOfficerId(grievance.getAssignedOfficerId());
                            return m;
                        });
                metrics.setReopenedComplaintsCount(metrics.getReopenedComplaintsCount() + 1);
                officerMetricsRepository.save(metrics);
            }
        }

        return grievance;
    }

    @Override
    public List<GrievanceResponseDTO> getAllGrievances(Long viewingCitizenId) {
        List<Grievance> rawGrievances = grievanceRepository.findAll();

        // 🎯 One query to know which grievances the viewing citizen already upvoted,
        // instead of hitting the DB per-card.
        java.util.Set<Long> myUpvotedGrievanceIds = viewingCitizenId != null
                ? upvoteRepository.findByCitizenId(viewingCitizenId).stream()
                  .map(com.civicsync.CivicSync_Backend.entity.GrievanceUpvote::getGrievanceId)
                  .collect(java.util.stream.Collectors.toSet())
                : java.util.Collections.emptySet();

        return rawGrievances.stream().map(grievance -> {
            GrievanceResponseDTO dto = new GrievanceResponseDTO();
            dto.setId(grievance.getId());
            dto.setCitizenId(grievance.getCitizenId());
            dto.setTitle(grievance.getTitle());
            dto.setDescription(grievance.getDescription());
            dto.setTicketNumber(grievance.getTicketNumber());
            dto.setStatus(grievance.getStatus());
            dto.setPriority(grievance.getPriority());
            dto.setDepartmentId(grievance.getDepartmentId());
            dto.setUpvotes(upvoteRepository.countByGrievanceId(grievance.getId()));
            dto.setUpvotedByMe(
                    viewingCitizenId != null && myUpvotedGrievanceIds.contains(grievance.getId())
            );
            dto.setSlaDeadline(grievance.getSlaDeadline());

            // Include image and video references inside your responses
            dto.setImageUrl(grievance.getImageUrl());
            dto.setVideoUrl(grievance.getVideoUrl());
            dto.setFormattedAddress(grievance.getFormattedAddress());
            dto.setClosureNotes(grievance.getClosureNotes());
            dto.setCompletionPhotoUrl(grievance.getCompletionPhotoUrl());
            dto.setCitizenConfirmationDeadline(grievance.getCitizenConfirmationDeadline());
            dto.setEscalationLevel(grievance.getEscalationLevel());

            if (grievance.getLocationPin() != null) {
                dto.setLongitude(grievance.getLocationPin().getX());
                dto.setLatitude(grievance.getLocationPin().getY());
            }

            if (grievance.getDepartmentId() != null) {
                try {
                    String deptName = jdbcTemplate.queryForObject(
                            "SELECT name FROM departments WHERE id = ? LIMIT 1",
                            String.class,
                            grievance.getDepartmentId()
                    );
                    dto.setDepartment(deptName);
                } catch (Exception e) {
                    dto.setDepartment("General");
                }
            } else {
                dto.setDepartment("General");
            }

            return dto;
        }).toList();
    }

    /**
     * 💾 HELPER: SAVES INCOMING MULTIPART STREAM TO DRIVE EXTENSION DIRECTORY
     */
    private String saveFileToDisk(MultipartFile file, String subFolder) {
        try {
            // Ensure target base directories exist natively
            Path targetFolder = Paths.get(UPLOAD_DIR + subFolder);
            if (!Files.exists(targetFolder)) {
                Files.createDirectories(targetFolder);
            }

            // Generate a random unique file identifier sequence to prevent overriding duplicates
            String uniqueFilename = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Path filePath = targetFolder.resolve(uniqueFilename);

            // Stream bytes out to file storage target location
            Files.copy(file.getInputStream(), filePath);

            // Return serving path resource pointer route mapping
            return "/uploads/" + subFolder + "/" + uniqueFilename;
        } catch (IOException e) {
            System.err.println("Failed to write dynamic file asset block to drive: " + e.getMessage());
            return null;
        }
    }

    /**
     * 🗺️ REVERSE GEOCODE: Turns a lat/lng pin into a human-readable place string
     * (e.g. "Main Bazaar Road, Panruti, Cuddalore District") using OpenStreetMap's
     * free Nominatim reverse-geocoding API, so citizens browsing grievances/the map
     * can see exactly where an issue was filed without needing a paid maps key.
     */
    private String reverseGeocodeAddress(Double latitude, Double longitude) {
        if (latitude == null || longitude == null) return null;
        try {
            String url = String.format(
                    "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=%s&lon=%s&zoom=18&addressdetails=1",
                    latitude, longitude);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    // 🎯 Nominatim's usage policy requires a descriptive User-Agent per request
                    .header("User-Agent", "CivicSync-TamilNadu/1.0 (grievance-address-lookup)")
                    .timeout(Duration.ofSeconds(5))
                    .GET()
                    .build();

            HttpResponse<String> response =
                    httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                if (root.has("display_name")) {
                    return root.get("display_name").asText();
                }
            }
        } catch (Exception e) {
            System.err.println("Reverse geocoding failed for grievance pin: " + e.getMessage());
        }
        return null;
    }

    private Integer fetchDepartmentIdByName(String name) {
        try {
            return jdbcTemplate.queryForObject("SELECT id FROM departments WHERE name = ? LIMIT 1", Integer.class, name);
        } catch (Exception e) {
            return 1;
        }
    }

    private String fetchDepartmentCodeById(Integer id) {
        try {
            return jdbcTemplate.queryForObject("SELECT code FROM departments WHERE id = ? LIMIT 1", String.class, id);
        } catch (Exception e) {
            return "CIV";
        }
    }

    /**
     * ❤️ TOGGLE UPVOTE: Enforces exactly one upvote per citizen per grievance.
     * If the citizen already upvoted, this removes it (un-upvote). Otherwise it adds one.
     * Returns the fresh total count + whether the requesting citizen now has it upvoted.
     */
    @Override
    @Transactional
    public java.util.Map<String, Object> toggleUpvote(Long grievanceId, Long citizenId) {
        if (!grievanceRepository.existsById(grievanceId)) {
            throw new com.civicsync.CivicSync_Backend.exception.ResourceNotFoundException(
                    "Grievance not found with id: " + grievanceId);
        }

        Optional<com.civicsync.CivicSync_Backend.entity.GrievanceUpvote> existing =
                upvoteRepository.findByGrievanceIdAndCitizenId(grievanceId, citizenId);

        boolean nowUpvoted;
        if (existing.isPresent()) {
            // Already upvoted -> remove it (acts as a toggle/un-upvote)
            upvoteRepository.delete(existing.get());
            nowUpvoted = false;
        } else {
            com.civicsync.CivicSync_Backend.entity.GrievanceUpvote vote =
                    new com.civicsync.CivicSync_Backend.entity.GrievanceUpvote();
            vote.setGrievanceId(grievanceId);
            vote.setCitizenId(citizenId);
            upvoteRepository.save(vote);
            nowUpvoted = true;
        }

        Integer freshCount = upvoteRepository.countByGrievanceId(grievanceId);
        return java.util.Map.of(
                "grievanceId", grievanceId,
                "upvotes", freshCount,
                "upvotedByMe", nowUpvoted
        );
    }

    private void determinePriorityAndSla(Grievance g, String category) {
        ZonedDateTime targetTime = ZonedDateTime.now();
        if ("Water Supply".equalsIgnoreCase(category)) {
            g.setPriority("HIGH");
            g.setSlaDeadline(targetTime.plusHours(24));
        } else if ("Electricity".equalsIgnoreCase(category)) {
            g.setPriority("CRITICAL");
            g.setSlaDeadline(targetTime.plusHours(2));
        } else {
            g.setPriority("MEDIUM");
            g.setSlaDeadline(targetTime.plusHours(48));
        }
    }
}