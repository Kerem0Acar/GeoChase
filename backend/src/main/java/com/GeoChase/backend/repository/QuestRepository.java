package com.GeoChase.backend.repository;

import com.GeoChase.backend.model.Quest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QuestRepository extends JpaRepository<Quest,Long> {
}
