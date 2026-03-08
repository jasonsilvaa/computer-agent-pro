import { AgentTrace } from '@/types/agent';
import { useAgentStore } from '@/stores/agentStore';
import CollectionsIcon from '@mui/icons-material/Collections';
import ImageIcon from '@mui/icons-material/Image';
import { Box, Paper, Typography, keyframes } from '@mui/material';
import React, { useRef, useEffect, useState } from 'react';

const newCapturePulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.6); }
  70% { box-shadow: 0 0 0 12px rgba(25, 118, 210, 0); }
  100% { box-shadow: 0 0 0 0 rgba(25, 118, 210, 0); }
`;

interface PrintStreamProps {
  trace?: AgentTrace;
  isAgentProcessing?: boolean;
}

export const PrintStream: React.FC<PrintStreamProps> = ({
  trace,
  isAgentProcessing = false,
}) => {
  const selectedStepIndex = useAgentStore((state) => state.selectedStepIndex);
  const setSelectedStepIndex = useAgentStore((state) => state.setSelectedStepIndex);
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  const [highlightLatest, setHighlightLatest] = useState(false);
  const prevCountRef = useRef(0);

  const screenshotSteps = (trace?.steps || [])
    .map((step, index) => ({ step, index }))
    .filter(({ step }) => !!step.image);

  const latestScreenshot = screenshotSteps[screenshotSteps.length - 1];

  // Auto-scroll thumbnails to latest when a new print arrives
  useEffect(() => {
    if (thumbnailsRef.current && screenshotSteps.length > prevCountRef.current) {
      thumbnailsRef.current.scrollTo({
        left: thumbnailsRef.current.scrollWidth,
        behavior: 'smooth',
      });
      prevCountRef.current = screenshotSteps.length;
      setHighlightLatest(true);
      const t = setTimeout(() => setHighlightLatest(false), 1500);
      return () => clearTimeout(t);
    }
    prevCountRef.current = screenshotSteps.length;
  }, [screenshotSteps.length]);

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1.5,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.25,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CollectionsIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Prints gerados
          </Typography>
          {screenshotSteps.length > 0 && (
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              {screenshotSteps.length} {screenshotSteps.length === 1 ? 'print' : 'prints'}
            </Typography>
          )}
        </Box>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {isAgentProcessing ? 'Atualiza a cada etapa' : 'Clique para revisar'}
        </Typography>
      </Box>

      <Box sx={{ p: 2 }}>
        {latestScreenshot ? (
          <>
            <Box
              onClick={() => setSelectedStepIndex(latestScreenshot.index)}
              sx={{
                cursor: 'pointer',
                borderRadius: 1.5,
                overflow: 'hidden',
                border: '2px solid',
                borderColor:
                  selectedStepIndex === latestScreenshot.index
                    ? 'primary.main'
                    : 'divider',
                backgroundColor: 'action.hover',
                animation: highlightLatest ? `${newCapturePulse} 1.2s ease-out` : 'none',
              }}
            >
              <img
                src={latestScreenshot.step.image}
                alt={`Print da etapa ${latestScreenshot.index + 1}`}
                style={{
                  display: 'block',
                  width: '100%',
                  maxHeight: '260px',
                  objectFit: 'contain',
                  background: '#000',
                }}
              />
            </Box>

            <Box
              sx={{
                mt: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
              }}
            >
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Último print: etapa {latestScreenshot.index + 1}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Selecione uma miniatura para ampliar
              </Typography>
            </Box>

            {screenshotSteps.length > 1 && (
              <Box
                ref={thumbnailsRef}
                sx={{
                  mt: 1.5,
                  display: 'flex',
                  gap: 1,
                  overflowX: 'auto',
                  pb: 0.5,
                  scrollBehavior: 'smooth',
                }}
              >
                {screenshotSteps.slice(-6).map(({ step, index }) => (
                  <Box
                    key={step.stepId}
                    onClick={() => setSelectedStepIndex(index)}
                    sx={{
                      minWidth: 110,
                      width: 110,
                      cursor: 'pointer',
                      borderRadius: 1,
                      overflow: 'hidden',
                      border: '2px solid',
                      borderColor:
                        selectedStepIndex === index ? 'primary.main' : 'divider',
                      backgroundColor: 'action.hover',
                      flexShrink: 0,
                    }}
                  >
                    <Box
                      sx={{
                        px: 0.75,
                        py: 0.5,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        backgroundColor: 'background.paper',
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ fontSize: '0.68rem', fontWeight: 700, color: 'text.secondary' }}
                      >
                        ETAPA {index + 1}
                      </Typography>
                    </Box>
                    <img
                      src={step.image}
                      alt={`Miniatura da etapa ${index + 1}`}
                      style={{
                        display: 'block',
                        width: '100%',
                        height: '72px',
                        objectFit: 'cover',
                        background: '#000',
                      }}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </>
        ) : (
          <Box
            sx={{
              minHeight: 140,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              color: 'text.secondary',
              textAlign: 'center',
            }}
          >
            <ImageIcon sx={{ fontSize: 40, opacity: 0.45 }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Nenhum print disponível ainda
            </Typography>
            <Typography variant="caption" sx={{ maxWidth: 320 }}>
              Os screenshots de cada etapa aparecerão aqui conforme o agente executa a tarefa.
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};
