package com.GeoChase.backend.dto;

import lombok.Data;

@Data
public class ZombieThreat {
    private String type;
    private double lat;
    private double lng;
}
