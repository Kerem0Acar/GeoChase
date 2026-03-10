package com.GeoChase.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class QuestResponse {
    private Long id;
    private String targetName;
    private String status;
    private Integer pointsReward;
    private LocalDateTime createdAt;
}
