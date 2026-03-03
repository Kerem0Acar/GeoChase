# GeoChase 🏃‍♂️🌍
> AI-Driven Location-Based Exergaming Platform

GeoChase is an interdisciplinary mobile "exergaming" application designed to gamify physical activity (running/walking) using real-world map integration, geospatial algorithms, and real-time multiplayer mechanics.

## 🚀 Key Features

* **Survival Mode (Interval Training):** A single-player mode where users are chased by virtual threats. It combines physical interval training with mandatory rest periods that feature an interactive trivia module.
* **Competitive Race Mode:** Race against real players or AI-controlled bots. The system calculates a strictly equidistant finish line for all participants based on real-world walking distance, regardless of their starting locations.
* **Real-Time Sabotage:** Players can trigger abilities via WebSockets to disrupt opponents, such as:
  * *Map Blindness:* Temporarily disables the opponent's map visibility.
  * *Route Diversion:* Forces the opponent to pass through a dynamically generated mandatory checkpoint.
* **AI Bot Simulation:** If no players are nearby, the system generates AI bots that navigate the real street graph at a simulated human pace.

## 🛠️ Tech Stack & Architecture

GeoChase operates on a microservices-inspired architecture to separate state management from heavy geospatial computation.

* **Frontend (Mobile):** `Ionic Framework` / `Angular` (Cross-platform UI and Map SDK integration).
* **Core Backend:** `Java Spring Boot` (User authentication, real-time WebSocket communication, state management).
* **Geospatial & AI Engine:** `Python` (`FastAPI`/`Flask`, `OSMnx`) for calculating equidistant midpoints on street graphs and simulating bot navigation.
* **Database:** `PostgreSQL` (with `PostGIS` extension for spatial data queries).

## 📐 High-Level Data Flow
1. The **Ionic** mobile app sends real-time GPS coordinates to the **Spring Boot** server.
2. Spring Boot requests routing and AI calculations from the **Python** microservice.
3. Python processes the real-world street graph and returns the target coordinates/bot positions.
4. Spring Boot syncs the game state across all active clients via WebSockets with sub-200ms latency.

## ⚙️ Installation & Setup (WIP)
*Instructions for setting up the local development environment will be added here as the project progresses.*

### Prerequisites
* Java 17+
* Python 3.9+
* Node.js & Ionic CLI
* PostgreSQL with PostGIS

## 👥 Contributors
* [Kerem ACAR]

---
*Developed as a Software Design Applications project for the 2025-2026 Academic Year Spring Semester.*
