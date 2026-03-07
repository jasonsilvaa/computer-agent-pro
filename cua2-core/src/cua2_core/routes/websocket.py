import json
from datetime import datetime

# Get services from app state
from cua2_core.app import app
from cua2_core.models.models import (
    AgentErrorEvent,
    AgentTrace,
    HeartbeatEvent,
    StopTaskMessage,
    UserTaskMessage,
)
from cua2_core.services.agent_service import AgentService
from cua2_core.websocket.websocket_manager import WebSocketManager
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

# Create router
router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time communication"""

    websocket_manager: WebSocketManager = app.state.websocket_manager
    agent_service: AgentService = app.state.agent_service

    await websocket_manager.connect(websocket)

    try:
        # Create ID and acquire sandbox - this adds uuid to task_websockets
        # If this fails, the finally block will clean up via cleanup_tasks_for_websocket
        uuid = await agent_service.create_id_and_sandbox(websocket)
        welcome_message = HeartbeatEvent(traceId=uuid)
        await websocket_manager.send_message(welcome_message, websocket)

        # Keep the connection alive and wait for messages
        while True:
            try:
                # Wait for messages from client
                data = await websocket.receive_text()

                try:
                    # Parse the message
                    message_data = json.loads(data)
                    print(f"Received message: {message_data}")

                    # Check if it's a user task message
                    if message_data.get("type") == "user_task":
                        message = UserTaskMessage(**message_data)
                        trace = AgentTrace(
                            id=message.traceId,
                            instruction=message.instruction,
                            modelId=message.modelId,
                            timestamp=datetime.now(),
                            isRunning=True,
                        )
                        trace_id = await agent_service.process_user_task(trace, websocket)
                        print(f"Started processing trace: {trace_id}")

                    elif message_data.get("type") == "stop_task":
                        message = StopTaskMessage(**message_data)
                        await agent_service.stop_task(message.traceId, websocket)
                        print(f"Stopped task: {message.traceId}")

                except json.JSONDecodeError as e:
                    print(f"JSON decode error: {e}")
                    error_response = AgentErrorEvent(
                        type="agent_error", error="Invalid JSON format"
                    )
                    await websocket_manager.send_message(error_response, websocket)

                except Exception as e:
                    print(f"Error processing message: {e}")
                    import traceback

                    traceback.print_exc()
                    error_response = AgentErrorEvent(
                        type="agent_error", error=f"Error processing message: {str(e)}"
                    )
                    await websocket_manager.send_message(error_response, websocket)

            except Exception as e:
                print(f"Error receiving WebSocket message: {e}")
                # If we can't receive messages, the connection is likely broken
                break

    except WebSocketDisconnect:
        print("WebSocket disconnected normally")
    except Exception as e:
        print(f"WebSocket connection error: {e}")
    finally:
        # Cleanup tasks and sandboxes associated with this websocket
        try:
            await agent_service.cleanup_tasks_for_websocket(websocket)
        except Exception as e:
            print(f"Error cleaning up tasks for websocket: {e}")

        # Ensure cleanup happens
        websocket_manager.disconnect(websocket)
