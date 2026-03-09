package com.GeoChase.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "quests")
@Data
public class Quest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id", nullable = false)
    private Player player;

    @Column(nullable = false)
    private String targetName;

    @Column(nullable = false)
    private Double targetLatitude;

    @Column(nullable = false)
    private Double targetLongitude;

    private String status = "ACTIVE";

    @Column(nullable = false)
    private Integer pointReward;
}
