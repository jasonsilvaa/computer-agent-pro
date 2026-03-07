import { ExecutionLog, Header, SandboxViewer, StepsList, Timeline } from '@/components';
import {
  selectFinalStep,
  selectIsAgentProcessing,
  selectIsConnectingToDesktop,
  selectMetadata,
  selectSelectedStep,
  selectTrace,
  selectVncUrl,
  useAgentStore,
} from '@/stores/agentStore';
import { Box } from '@mui/material';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Task = () => {
  const navigate = useNavigate();

  // Get state from Zustand store
  const trace = useAgentStore(selectTrace);
  const executionLogs = useAgentStore((state) => state.executionLogs);
  const isAgentProcessing = useAgentStore(selectIsAgentProcessing);
  const isConnectingToDesktop = useAgentStore(selectIsConnectingToDesktop);
  const vncUrl = useAgentStore(selectVncUrl);
  const metadata = useAgentStore(selectMetadata);
  const selectedStep = useAgentStore(selectSelectedStep);
  const finalStep = useAgentStore(selectFinalStep);
  const error = useAgentStore((state) => state.error);

  // Redirect to home if no trace (allow brief moment for store to update)
  useEffect(() => {
    if (!trace) {
      const t = setTimeout(() => {
        if (!useAgentStore.getState().trace) {
          navigate('/', { replace: true });
        }
      }, 200);
      return () => clearTimeout(t);
    }
  }, [trace, navigate]);

  // Handler for going back to home
  const handleBackToHome = () => {
    // Stop the current task if it's running
    const stopTask = (window as Window & { __stopCurrentTask?: () => void }).__stopCurrentTask;
    if (stopTask) {
      stopTask();
    }

    // Reset frontend state
    useAgentStore.getState().resetAgent();

    // Reload the page to reconnect websocket
    window.location.href = '/';
  };

  // Show loading or redirect if no trace
  if (!trace) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'background.default' }}>
        <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
          Carregando tarefa...
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'background.default',
      }}
    >
      {/* Header */}
      <Header
        isAgentProcessing={isAgentProcessing}
        onBackToHome={handleBackToHome}
      />

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'stretch',
          minHeight: 0,
          p: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            p: { xs: 2, md: 4 },
            pb: { xs: 2, md: 3 },
          }}
        >
          {/* Left Side: OS Stream + Metadata */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
              pr: { xs: 0, md: 1.5 },
              gap: { xs: 2, md: 3 },
              overflow: 'visible',
            }}
          >
            {/* Sandbox Viewer */}
            <SandboxViewer
              vncUrl={vncUrl}
              isAgentProcessing={isAgentProcessing}
              metadata={metadata}
              traceStartTime={trace?.timestamp}
              selectedStep={selectedStep}
              isRunning={trace?.isRunning || false}
            />

            {/* Timeline - Always show with progress (steps + time) */}
            <Timeline
              metadata={{
                traceId: trace?.id || '',
                inputTokensUsed: metadata?.inputTokensUsed || 0,
                outputTokensUsed: metadata?.outputTokensUsed || 0,
                duration: metadata?.duration || 0,
                numberOfSteps: metadata?.numberOfSteps || 0,
                maxSteps: metadata?.maxSteps || 200,
                completed: metadata?.completed || false,
                final_state: metadata?.final_state ?? null,
                user_evaluation: metadata?.user_evaluation || 'not_evaluated',
              }}
              isRunning={trace?.isRunning || false}
            />

            {/* Execution log - model responses and tool prints */}
            <ExecutionLog
              trace={trace}
              metadata={metadata}
              executionLogs={executionLogs}
              isConnectingToDesktop={isConnectingToDesktop}
              isAgentProcessing={isAgentProcessing}
              finalStep={finalStep}
              error={error}
            />
          </Box>

          {/* Right Side: Steps List */}
          <StepsList trace={trace} />
        </Box>
      </Box>
    </Box>
  );
};

export default Task;
