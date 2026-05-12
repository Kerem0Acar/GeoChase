package com.GeoChase.backend.service;

import com.GeoChase.backend.dto.AmbushRequest;
import com.GeoChase.backend.dto.AmbushResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class AiIntegrationService {

    private final RestTemplate restTemplate = new RestTemplate();

    private final String AI_MICROSERVICE_URL = "http://127.0.0.1:8000/api/zombies/ambush";

    public AmbushResponse calculateAmbushPoints(AmbushRequest ambushRequest) {
        ResponseEntity<AmbushResponse> response = restTemplate.postForEntity(
                AI_MICROSERVICE_URL,
                ambushRequest,
                AmbushResponse.class
        );
        return response.getBody();
    }

}
