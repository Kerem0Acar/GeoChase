package com.GeoChase.backend.controller;

import com.GeoChase.backend.dto.LeaderboardResponse;
import com.GeoChase.backend.dto.LoginRequest;
import com.GeoChase.backend.model.Player;
import com.GeoChase.backend.repository.PlayerRepository;
import com.GeoChase.backend.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/players")
public class PlayerController {

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<?> registerPlayer(@RequestBody Player player) {
        if(playerRepository.existsByUsername(player.getUsername())) {
            return ResponseEntity.badRequest().body("Error: Username is already in taken");
        }

        if(playerRepository.existsByEmail(player.getEmail())) {
            return ResponseEntity.badRequest().body("Error: Email is already in use");
        }

        String plainPassword = player.getPassword();
        String hashedPassword = passwordEncoder.encode(plainPassword);
        player.setPassword(hashedPassword);

        Player savedPlayer = playerRepository.save(player);
        return ResponseEntity.ok().body(savedPlayer);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        Optional<Player> playerOptional = playerRepository.findByUsername(loginRequest.getUsername());

        if(playerOptional.isEmpty()) {
            return ResponseEntity.status(401).body("Error: Invalid username or password!");
        }

        Player player = playerOptional.get();

        if (!passwordEncoder.matches(loginRequest.getPassword(), player.getPassword())) {
            return ResponseEntity.status(401).body("Error: Invalid username or password!");
        }

        String token = jwtUtil.generateToken(player.getUsername());

        Map<String, String> response = new HashMap<>();
        response.put("message", "Successfully logged in! Welcome back, " + player.getUsername());
        response.put("token", token);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getUserProfile() {
        String username = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();

        return ResponseEntity.ok("Successfully logged in "+ username + " with JWT password!" );
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<?> getLeaderboard(){

        List<Player> topPlayers = playerRepository.findTop10ByOrderByScoreDesc();

        List<LeaderboardResponse> leaderboard = topPlayers.stream()
                .map(p -> new LeaderboardResponse(p.getUsername(), p.getScore()))
                .toList();

        return ResponseEntity.ok(leaderboard);
    }


}
