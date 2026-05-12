package com.GeoChase.backend.dto;

import lombok.Data;

import java.util.List;

@Data
public class AmbushResponse {
    private String message;
    private List<ZombieThreat> zombies;
}
