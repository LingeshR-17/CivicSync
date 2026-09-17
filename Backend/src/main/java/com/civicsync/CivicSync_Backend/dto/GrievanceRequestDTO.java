package com.civicsync.CivicSync_Backend.dto;

public class GrievanceRequestDTO {

    private String title;
    private String description;
    private String category; // Maps to department name fallback string
    private Integer departmentId; // 🎯 ADDED: To capture numeric sector targets directly
    private Double latitude;
    private Double longitude;

    // --- Getters and Setters ---

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    // 🎯 ADDED: Getter for departmentId
    public Integer getDepartmentId() {
        return departmentId;
    }

    // 🎯 ADDED: Setter for departmentId
    public void setDepartmentId(Integer departmentId) {
        this.departmentId = departmentId;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }
}