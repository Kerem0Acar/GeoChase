package com.GeoChase.backend.controller;

import com.GeoChase.backend.dto.AmbushRequest;
import com.GeoChase.backend.dto.AmbushResponse;
import com.GeoChase.backend.service.AiIntegrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/zombies")
@CrossOrigin(origins = "*")
public class ZombieController {

    @Autowired
    private AiIntegrationService aiIntegrationService;

    @PostMapping("/ambush")
    public ResponseEntity<?> triggerZombieAmbush(@RequestBody AmbushRequest ambushRequest) {
        try{
            AmbushResponse threats = aiIntegrationService.calculateAmbushPoints(ambushRequest);
            return ResponseEntity.ok(threats);
        }catch (Exception e){
            return ResponseEntity.status(503).body("The AI Command Center is unreachable: "+ e.getMessage());
        }
    }

}
