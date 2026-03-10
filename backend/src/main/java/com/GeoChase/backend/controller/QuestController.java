package com.GeoChase.backend.controller;

import com.GeoChase.backend.dto.QuestRequest;
import com.GeoChase.backend.dto.QuestResponse;
import com.GeoChase.backend.model.Player;
import com.GeoChase.backend.model.Quest;
import com.GeoChase.backend.repository.PlayerRepository;
import com.GeoChase.backend.repository.QuestRepository;
import com.GeoChase.backend.service.RadarService;
import com.GeoChase.backend.util.LocationUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/quests")
public class QuestController {

    @Autowired
    private QuestRepository questRepository;

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private RadarService radarService;

    @PostMapping("/generate")
    public ResponseEntity<?> generateDynamicQuest(@RequestBody QuestRequest questRequest) {

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<Player> optionalPlayer = playerRepository.findByUsername(username);

        if(optionalPlayer.isEmpty()){
            return ResponseEntity.status(404).body("Player not found!");
        }

        Player player = optionalPlayer.get();

        boolean hasActiveQuest = questRepository.existsByPlayerIdAndStatus(player.getId(), "ACTIVE");
        if(hasActiveQuest){
            return ResponseEntity.status(400).body("You already have an active task! You must complete or cancel the current task before setting a new goal.");
        }

        Map<String, Object> targetLocation = radarService.findRealWorldTarget(questRequest.getUserLatitude(), questRequest.getUserLongitude());

        Quest newQuest = new Quest();
        newQuest.setPlayer(player);
        newQuest.setTargetName((String) targetLocation.get("name")); // Gerçek mekanın adı!
        newQuest.setTargetLatitude((Double) targetLocation.get("lat"));
        newQuest.setTargetLongitude((Double) targetLocation.get("lon"));
        newQuest.setPointReward(100);
        newQuest.setStatus("ACTIVE");

        Quest savedQuest = questRepository.save(newQuest);

        return ResponseEntity.ok(savedQuest);

    }

    @PostMapping("/{questId}/complete")
    public ResponseEntity<?> completeQuest(@PathVariable Long questId, @RequestBody QuestRequest questRequest) {

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<Player> optionalPlayer = playerRepository.findByUsername(username);

        if (optionalPlayer.isEmpty()) {
            return ResponseEntity.status(404).body("Error: Player not found!");
        }
        Player player = optionalPlayer.get();

        Optional<Quest> questOptional = questRepository.findById(questId);
        if (questOptional.isEmpty()) {
            return ResponseEntity.status(404).body("Error: Quest not found!");
        }
        Quest quest = questOptional.get();

        if(!quest.getPlayer().getId().equals(player.getId())){
            return ResponseEntity.status(403).body("Error: You don't own this quest!");
        }
        if (!quest.getStatus().equals("ACTIVE")) {
            return ResponseEntity.status(400).body("Error: Quest is already completed or failed!");
        }

        // 4. HAVERSINE DEVREDE: Mesafeyi ölç!
        double distanceInMeters = LocationUtil.calculateDistance(
                questRequest.getUserLatitude(), questRequest.getUserLongitude(),
                quest.getTargetLatitude(), quest.getTargetLongitude()
        );

        // 5. Hedefe 50 metre veya daha fazla yaklaştı mı? (Tolerans mesafesi)
        if (distanceInMeters <= 50.0) {
            // BAŞARILI!
            quest.setStatus("COMPLETED");
            player.setScore(player.getScore() + quest.getPointReward()); // Puanı oyuncuya ekle

            questRepository.save(quest);
            playerRepository.save(player);

            return ResponseEntity.ok("Congrats! You reach the goal. Earning Point: " + quest.getPointReward() + ". Total Point: " + player.getScore());
        } else {
            // BAŞARISIZ: Henüz yeterince yakın değil
            return ResponseEntity.status(400).body("Remaining distance: " + Math.round(distanceInMeters) + " metre.");
        }

    }

    @GetMapping("/my-quests")
    public ResponseEntity<?> getMyQuests(){
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<Player> optionalPlayer = playerRepository.findByUsername(username);

        if (optionalPlayer.isEmpty()) {
            return ResponseEntity.status(404).body("Error: Player not found!");
        }

        Player player = optionalPlayer.get();

        List<Quest> myQuests = questRepository.findByPlayerIdOrderByCreatedAtDesc(player.getId());

        List<QuestResponse> questHistory = myQuests.stream()
                .map(q -> new QuestResponse(
                        q.getId(),
                        q.getTargetName(),
                        q.getStatus(),
                        q.getPointReward(),
                        q.getCreatedAt()
                )).toList();

        return ResponseEntity.ok(questHistory);
    }

    @PostMapping("/{questId}/abandon")
    public ResponseEntity<?> abandonQuest(@PathVariable Long questId){
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<Player> optionalPlayer = playerRepository.findByUsername(username);

        if (optionalPlayer.isEmpty()) {
            return ResponseEntity.status(404).body("Error: Player not found!");
        }
        Player player = optionalPlayer.get();

        Optional<Quest> questOptional = questRepository.findById(questId);
        if (questOptional.isEmpty()) {
            return ResponseEntity.status(404).body("Error: Quest not found!");
        }
        Quest quest = questOptional.get();

        if(!quest.getPlayer().getId().equals(player.getId())){
            return ResponseEntity.status(403).body("Error: You don't own this quest!");
        }

        if(!quest.getStatus().equals("ACTIVE")){
            return ResponseEntity.status(400).body("Error: Quest is already completed or failed!");
        }

        quest.setStatus("ABANDONED");
        questRepository.save(quest);

        return ResponseEntity.ok("Quest has been abandoned!");
    }


}
