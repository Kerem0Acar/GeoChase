package com.GeoChase.backend.repository;

import com.GeoChase.backend.model.Quest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestRepository extends JpaRepository<Quest,Long> {

    List<Quest> findByPlayerIdOrderByCreatedAtDesc(Long playerId);

    boolean existsByPlayerIdAndStatus(Long playerId, String status);

}
