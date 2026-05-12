from fastapi import FastAPI
from pydantic import BaseModel
from ZombieSpawner import ZombieSpawner


app = FastAPI(title="GeoChase AI Servisi")

class PlayerData(BaseModel):
    lat: float
    lng: float
    heading: float


@app.get("/")
def check_status():
    return {"status": "Zombi Yapay Zeka Motoru Çevrimiçi! 🧟‍♂️"}

@app.post("/api/zombies/ambush")
def create_ambush(data: PlayerData):

    threats = ZombieSpawner.generate_ambush(data.lat, data.lng, data.heading)

    return {"message": "Pusu kuruldu!", "zombies": threats}
