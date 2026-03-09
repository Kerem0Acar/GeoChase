package com.GeoChase.backend.controller;

import com.GeoChase.backend.dto.QuestRequest;
import com.GeoChase.backend.model.Player;
import com.GeoChase.backend.model.Quest;
import com.GeoChase.backend.repository.PlayerRepository;
import com.GeoChase.backend.repository.QuestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequestMapping("/api/quests")
public class QuestController {

    @Autowired
    private QuestRepository questRepository;

    @Autowired
    private PlayerRepository playerRepository;

    @PostMapping("/generate")
    public ResponseEntity<?> generateDynamicQuest(@RequestBody QuestRequest questRequest) {

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<Player> optionalPlayer = playerRepository.findByUsername(username);

        if(optionalPlayer.isEmpty()){
            return ResponseEntity.status(404).body("Player not found!");
        }

        Player player = optionalPlayer.get();

        double targetLat = questRequest.getUserLatitude() + (Math.random() * 0.02 - 0.01);
        double targetLong = questRequest.getUserLongitude() + (Math.random() * 0.02 - 0.01);

        Quest newQuest = new Quest();
        newQuest.setPlayer(player);
        newQuest.setTargetName("To be get");
        newQuest.setTargetLatitude(targetLat);
        newQuest.setTargetLongitude(targetLong);
        newQuest.setPointReward(100);
        newQuest.setStatus("ACTIVE");

        Quest savedQuest = questRepository.save(newQuest);

        return ResponseEntity.ok(savedQuest);

    }
}
