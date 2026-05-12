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
    # 0: Sokak Gezgini (Rotalı), 1: Sıçrayan (Kuş Uçuşu), 2: Avcı (Rotalı)
    zombie_types = ["Sokak Gezgini", "Sıçrayan", "Avcı"]

    for i in range(3):
        z_lat = request.lat + random.uniform(-0.010, 0.010)
        z_lng = request.lng + random.uniform(-0.010, 0.010)

        # Sıçrayan zombi (i == 1) için navigasyon rotası hesaplamıyoruz, boş liste gönderiyoruz
        route = [] if i == 1 else get_street_route(z_lat, z_lng, request.lat, request.lng)

        zombies.append({
            "type": zombie_types[i],
            "lat": z_lat,
            "lng": z_lng,
            "route": route
        })
    return {"zombies": zombies}