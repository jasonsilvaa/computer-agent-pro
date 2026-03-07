import { ExecutionLog, Header, SandboxViewer, StepsList, Timeline } from '@/components';
import {
  selectExecutionStatus,
  selectFinalStep,
  selectIsAgentProcessing,
  selectIsConnectingToDesktop,
  selectMetadata,
  selectSelectedStep,
  selectTrace,
  selectVncUrl,
  useAgentStore,
} from '@/stores/agentStore';
import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface TaskProps {
  stopCurrentTask: () => void;
}

const Task = ({ stopCurrentTask }: TaskProps) => {
  const navigate = useNavigate();

  const trace = useAgentStore(selectTrace);
  const executionStatus = useAgentStore(selectExecutionStatus);
  const executionLogs = useAgentStore((state) => state.executionLogs);
  const isAgentProcessing = useAgentStore(selectIsAgentProcessing);
  const isConnectingToDesktop = useAgentStore(selectIsConnectingToDesktop);
  const vncUrl = useAgentStore(selectVncUrl);
  const metadata = useAgentStore(selectMetadata);
  const selectedStep = useAgentStore(selectSelectedStep);
  const finalStep = useAgentStore(selectFinalStep);
  const error = useAgentStore((state) => state.error);

  const handleBackToHome = () => {
    if (isAgentProcessing) {
      stopCurrentTask();
    }
    useAgentStore.getState().resetAgent();
    navigate('/');
  };

  if (!trace) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'background.default', p: 3 }}>
        <Box sx={{ textAlign: 'center', color: 'text.secondary', maxWidth: 480 }}>
          <Typography variant="h6" sx={{ mb: 1, color: 'text.primary' }}>
            {executionStatus === 'connecting' ? 'Iniciando tarefa...' : 'Nenhuma tarefa ativa'}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {executionStatus === 'connecting'
              ? 'Aguardando a confirmação inicial do backend.'
              : 'Abra uma nova tarefa na tela inicial para acompanhar a execução aqui.'}
          </Typography>
          <Button variant="contained" onClick={() => navigate('/')}>
            Voltar ao início
          </Button>
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
        onStopTask={stopCurrentTask}
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
