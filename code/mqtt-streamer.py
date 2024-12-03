"""MQTT to Supabase Bridge Service.

 By Peter Machona - for Heysalad & Seeedstudio
 
3rd Decemeber 2024, London UK.

This module implements a service that bridges MQTT messages to Supabase storage.
It subscribes to configured MQTT topics and stores the received data in a Supabase
database. The service includes comprehensive error handling, logging, and automatic
reconnection capabilities.

Typical usage example:
    bridge = MQTTBridge()
    bridge.start()
"""

import dataclasses
import enum
import json
import logging
import os
import sys
import time
import traceback
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import paho.mqtt.client as mqtt
from dotenv import load_dotenv
from supabase import Client, create_client

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(Path("logs/mqtt-bridge.log"), mode="a"),
    ],
)


class TopicType(enum.Enum):
    """Enumeration of supported MQTT topic types."""
    DATA = "device/data"
    DEBUG = "device/debug"


@dataclasses.dataclass
class MQTTConfig:
    """Configuration parameters for MQTT connection.
    
    Attributes:
        broker: MQTT broker hostname or IP address.
        port: MQTT broker port number.
        topics: List of topics to subscribe to with their QoS levels.
    """
    broker: str
    port: int
    topics: List[Tuple[str, int]]


@dataclasses.dataclass
class StreamData:
    """Data structure for stream messages.
    
    Attributes:
        stream_id: Unique identifier for the stream.
        frame_id: Unique identifier for the frame.
        device_id: Identifier of the source device.
        timestamp: Timestamp of the data.
        timeout: Timeout value in seconds.
        image_data: Base64 encoded image data.
        metadata: Additional metadata associated with the frame.
        created_at: Timestamp when the record was created.
    """
    stream_id: str
    frame_id: str
    device_id: str
    timestamp: str
    timeout: int
    image_data: str
    metadata: Dict[str, Any]
    created_at: str = dataclasses.field(default_factory=lambda: datetime.utcnow().isoformat())


class DatabaseManager:
    """Manages database operations with Supabase.
    
    This class handles all interactions with the Supabase database, including
    connection management and data storage operations.
    """

    def __init__(self, url: str, key: str) -> None:
        """Initializes the DatabaseManager.
        
        Args:
            url: Supabase project URL.
            key: Supabase API key.
            
        Raises:
            ValueError: If url or key is empty.
            RuntimeError: If connection to Supabase fails.
        """
        if not url or not key:
            raise ValueError("Supabase URL and key must be provided")
        
        self._logger = logging.getLogger(self.__class__.__name__)
        try:
            self._client = create_client(url, key)
            self._logger.info("Successfully connected to Supabase")
        except Exception as e:
            self._logger.error("Failed to connect to Supabase: %s", str(e))
            raise RuntimeError("Failed to initialize database connection") from e

    def store_data(self, data: StreamData) -> bool:
        """Stores stream data in Supabase.
        
        Args:
            data: StreamData object containing the data to store.
            
        Returns:
            bool: True if storage was successful, False otherwise.
        """
        try:
            result = self._client.table("stream_data").insert(dataclasses.asdict(data)).execute()
            self._logger.info("Successfully stored frame %s for stream %s",
                            data.frame_id, data.stream_id)
            return True
        except Exception as e:
            self._logger.error("Error storing data: %s", str(e))
            self._logger.error(traceback.format_exc())
            return False


