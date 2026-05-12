package com.GeoChase.backend.dto;

import lombok.Data;

@Data
public class AmbushRequest {
    private double lat;
    private double lng;
    private double heading;
}
