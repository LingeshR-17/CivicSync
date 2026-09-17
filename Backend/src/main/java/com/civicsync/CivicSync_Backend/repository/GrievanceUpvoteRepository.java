package com.civicsync.CivicSync_Backend.repository;

import com.civicsync.CivicSync_Backend.entity.GrievanceUpvote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GrievanceUpvoteRepository extends JpaRepository<GrievanceUpvote, Long> {

    Integer countByGrievanceId(Long grievanceId);

    Optional<GrievanceUpvote> findByGrievanceIdAndCitizenId(Long grievanceId, Long citizenId);

    boolean existsByGrievanceIdAndCitizenId(Long grievanceId, Long citizenId);

    // 🎯 Lets us fetch "which grievances has this citizen upvoted" in one query
    // so getAllGrievances() can mark upvotedByMe without N extra queries.
    List<GrievanceUpvote> findByCitizenId(Long citizenId);
}
