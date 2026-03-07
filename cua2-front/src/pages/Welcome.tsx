import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { WelcomeScreen } from '@/components';
import { useAgentStore, selectIsConnected } from '@/stores/agentStore';

interface WelcomeProps {
  sendTask: (instruction: string, modelId: string) => boolean;
}

const Welcome = ({ sendTask }: WelcomeProps) => {
  const navigate = useNavigate();
  const isConnected = useAgentStore(selectIsConnected);

  const handleSendNewTask = (instruction: string, modelId: string) => {
    const started = sendTask(instruction, modelId);
    if (started) {
      navigate('/task');
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'background.default',
        position: 'relative',
      }}
    >
      <WelcomeScreen onStartTask={handleSendNewTask} isConnected={isConnected} />
    </Box>
  );
};

export default Welcome;
