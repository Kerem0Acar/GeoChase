package com.GeoChase.backend.repository;

import com.GeoChase.backend.model.Player;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PlayerRepository extends JpaRepository<Player, String> {


    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    Optional<Player> findByUsername(String username);
}
