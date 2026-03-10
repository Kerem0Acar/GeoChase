package com.GeoChase.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class PlayerProfileResponse {
    private String username;
    private String email;
    private Integer score;
    private Integer level;
    private String title;


}
