import math

class ZombieSpawner:
    EARTH_RADIUS = 6371000.0  # Dünya yarıçapı (metre)

    @staticmethod
    def calculate_target_coordinate(lat, lng, bearing_degrees, distance_meters):
        """
        Verilen bir koordinattan, belirli bir açı (bearing) ve mesafedeki yeni koordinatı hesaplar.
        """
        lat_rad = math.radians(lat)
        lng_rad = math.radians(lng)
        bearing_rad = math.radians(bearing_degrees)

        # Yeni enlem (Latitude) hesaplaması
        new_lat_rad = math.asin(
            math.sin(lat_rad) * math.cos(distance_meters / ZombieSpawner.EARTH_RADIUS) +
            math.cos(lat_rad) * math.sin(distance_meters / ZombieSpawner.EARTH_RADIUS) * math.cos(bearing_rad)
        )

        # Yeni boylam (Longitude) hesaplaması
        new_lng_rad = lng_rad + math.atan2(
            math.sin(bearing_rad) * math.sin(distance_meters / ZombieSpawner.EARTH_RADIUS) * math.cos(lat_rad),
            math.cos(distance_meters / ZombieSpawner.EARTH_RADIUS) - math.sin(lat_rad) * math.sin(new_lat_rad)
        )

        return math.degrees(new_lat_rad), math.degrees(new_lng_rad)

    @classmethod
    def generate_ambush(cls, player_lat, player_lng, player_heading):
        """
        Oyuncunun yönüne göre 3 farklı tehdit noktası (zombi) oluşturur.
        """
        zombies = []

        # 1. BARİKAT (Sokak Gezgini): Oyuncunun tam önünde 250m
        front_lat, front_lng = cls.calculate_target_coordinate(player_lat, player_lng, player_heading, 250.0)
        zombies.append({"type": "WALKER", "lat": front_lat, "lng": front_lng})

        # 2. SAĞ KANAT (Sıçrayan): Ön-sağ çaprazda (Yön + 45 derece), 150m
        flank_heading = (player_heading + 45) % 360
        flank_lat, flank_lng = cls.calculate_target_coordinate(player_lat, player_lng, flank_heading, 150.0)
        zombies.append({"type": "LEAPER", "lat": flank_lat, "lng": flank_lng})

        # 3. ENSE TAKİBİ (Avcı): Tam arkada (Yön - 180 derece), 100m
        tail_heading = (player_heading + 180) % 360
        tail_lat, tail_lng = cls.calculate_target_coordinate(player_lat, player_lng, tail_heading, 100.0)
        zombies.append({"type": "HOUND", "lat": tail_lat, "lng": tail_lng})

        return zombies

# --- TEST OPERASYONU ---
# Oyuncu Kuzeye (0 derece) doğru gidiyor.
pusu_noktalari = ZombieSpawner.generate_ambush(38.7205, 35.4826, 0.0)

for z in pusu_noktalari:
    print(f"Tehdit Algılandı! Tür: {z['type']} | Konum: {z['lat']:.5f}, {z['lng']:.5f}")