class MQTTBridge:
    """Main service class that bridges MQTT messages to Supabase storage."""

    def __init__(self) -> None:
        """Initializes the MQTT Bridge service.
        
        Raises:
            RuntimeError: If required environment variables are missing.
        """
        load_dotenv()
        
        self._logger = logging.getLogger(self.__class__.__name__)
        self._setup_environment()
        
        self._db_manager = DatabaseManager(
            url=self._env["SUPABASE_URL"],
            key=self._env["SUPABASE_KEY"]
        )
        
        self._mqtt_config = MQTTConfig(
            broker=self._env["MQTT_BROKER"],
            port=int(self._env["MQTT_PORT"]),
            topics=[(topic.value, 1) for topic in TopicType]
        )
        
        self._setup_mqtt_client()

    def _setup_environment(self) -> None:
        """Sets up environment variables.
        
        Raises:
            RuntimeError: If required environment variables are missing.
        """
        required_vars = ["SUPABASE_URL", "SUPABASE_KEY", "MQTT_BROKER", "MQTT_PORT"]
        self._env = {}
        
        for var in required_vars:
            value = os.getenv(var)
            if not value:
                raise RuntimeError(f"Missing required environment variable: {var}")
            self._env[var] = value

    def _setup_mqtt_client(self) -> None:
        """Sets up the MQTT client with appropriate callbacks."""
        self._client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
        self._client.on_connect = self._on_connect
        self._client.on_message = self._on_message
        self._client.enable_logger(self._logger)

    def _on_connect(self, 
                   client: mqtt.Client,
                   userdata: Any,
                   flags: Dict[str, Any],
                   rc: int,
                   properties: Optional[Any] = None) -> None:
        """Callback for when the client connects to the broker.
        
        Args:
            client: The MQTT client instance.
            userdata: User data of any type.
            flags: Response flags sent by the broker.
            rc: The connection result.
            properties: Protocol v5.0 properties (optional).
        """
        if rc == 0:
            self._logger.info("Connected to MQTT broker successfully")
            client.subscribe(self._mqtt_config.topics)
            self._logger.info("Subscribed to topics: %s",
                            [t[0] for t in self._mqtt_config.topics])
        else:
            self._logger.error("Failed to connect to MQTT broker with code %d", rc)

    def _on_message(self,
                   client: mqtt.Client,
                   userdata: Any,
                   msg: mqtt.MQTTMessage) -> None:
        """Callback for when a message is received from the broker.
        
        Args:
            client: The MQTT client instance.
            userdata: User data of any type.
            msg: The received message.
        """
        try:
            self._logger.debug("Received message on topic: %s", msg.topic)
            payload = json.loads(msg.payload.decode())
            
            if msg.topic == TopicType.DATA.value:
                self._handle_data_message(payload)
            elif msg.topic == TopicType.DEBUG.value:
                self._handle_debug_message(payload)
                
        except json.JSONDecodeError as e:
            self._logger.error("Failed to decode JSON message: %s", str(e))
            self._logger.debug("Raw message: %s", msg.payload)
        except Exception as e:
            self._logger.error("Error processing message: %s", str(e))
            self._logger.error(traceback.format_exc())

    def _handle_data_message(self, payload: Dict[str, Any]) -> None:
        """Handles data messages by storing them in the database.
        
        Args:
            payload: The decoded message payload.
        """
        try:
            stream_data = StreamData(
                stream_id=payload["stream_id"],
                frame_id=payload["frame_id"],
                device_id=payload["device_id"],
                timestamp=payload["timestamp"],
                timeout=payload["timeout"],
                image_data=payload["data"],
                metadata=payload.get("metadata", {})
            )
            
            if self._db_manager.store_data(stream_data):
                self._logger.info("Successfully processed frame %s", stream_data.frame_id)
                
        except KeyError as e:
            self._logger.error("Missing required field in payload: %s", str(e))
        except Exception as e:
            self._logger.error("Error handling data message: %s", str(e))

    def _handle_debug_message(self, payload: Dict[str, Any]) -> None:
        """Handles debug messages by logging them.
        
        Args:
            payload: The decoded message payload.
        """
        self._logger.debug("Debug data: %s", payload.get("meta", {}))

    def start(self) -> None:
        """Starts the MQTT bridge service.
        
        This method runs indefinitely, attempting to maintain a connection to
        the MQTT broker and process messages.
        """
        while True:
            try:
                self._logger.info("Connecting to MQTT broker at %s:%d",
                                self._mqtt_config.broker,
                                self._mqtt_config.port)
                                
                self._client.connect(
                    self._mqtt_config.broker,
                    self._mqtt_config.port
                )
                
                self._logger.info("Starting MQTT loop...")
                self._client.loop_forever()
                
            except Exception as e:
                self._logger.error("MQTT connection error: %s", str(e))
                self._logger.error(traceback.format_exc())
                self._logger.info("Retrying connection in 5 seconds...")
                time.sleep(5)


def main() -> None:
    """Main entry point for the MQTT bridge service."""
    try:
        # Ensure logs directory exists
        Path("logs").mkdir(exist_ok=True)
        
        logger = logging.getLogger("main")
        logger.info("Starting MQTT Bridge service...")
        
        bridge = MQTTBridge()
        bridge.start()
        
    except KeyboardInterrupt:
        logger.info("Bridge stopped by user")
    except Exception as e:
        logger.error("Fatal error: %s", str(e))
        logger.error(traceback.format_exc())
        sys.exit(1)


if __name__ == "__main__":
    main()