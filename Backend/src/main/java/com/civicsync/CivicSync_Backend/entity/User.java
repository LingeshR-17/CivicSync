package com.civicsync.CivicSync_Backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.ZonedDateTime;

@Entity
@Table(name = "enterprise_users")
@Data
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "phone_number", nullable = false, unique = true)
    private String phoneNumber;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String role = "CITIZEN"; // CITIZEN, FIELD_OFFICER, SUPERVISOR, etc.

    @Column(name = "department_id")
    private Integer departmentId;

    @Column(name = "ward_id")
    private Integer wardId;

    // 🎯 Human-readable location fields captured during registration (auto-detected)
    @Column(name = "city")
    private String city;

    @Column(name = "district")
    private String district;

    @Column(name = "ward_name")
    private String ward;

    @Column(name = "is_verified")
    private Boolean isVerified = false;

    @Column(name = "google_id")
    private String googleId;

    @Column(name = "created_at", insertable = false, updatable = false)
    private ZonedDateTime createdAt;
}