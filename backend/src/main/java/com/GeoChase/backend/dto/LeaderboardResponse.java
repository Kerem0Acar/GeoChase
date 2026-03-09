package com.GeoChase.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LeaderboardResponse {

    private String username;
    private Integer score;

}
