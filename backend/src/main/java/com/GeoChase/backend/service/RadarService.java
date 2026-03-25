package com.GeoChase.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class RadarService {

    public Map<String, Object> findRealWorldTarget(double lat, double lon) {
        RestTemplate restTemplate = new RestTemplate();

        // 1. RADAR GÜNCELLEMESİ:
        // ["amenity"]["name"] -> Sadece "Tesis" (Kafe, Restoran, Eczane, Okul vb.) olan ve "İsmi" olan yerleri bul.
        // out 10 -> Etraftaki 10 farklı mekanı getir (oyun dinamik olsun diye).
        String overpassQuery = "[out:json];node(around:1500," + lat + "," + lon + ")[\"amenity\"][\"name\"];out 10;";

        try {
            URI uri = UriComponentsBuilder.fromUriString("https://overpass-api.de/api/interpreter")
                    .queryParam("data", overpassQuery)
                    .build()
                    .encode()
                    .toUri();

            Map<String, Object> response = restTemplate.getForObject(uri, Map.class);
            List<Map<String, Object>> elements = (List<Map<String, Object>>) response.get("elements");

            if (elements != null && !elements.isEmpty()) {

                // 2. OYUN MEKANİĞİ: Bulunan mekanlar arasından RASTGELE birini seç!
                int randomIndex = (int) (Math.random() * elements.size());
                Map<String, Object> place = elements.get(randomIndex);

                Map<String, String> tags = (Map<String, String>) place.get("tags");

                String targetName = tags.get("name");
                Double targetLat = ((Number) place.get("lat")).doubleValue();
                Double targetLon = ((Number) place.get("lon")).doubleValue();

                System.out.println("RADAR TESPİTİ: " + targetName + " bulundu! (Seçilen Index: " + randomIndex + ")");

                return Map.of(
                        "name", targetName,
                        "lat", targetLat,
                        "lon", targetLon
                );
            }
        } catch (Exception e) {
            // 🛡️ B PLANI (FALLBACK): Overpass API çöktüyse oyunu durdurma!
            // Oyuncunun 200-300 metre yakınına "Yedek" bir hedef at.
            System.err.println("Overpass API Çöktü/Gecikti! Yedek plan devreye giriyor. Hata: " + e.getMessage());

            Map<String, Object> fallbackTarget = new HashMap<>();

            // Koordinatlara ufak rastgele bir sapma ekliyoruz (Yaklaşık 200-300 metre)
            double randomLatOffset = (Math.random() - 0.5) * 0.005;
            double randomLonOffset = (Math.random() - 0.5) * 0.005;

            fallbackTarget.put("lat", lat + randomLatOffset);
            fallbackTarget.put("lon", lon + randomLonOffset);
            fallbackTarget.put("name", "Gizli Veri Terminali (Yedek Sinyal)");

            return fallbackTarget;
        }

        return Map.of(
                "name", "Gizli Sığınak",
                "lat", lat + 0.005,
                "lon", lon + 0.005
        );
    }
}