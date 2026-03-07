import {
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
  | 'complete'
  | 'error';

export interface LogEntry {
  id: string;
  type: LogEntryType;
  message: string;
  timestamp: number;
  stepNumber?: number;
  stepDuration?: number;
  totalDuration?: number;
}

function parseExecutionMessage(message: string): Pick<LogEntry, 'message' | 'stepNumber' | 'stepDuration'> {
  const match = message.match(/^Etapa\s+(\d+)\s+concluída\s+em\s+([\d.]+)s:\s*(.+)$/i);
  if (!match) {
    return { message };
  }

  return {
    stepNumber: Number(match[1]),
    stepDuration: Number(match[2]),
    message: match[3],
  };
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
  if (trace) {
    entries.push({
      id: 'start',
      type: 'start',
      message: `Tarefa iniciada: "${trace.instruction}"`,
      timestamp: ts,
    });
  }

  if (isConnectingToDesktop && isAgentProcessing) {
    entries.push({
      id: 'connecting',
      type: 'connecting',
      message: 'Conectando ao desktop...',
      timestamp: Date.now(),
    });
  }

  executionLogs.forEach((msg, i) => {
    const parsed = parseExecutionMessage(msg);
    entries.push({
      id: `exec-${i}`,
      type: 'execution',
      message: parsed.message,
      stepNumber: parsed.stepNumber,
      stepDuration: parsed.stepDuration,
      timestamp: ts + i,
    });
  });

  if (error && !finalStep) {
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
  metadata,
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
      case 'complete':
        return '✓';
      case 'error':
        return '✗';
      default:
        return '•';
    }
  };

  if (!trace && entries.length === 0) return null;

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
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: 0.75,
                        mb: 0.25,
                      }}
                    >
                      {entry.stepNumber !== undefined && (
                        <Box
                          sx={{
                            px: 0.75,
                            py: 0.1,
                            borderRadius: 1,
                            backgroundColor: theme.palette.mode === 'dark' ? '#1f2937' : '#e5e7eb',
                            color: 'text.secondary',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                          }}
                        >
                          ETAPA {entry.stepNumber}
                        </Box>
                      )}
                      {entry.stepDuration !== undefined && (
                        <Typography
                          component="span"
                          sx={{ color: 'text.secondary', fontSize: '0.68rem', fontWeight: 700 }}
                        >
                          {entry.stepDuration.toFixed(1)}s
                        </Typography>
                      )}
                      {metadata?.duration !== undefined && entry.type === 'execution' && (
                        <Typography
                          component="span"
                          sx={{ color: 'text.disabled', fontSize: '0.68rem' }}
                        >
                          total {metadata.duration.toFixed(1)}s
                        </Typography>
                      )}
                    </Box>
                    <Typography
                      component="div"
                      sx={{
                        color: 'text.primary',
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {entry.message}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};
