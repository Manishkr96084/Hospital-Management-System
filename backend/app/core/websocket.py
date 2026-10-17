from typing import List, Dict, Any
from fastapi import WebSocket
import json

class ConnectionManager:
    def __init__(self):
        # channel_name -> list of connected WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {
            "opd_queue": [],
            "bed_status": [],
            "emergency_alerts": [],
            "mar_updates": [],
            "notifications": [],
            "general": []
        }

    async def connect(self, websocket: WebSocket, channel: str = "general"):
        await websocket.accept()
        if channel not in self.active_connections:
            self.active_connections[channel] = []
        self.active_connections[channel].append(websocket)

    def disconnect(self, websocket: WebSocket, channel: str = "general"):
        if channel in self.active_connections and websocket in self.active_connections[channel]:
            self.active_connections[channel].remove(websocket)

    async def broadcast(self, channel: str, message: Dict[str, Any]):
        if channel in self.active_connections:
            payload = json.dumps(message)
            dead_connections = []
            for connection in self.active_connections[channel]:
                try:
                    await connection.send_text(payload)
                except Exception:
                    dead_connections.append(connection)
            for dead in dead_connections:
                self.disconnect(dead, channel)

manager = ConnectionManager()
