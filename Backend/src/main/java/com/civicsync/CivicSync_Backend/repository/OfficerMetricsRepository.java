package com.civicsync.CivicSync_Backend.repository;

import com.civicsync.CivicSync_Backend.entity.OfficerPerformanceMetrics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OfficerMetricsRepository extends JpaRepository<OfficerPerformanceMetrics, Long> {
    Optional<OfficerPerformanceMetrics> findByOfficerId(Long officerId);
}
