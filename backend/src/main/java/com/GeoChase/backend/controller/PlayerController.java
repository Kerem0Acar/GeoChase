package com.GeoChase.backend.controller;

import com.GeoChase.backend.model.Player;
import com.GeoChase.backend.repository.PlayerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/players")
public class PlayerController {

    @Autowired
    private PlayerRepository playerRepository;

    @PostMapping("/register")
    public ResponseEntity<?> registerPlayer(@RequestBody Player player) {
        if(playerRepository.existsByUsername(player.getUsername())) {
            return ResponseEntity.badRequest().body("Error: Username is already in taken");
        }

        if(playerRepository.existsByEmail(player.getEmail())) {
            return ResponseEntity.badRequest().body("Error: Email is already in use");
        }

        Player savedPlayer = playerRepository.save(player);
        return ResponseEntity.ok().body(savedPlayer);
    }

}
