from fastapi import FastAPI
from pydantic import BaseModel
import random
import requests  # Yeni eklediğimiz kütüphane

app = FastAPI()


# Gelen veri modeli
class AmbushRequest(BaseModel):
    lat: float
    lng: float
    heading: float


# OSRM Navigasyon Motoru - Sokakları hesaplar
def get_street_route(start_lat, start_lng, end_lat, end_lng):
    # DİKKAT EKSEN TUZAĞI: Harita sistemleri Boylam,Enlem (Lng,Lat) sırasıyla çalışır
    url = f"http://router.project-osrm.org/route/v1/foot/{start_lng},{start_lat};{end_lng},{end_lat}?overview=full&geometries=geojson"

    try:
        response = requests.get(url)
        data = response.json()

        if data.get("code") == "Ok":
            # OSRM rotayı [lng, lat] olarak verir, Leaflet için [lat, lng] formatına çeviriyoruz
            route_coords = data["routes"][0]["geometry"]["coordinates"]
            leaflet_route = [{"lat": coord[1], "lng": coord[0]} for coord in route_coords]
            return leaflet_route
    except Exception as e:
        print("Navigasyon Hatası:", e)

    return []  # Eğer yol bulamazsa boş liste döner


@app.post("/api/zombies/ambush")
def trigger_ambush(request: AmbushRequest):
    zombies = []
    zombie_types = ["Sokak Gezgini", "Sıçrayan", "Avcı"]

    # 3 Adet zombi oluşturuyoruz
    for i in range(3):
        # Oyuncunun 100-300 metre etrafında rastgele spawn noktaları
        offset_lat = random.uniform(-0.003, 0.003)
        offset_lng = random.uniform(-0.003, 0.003)

        z_lat = request.lat + offset_lat
        z_lng = request.lng + offset_lng

        # Zombinin oyuncuya ulaşması gereken sokak rotasını hesapla
        route = get_street_route(z_lat, z_lng, request.lat, request.lng)

        zombies.append({
            "type": zombie_types[i],
            "lat": z_lat,  # Başlangıç noktası
            "lng": z_lng,
            "route": route  # Zombinin adım adım yürüyeceği yol haritası
        })

    return {"message": "Zombiler yola çıktı", "zombies": zombies}