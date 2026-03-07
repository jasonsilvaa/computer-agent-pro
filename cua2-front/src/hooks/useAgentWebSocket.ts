import { useAgentStore } from '@/stores/agentStore';
import { WebSocketEvent } from '@/types/agent';
import { useCallback, useEffect } from 'react';
import { useWebSocket } from './useWebSocket';

interface UseAgentWebSocketOptions {
  url: string;
}

export const useAgentWebSocket = ({ url }: UseAgentWebSocketOptions) => {
  const {
    setTraceId,
    setExecutionStatus,
    addExecutionLog,
    updateTraceWithStep,
    completeTrace,
    setVncUrl,
    setError,
    setIsConnected,
    resetAgent,
    setAgentStartTrace,
  } = useAgentStore();

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback(
    (event: WebSocketEvent) => {
      console.log('WebSocket event received:', event);

      switch (event.type) {
        case 'agent_start': {
          const traceWithMetadata = {
            ...event.agentTrace,
            traceMetadata: event.agentTrace.traceMetadata ? {
              ...event.agentTrace.traceMetadata,
              maxSteps: event.agentTrace.traceMetadata.maxSteps > 0
                ? event.agentTrace.traceMetadata.maxSteps
                : 200, // Default if backend sends 0
            } : {
              traceId: event.agentTrace.id,
              inputTokensUsed: 0,
              outputTokensUsed: 0,
              duration: 0,
              numberOfSteps: 0,
              maxSteps: 200,
              completed: false,
              final_state: null,
              user_evaluation: 'not_evaluated' as const,
            },
          };

          setAgentStartTrace(traceWithMetadata);
          console.log('Agent start received:', traceWithMetadata);
          break;
        }

        case 'agent_progress':
          updateTraceWithStep(event.agentStep, event.traceMetadata);
          console.log('Agent progress received:', event.agentStep);
          break;

        case 'agent_complete':
          completeTrace(event.traceMetadata, event.final_state);
          console.log('Agent complete received:', event.traceMetadata, 'Final state:', event.final_state);
          break;

        case 'agent_error':
          setError(event.error);
          console.error('Agent error received:', event.error);
          break;

        case 'agent_log':
          if (event.traceId === useAgentStore.getState().traceId || event.traceId === useAgentStore.getState().trace?.id) {
            addExecutionLog(event.message);
          }
          break;

        case 'vnc_url_set':
          setVncUrl(event.vncUrl);
          {
            const currentStatus = useAgentStore.getState().executionStatus;
            if (currentStatus === 'connecting') {
              setExecutionStatus('running');
            }
          }
          console.log('VNC URL set received:', event.vncUrl);
          break;

        case 'vnc_url_unset':
          {
            const currentStatus = useAgentStore.getState().executionStatus;
            if (!['connecting', 'running', 'stopping'].includes(currentStatus)) {
              setVncUrl('');
            }
          }
          console.log('VNC URL unset received');
          break;

        case 'heartbeat':
          console.log('Heartbeat received:', event);
          setTraceId(event.traceId);
          console.log('TraceId set from backend:', event.traceId);
          break;

      }
    },
    [addExecutionLog, completeTrace, setAgentStartTrace, setError, setExecutionStatus, setTraceId, setVncUrl, updateTraceWithStep]
  );

  // Handle WebSocket errors
  const handleWebSocketError = useCallback(() => {
    // WebSocket Frontend Error handling
    console.error('WebSocket connection error');
  }, []);

  // Initialize WebSocket connection
  const { isConnected, connectionState, sendMessage, manualReconnect } = useWebSocket({
    url,
    onMessage: handleWebSocketMessage,
    onError: handleWebSocketError,
  });

  // Sync connection state to store and clear traceId on disconnect
  useEffect(() => {
    setIsConnected(isConnected);

    if (!isConnected) {
      setTraceId(null);
      console.log('WebSocket disconnected - traceId cleared');
    }
  }, [isConnected, setIsConnected, setTraceId]);

  const sendTask = useCallback((instruction: string, modelId: string) => {
    const state = useAgentStore.getState();
    if (!state.traceId) {
      state.setError('WebSocket ainda não está pronto. Aguarde a conexão e tente novamente.');
      return false;
    }

    resetAgent();
    useAgentStore.getState().setExecutionStatus('connecting');

    sendMessage({
      type: 'user_task',
      traceId: state.traceId,
      instruction,
      modelId,
    });

    console.log('Task sent:', { traceId: state.traceId, instruction, modelId });
    return true;
  }, [resetAgent, sendMessage]);

  const stopCurrentTask = useCallback(() => {
    const state = useAgentStore.getState();
    const traceId = state.trace?.id || state.traceId;
    const isRunning = ['connecting', 'running', 'stopping'].includes(state.executionStatus);

    if (traceId && isRunning) {
      state.setExecutionStatus('stopping');
      sendMessage({
        type: 'stop_task',
        traceId,
      });
      console.log('Stop task sent for trace:', traceId);
    } else {
      console.warn('Stop ignored: no traceId or task not running', { traceId, executionStatus: state.executionStatus });
    }
  }, [sendMessage]);

  return {
    isConnected,
    connectionState,
    manualReconnect,
    sendTask,
    stopCurrentTask,
  };
};
