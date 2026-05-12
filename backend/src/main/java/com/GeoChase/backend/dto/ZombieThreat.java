package com.GeoChase.backend.dto;

import lombok.Data;

import java.util.List;

@Data
public class ZombieThreat {
    private String type;
    private double lat;
    private double lng;
    private List<RoutePoint> route;

    @Data
    public static class RoutePoint {
        private double lat;
        private double lng;
    }
}
