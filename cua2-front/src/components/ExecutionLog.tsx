import {
  AgentAction,
  AgentStep,
  AgentTrace,
  AgentTraceMetadata,
  FinalStep,
} from '@/types/agent';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TerminalIcon from '@mui/icons-material/Terminal';
import {
  Box,
  Collapse,
  IconButton,
  Paper,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';

export type LogEntryType =
  | 'start'
  | 'connecting'
  | 'execution'
  | 'step'
  | 'thought'
  | 'action'
  | 'complete'
  | 'error';

export interface LogEntry {
  id: string;
  type: LogEntryType;
  stepNumber?: number;
  message: string;
  thought?: string;
  actions?: AgentAction[];
  duration?: number;
  inputTokens?: number;
  outputTokens?: number;
  timestamp: number;
}

function buildLogEntries(
  trace: AgentTrace | undefined,
  executionLogs: string[],
  isConnectingToDesktop: boolean,
  isAgentProcessing: boolean,
  finalStep: FinalStep | undefined,
  error: string | undefined
): LogEntry[] {
  const entries: LogEntry[] = [];
  const ts = trace?.timestamp ? new Date(trace.timestamp).getTime() : Date.now();

  if (!trace) return entries;

  entries.push({
    id: 'start',
    type: 'start',
    message: `Tarefa iniciada: "${trace.instruction}"`,
    timestamp: ts,
  });

  if (isConnectingToDesktop && isAgentProcessing) {
    entries.push({
      id: 'connecting',
      type: 'connecting',
      message: 'Conectando ao desktop...',
      timestamp: Date.now(),
    });
  }

  // Tool execution prints (from backend agent_log)
  executionLogs.forEach((msg, i) => {
    entries.push({
      id: `exec-${i}`,
      type: 'execution',
      message: msg,
      timestamp: ts + i,
    });
  });

  const steps = trace.steps || [];
  steps.forEach((step: AgentStep, index: number) => {
    const stepNum = index + 1;

    if (step.thought && step.thought.trim()) {
      entries.push({
        id: `thought-${step.stepId}`,
        type: 'thought',
        stepNumber: stepNum,
        message: step.thought,
        thought: step.thought,
        timestamp: ts + (step.duration || 0) * 1000,
      });
    }

    const actionMsgs =
      step.actions?.map((a) => a.description).join('; ') ||
      `Passo ${stepNum} concluído`;
    entries.push({
      id: `step-${step.stepId}`,
      type: step.actions?.length ? 'action' : 'step',
      stepNumber: stepNum,
      message: actionMsgs,
      actions: step.actions,
      duration: step.duration,
      inputTokens: step.inputTokensUsed,
      outputTokens: step.outputTokensUsed,
      timestamp: ts,
    });
  });

  if (error) {
    entries.push({
      id: 'error',
      type: 'error',
      message: error,
      timestamp: Date.now(),
    });
  }

  if (finalStep) {
    const msg =
      finalStep.type === 'success'
        ? 'Tarefa concluída com sucesso'
        : finalStep.type === 'stopped'
          ? 'Tarefa interrompida pelo usuário'
          : finalStep.type === 'max_steps_reached'
            ? 'Limite de passos atingido'
            : finalStep.type === 'sandbox_timeout'
              ? 'Timeout do sandbox'
              : finalStep.message || 'Tarefa finalizada';
    entries.push({
      id: 'complete',
      type: 'complete',
      message: msg,
      timestamp: Date.now(),
    });
  }

  return entries;
}

interface ExecutionLogProps {
  trace?: AgentTrace;
  metadata?: AgentTraceMetadata;
  executionLogs: string[];
  isConnectingToDesktop: boolean;
  isAgentProcessing: boolean;
  finalStep?: FinalStep;
  error?: string;
}

export const ExecutionLog: React.FC<ExecutionLogProps> = ({
  trace,
  executionLogs,
  isConnectingToDesktop,
  isAgentProcessing,
  finalStep,
  error,
}) => {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(true);

  const entries = buildLogEntries(
    trace,
    executionLogs,
    isConnectingToDesktop,
    isAgentProcessing,
    finalStep,
    error
  );

  useEffect(() => {
    if (containerRef.current && entries.length > 0) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [entries.length]);

  const getEntryColor = (type: LogEntryType) => {
    switch (type) {
      case 'start':
        return theme.palette.primary.main;
      case 'connecting':
        return theme.palette.info.main;
      case 'execution':
        return theme.palette.success.main;
      case 'thought':
        return theme.palette.text.secondary;
      case 'action':
      case 'step':
        return theme.palette.success.main;
      case 'complete':
        return theme.palette.success.main;
      case 'error':
        return theme.palette.error.main;
      default:
        return theme.palette.text.primary;
    }
  };

  const getEntryPrefix = (type: LogEntryType) => {
    switch (type) {
      case 'start':
        return '▶';
      case 'connecting':
        return '…';
      case 'execution':
        return '▸';
      case 'thought':
        return '💭';
      case 'action':
      case 'step':
        return '→';
      case 'complete':
        return '✓';
      case 'error':
        return '✗';
      default:
        return '•';
    }
  };

  if (!trace) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1.5,
        overflow: 'hidden',
        backgroundColor: theme.palette.mode === 'dark' ? '#0d1117' : '#f6f8fa',
      }}
    >
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.25,
          cursor: 'pointer',
          borderBottom: expanded ? '1px solid' : 'none',
          borderColor: 'divider',
          backgroundColor: theme.palette.mode === 'dark' ? '#161b22' : '#f0f2f5',
          '&:hover': {
            backgroundColor: theme.palette.mode === 'dark' ? '#21262d' : '#e8eaed',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TerminalIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, color: 'text.primary' }}
          >
            Log de execução
          </Typography>
          {entries.length > 0 && (
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontWeight: 600,
                ml: 0.5,
              }}
            >
              {entries.length} {entries.length === 1 ? 'entrada' : 'entradas'}
            </Typography>
          )}
        </Box>
        <IconButton size="small" sx={{ p: 0.5 }}>
          <ExpandMoreIcon
            sx={{
              fontSize: 20,
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          />
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box
          ref={containerRef}
          sx={{
            maxHeight: 220,
            overflowY: 'auto',
            p: 2,
            fontFamily: 'ui-monospace, "Cascadia Code", "Fira Code", monospace',
            fontSize: '0.75rem',
            lineHeight: 1.6,
          }}
        >
          {entries.length === 0 ? (
            <Typography
              variant="caption"
              sx={{ color: 'text.disabled', fontStyle: 'italic' }}
            >
              Aguardando execução...
            </Typography>
          ) : (
            entries.map((entry) => (
              <Box
                key={entry.id}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.25,
                  mb: 1.25,
                  '&:last-child': { mb: 0 },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Typography
                    component="span"
                    sx={{
                      color: getEntryColor(entry.type),
                      fontWeight: 700,
                      flexShrink: 0,
                      minWidth: 16,
                    }}
                  >
                    {getEntryPrefix(entry.type)}
                  </Typography>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {entry.stepNumber && (
                      <Typography
                        component="span"
                        sx={{
                          color: 'text.disabled',
                          fontWeight: 600,
                          mr: 1,
                        }}
                      >
                        [Passo {entry.stepNumber}]
                      </Typography>
                    )}
                    <Typography
                      component="span"
                      sx={{
                        color: 'text.primary',
                        wordBreak: 'break-word',
                      }}
                    >
                      {entry.message}
                    </Typography>
                    {entry.duration !== undefined && entry.duration > 0 && (
                      <Typography
                        component="span"
                        sx={{
                          color: 'text.disabled',
                          fontSize: '0.7rem',
                          ml: 1,
                        }}
                      >
                        ({entry.duration.toFixed(1)}s
                        {entry.inputTokens !== undefined &&
                          ` • ${entry.inputTokens} in / ${entry.outputTokens} out`}
                        )
                      </Typography>
                    )}
                  </Box>
                </Box>
                {entry.thought && entry.type === 'thought' && (
                  <Box
                    sx={{
                      pl: 3,
                      borderLeft: '2px solid',
                      borderColor: 'divider',
                      color: 'text.secondary',
                      fontStyle: 'italic',
                    }}
                  >
                    {entry.thought}
                  </Box>
                )}
              </Box>
            ))
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};
