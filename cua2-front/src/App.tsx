import { CssBaseline, ThemeProvider } from '@mui/material';
import { useMemo } from 'react';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { getWebSocketUrl } from './config/api';
import { useAgentWebSocket } from './hooks/useAgentWebSocket';
import Task from "./pages/Task";
import Welcome from "./pages/Welcome";
import { selectIsDarkMode, useAgentStore } from './stores/agentStore';
import getTheme from './theme';

const App = () => {
  const isDarkMode = useAgentStore(selectIsDarkMode);
  const theme = useMemo(() => getTheme(isDarkMode ? 'dark' : 'light'), [isDarkMode]);

  const { sendTask, stopCurrentTask } = useAgentWebSocket({ url: getWebSocketUrl() });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome sendTask={sendTask} />} />
          <Route path="/task" element={<Task stopCurrentTask={stopCurrentTask} />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
