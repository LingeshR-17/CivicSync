package com.civicsync.CivicSync_Backend.repository;

import com.civicsync.CivicSync_Backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByPhoneNumber(String phoneNumber);
    boolean existsByEmail(String email);
    boolean existsByPhoneNumber(String phoneNumber);

    // ⏰ SLA ESCALATION: who to notify when a ticket blows past SLA repeatedly.
    // Prefer a supervisor in the same department; fall back to any supervisor.
    List<User> findByRoleAndDepartmentId(String role, Integer departmentId);
    List<User> findByRole(String role);

    // 🧭 SUPERVISOR MANUAL ROUTING: candidate field officers for a specific ward + department,
    // so a supervisor can hand-assign a ticket that the auto-routing engine couldn't place
    // (no officer seeded for that ward/department combo).
    List<User> findByRoleAndWardIdAndDepartmentId(String role, Integer wardId, Integer departmentId);
}