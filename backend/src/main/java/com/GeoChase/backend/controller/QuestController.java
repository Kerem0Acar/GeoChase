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

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/quests")
@io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "Bearer Authentication")
@CrossOrigin(origins = "*")
public class QuestController {

    @Autowired
    private QuestRepository questRepository;

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private RadarService radarService;




    @PostMapping("/generate")
    public ResponseEntity<?> generateDynamicQuests(@RequestBody QuestRequest questRequest) {
        try {
            Player player = getCurrentAuthenticatedPlayer();

            if (questRepository.existsByPlayerIdAndStatus(player.getId(), "ACTIVE")) {
                return ResponseEntity.status(400).body("You have already active quests!");
            }

            // YENİ EKLENEN KOD: Yeni tarama yapmadan önce, eski "Kabul Edilmemiş" (PENDING) görevleri temizle
            List<Quest> oldPendings = questRepository.findByPlayerIdAndStatus(player.getId(), "PENDING");
            if (!oldPendings.isEmpty()) {
                questRepository.deleteAll(oldPendings);
            }

            List<Quest> generatedQuests = new ArrayList<>();
            String[] adjectives = {"Gizli", "Şifreli", "Karanlık", "Kayıp", "Efsanevi"};
            String[] nouns = {"Veri Terminali", "Kripto Anahtarı", "Sinyal Vericisi", "Sunucu Çekirdeği", "Siber Kasa"};

            for (int i = 0; i < 5; i++) {
                double randomLatOffset = (Math.random() - 0.5) * 0.015;
                double randomLonOffset = (Math.random() - 0.5) * 0.015;

                double targetLat = questRequest.getUserLatitude() + randomLatOffset;
                double targetLon = questRequest.getUserLongitude() + randomLonOffset;
                String targetName = adjectives[i] + " " + nouns[i];

                if (i == 0) {
                    try {
                        Map<String, Object> realTarget = radarService.findRealWorldTarget(questRequest.getUserLatitude(), questRequest.getUserLongitude());
                        targetLat = (Double) realTarget.get("lat");
                        targetLon = (Double) realTarget.get("lon");
                        targetName = (String) realTarget.get("name");
                    } catch (Exception ignored) { }
                }

                double distanceInMeters = LocationUtil.calculateDistance(questRequest.getUserLatitude(), questRequest.getUserLongitude(), targetLat, targetLon);
                int calculatedPointReward = 50 + (int) (distanceInMeters / 10);
                String difficultyLevel = distanceInMeters > 500 ? "Zor" : (distanceInMeters > 200 ? "Orta" : "Kolay");

                Quest newQuest = new Quest();
                newQuest.setPlayer(player);
                newQuest.setTargetName(targetName);
                newQuest.setTargetLatitude(targetLat);
                newQuest.setTargetLongitude(targetLon);
                newQuest.setPointReward(calculatedPointReward);
                newQuest.setDifficulty(difficultyLevel);

                // 🛠️ BURASI DEĞİŞTİ: Artık direkt ACTIVE olmuyorlar, PENDING (Bekliyor) oluyorlar!
                newQuest.setStatus("PENDING");

                generatedQuests.add(newQuest);
            }

            questRepository.saveAll(generatedQuests);
            return ResponseEntity.ok(generatedQuests);
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    @PostMapping("/{questId}/accept")
    public ResponseEntity<?> acceptQuest(@PathVariable Long questId) {
        try {
            Player player = getCurrentAuthenticatedPlayer();
            Quest quest = questRepository.findById(questId)
                    .orElseThrow(() -> new RuntimeException("Hata: Görev bulunamadı!"));

            if (!quest.getPlayer().getId().equals(player.getId())) {
                return ResponseEntity.status(403).body("Hata: Bu görev sana ait değil!");
            }
            if (!quest.getStatus().equals("PENDING")) {
                return ResponseEntity.status(400).body("Hata: Bu görev kabul edilebilir durumda değil!");
            }

            // 1. Seçilen görevi ACTIVE (Aktif) yap
            quest.setStatus("ACTIVE");
            questRepository.save(quest);

            // 2. Diğer 4 tane seçilmeyen (PENDING) görevi bul ve veritabanından sil (Sistemi temiz tut)
            List<Quest> otherPendings = questRepository.findByPlayerIdAndStatus(player.getId(), "PENDING");
            if (!otherPendings.isEmpty()) {
                questRepository.deleteAll(otherPendings);
            }

            return ResponseEntity.ok("Görev başarıyla kabul edildi! Diğer sinyaller haritadan silindi.");
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    @PostMapping("/{questId}/complete")
    public ResponseEntity<?> completeQuest(@PathVariable Long questId, @RequestBody QuestRequest questRequest) {
        try {
            Player player = getCurrentAuthenticatedPlayer();

            Quest quest = questRepository.findById(questId)
                    .orElseThrow(() -> new RuntimeException("Error: Quest not found!"));

            if (!quest.getPlayer().getId().equals(player.getId())) {
                return ResponseEntity.status(403).body("Error: You don't own this quest!");
            }
            if (!quest.getStatus().equals("ACTIVE")) {
                return ResponseEntity.status(400).body("Error: Quest is already completed or failed!");
            }

            double distanceInMeters = LocationUtil.calculateDistance(
                    questRequest.getUserLatitude(), questRequest.getUserLongitude(),
                    quest.getTargetLatitude(), quest.getTargetLongitude()
            );

            if (distanceInMeters <= 50.0) {
                quest.setStatus("COMPLETED");

                int newTotalScore = player.getScore() + quest.getPointReward();
                player.setScore(newTotalScore);

                String levelUpMessage = "";
                if (newTotalScore >= 2000 && player.getLevel() < 4) {
                    player.setLevel(4);
                    player.setTitle("Legendary Scout");
                    levelUpMessage = "LEVEL UP! New title: Legendary Scout!";
                } else if (newTotalScore >= 1000 && player.getLevel() < 3) {
                    player.setLevel(3);
                    player.setTitle("Master");
                    levelUpMessage = "LEVEL UP! New title: Master!";
                } else if (newTotalScore >= 500 && player.getLevel() < 2) {
                    player.setLevel(2);
                    player.setTitle("Traveler");
                    levelUpMessage = "LEVEL UP! New title: Traveler!";
                }

                questRepository.save(quest);
                playerRepository.save(player);

                return ResponseEntity.ok("Congrats! You reach the goal. Earning Point: " + quest.getPointReward() + ". Total Point: " + player.getScore() + " " + levelUpMessage);
            } else {
                return ResponseEntity.status(400).body("Remaining distance: " + Math.round(distanceInMeters) + " metre.");
            }
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    @GetMapping("/my-quests")
    public ResponseEntity<?> getMyQuests() {
        try {
            Player player = getCurrentAuthenticatedPlayer();
            List<Quest> myQuests = questRepository.findByPlayerIdOrderByCreatedAtDesc(player.getId());

            List<QuestResponse> questHistory = myQuests.stream()
                    .map(q -> new QuestResponse(
                            q.getId(),
                            q.getTargetName(),
                            q.getStatus(),
                            q.getPointReward(),
                            q.getCreatedAt(),
                            q.getTargetLatitude(),
                            q.getTargetLongitude(),
                            q.getDifficulty()
                    )).toList();

            return ResponseEntity.ok(questHistory);
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    @PostMapping("/{questId}/abandon")
    public ResponseEntity<?> abandonQuest(@PathVariable Long questId) {
        try {
            Player player = getCurrentAuthenticatedPlayer();
            Quest quest = questRepository.findById(questId)
                    .orElseThrow(() -> new RuntimeException("Error: Quest not found!"));

            if (!quest.getPlayer().getId().equals(player.getId())) {
                return ResponseEntity.status(403).body("Error: You don't own this quest!");
            }
            if (!quest.getStatus().equals("ACTIVE")) {
                return ResponseEntity.status(400).body("Error: Quest is already completed or failed!");
            }

            quest.setStatus("ABANDONED");
            questRepository.save(quest);

            return ResponseEntity.ok("Quest has been abandoned!");
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    private Player getCurrentAuthenticatedPlayer() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return playerRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Error: Player not found!"));
    }
}