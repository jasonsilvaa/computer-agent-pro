import { AgentStep, AgentTrace, AgentTraceMetadata, FinalStep } from '@/types/agent';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type ExecutionStatus =
  | 'idle'
  | 'connecting'
  | 'running'
  | 'stopping'
  | 'completed'
  | 'failed';

interface AgentState {
  trace?: AgentTrace;
  traceId: string | null;
  executionStatus: ExecutionStatus;
  executionLogs: string[];
  vncUrl: string;
  selectedModelId: string;
  availableModels: string[];
  isLoadingModels: boolean;
  isConnected: boolean;
  error?: string;
  isDarkMode: boolean;
  selectedStepIndex: number | null;
  finalStep?: FinalStep;
  setTrace: (trace: AgentTrace | undefined) => void;
  setTraceId: (traceId: string | null) => void;
  setExecutionStatus: (status: ExecutionStatus) => void;
  addExecutionLog: (message: string) => void;
  clearExecutionLogs: () => void;
  updateTraceWithStep: (step: AgentStep, metadata: AgentTraceMetadata) => void;
  updateStepEvaluation: (stepId: string, evaluation: 'like' | 'dislike' | 'neutral') => void;
  updateTraceEvaluation: (evaluation: 'success' | 'failed' | 'not_evaluated') => void;
  completeTrace: (metadata: AgentTraceMetadata, finalState?: 'success' | 'stopped' | 'max_steps_reached' | 'error' | 'sandbox_timeout') => void;
  setVncUrl: (url: string) => void;
  setSelectedModelId: (modelId: string) => void;
  setAvailableModels: (models: string[]) => void;
  setIsLoadingModels: (loading: boolean) => void;
  setIsConnected: (connected: boolean) => void;
  setError: (error: string | undefined) => void;
  setSelectedStepIndex: (index: number | null) => void;
  toggleDarkMode: () => void;
  resetAgent: () => void;
  setAgentStartTrace: (trace: AgentTrace) => void;
}

const initialState = {
  trace: undefined,
  traceId: null,
  executionStatus: 'idle' as ExecutionStatus,
  executionLogs: [],
  vncUrl: '',
  selectedModelId: 'ollama/qwen3-vl:2b',
  availableModels: [],
  isLoadingModels: false,
  isConnected: false,
  error: undefined,
  isDarkMode: false,
  selectedStepIndex: null,
  finalStep: undefined,
};

export const useAgentStore = create<AgentState>()(
  devtools(
    (set) => ({
      ...initialState,

      setTrace: (trace) => set({ trace }, false, 'setTrace'),

      setTraceId: (traceId) => set({ traceId }, false, 'setTraceId'),

      setExecutionStatus: (executionStatus) =>
        set({ executionStatus }, false, 'setExecutionStatus'),

      addExecutionLog: (message) =>
        set(
          (state) => ({ executionLogs: [...state.executionLogs, message] }),
          false,
          'addExecutionLog'
        ),

      clearExecutionLogs: () =>
        set({ executionLogs: [] }, false, 'clearExecutionLogs'),

      updateTraceWithStep: (step, metadata) =>
        set(
          (state) => {
            if (!state.trace) return state;

            const existingSteps = state.trace.steps || [];
            const stepExists = existingSteps.some((s) => s.stepId === step.stepId);
            if (stepExists) return state;

            const updatedMetadata = {
              ...metadata,
              maxSteps: metadata.maxSteps > 0
                ? metadata.maxSteps
                : (state.trace.traceMetadata?.maxSteps || 200),
            };

            return {
              trace: {
                ...state.trace,
                steps: [...existingSteps, step],
                traceMetadata: updatedMetadata,
                isRunning: true,
              },
              executionStatus: 'running' as ExecutionStatus,
            };
          },
          false,
          'updateTraceWithStep'
        ),

      updateStepEvaluation: (stepId, evaluation) =>
        set(
          (state) => {
            if (!state.trace?.steps) return state;

            return {
              trace: {
                ...state.trace,
                steps: state.trace.steps.map((step) =>
                  step.stepId === stepId
                    ? { ...step, step_evaluation: evaluation }
                    : step
                ),
              },
            };
          },
          false,
          'updateStepEvaluation'
        ),

      updateTraceEvaluation: (evaluation) =>
        set(
          (state) => {
            if (!state.trace?.traceMetadata) return state;

            const updatedMetadata = {
              ...state.trace.traceMetadata,
              user_evaluation: evaluation,
            };

            return {
              trace: {
                ...state.trace,
                traceMetadata: updatedMetadata,
              },
              finalStep: state.finalStep ? {
                ...state.finalStep,
                metadata: {
                  ...state.finalStep.metadata,
                  user_evaluation: evaluation,
                },
              } : state.finalStep,
            };
          },
          false,
          'updateTraceEvaluation'
        ),

      completeTrace: (metadata, finalState) =>
        set(
          (state) => {
            if (!state.trace) return state;

            const updatedMetadata: AgentTraceMetadata = {
              ...metadata,
              maxSteps: metadata.maxSteps > 0
                ? metadata.maxSteps
                : (state.trace.traceMetadata?.maxSteps || 200),
              completed: true,
              final_state: finalState ?? metadata.final_state ?? null,
            };

            let stepType: FinalStep['type'];
            let stepMessage: string | undefined;

            if (finalState === 'stopped') {
              stepType = 'stopped';
              stepMessage = 'Task stopped by user';
            } else if (finalState === 'max_steps_reached') {
              stepType = 'max_steps_reached';
              stepMessage = 'Maximum steps reached';
            } else if (finalState === 'sandbox_timeout') {
              stepType = 'sandbox_timeout';
              stepMessage = 'Sandbox timeout';
            } else if (finalState === 'error' || state.error) {
              stepType = 'failure';
              stepMessage = state.error || 'Task failed';
            } else {
              stepType = 'success';
            }

            return {
              trace: {
                ...state.trace,
                isRunning: false,
                traceMetadata: updatedMetadata,
              },
              finalStep: {
                type: stepType,
                message: stepMessage,
                metadata: updatedMetadata,
              },
              executionStatus: stepType === 'failure' ? 'failed' : 'completed',
              selectedStepIndex: null,
            };
          },
          false,
          'completeTrace'
        ),

      setVncUrl: (vncUrl) => set({ vncUrl }, false, 'setVncUrl'),

      setSelectedModelId: (selectedModelId) =>
        set({ selectedModelId }, false, 'setSelectedModelId'),

      setAvailableModels: (availableModels) =>
        set({ availableModels }, false, 'setAvailableModels'),

      setIsLoadingModels: (isLoadingModels) =>
        set({ isLoadingModels }, false, 'setIsLoadingModels'),

      setIsConnected: (isConnected) =>
        set({ isConnected }, false, 'setIsConnected'),

      setError: (error) =>
        set(
          (state) => {
            if (!error) {
              return { error: undefined };
            }

            if (!state.trace) {
              return { error, executionStatus: 'failed' as ExecutionStatus };
            }

            const metadata = state.trace.traceMetadata || {
              traceId: state.trace.id,
              inputTokensUsed: 0,
              outputTokensUsed: 0,
              duration: 0,
              numberOfSteps: state.trace.steps?.length || 0,
              maxSteps: 200,
              completed: false,
              final_state: null,
              user_evaluation: 'not_evaluated' as const,
            };

            const finalMetadata: AgentTraceMetadata = {
              ...metadata,
              maxSteps: metadata.maxSteps > 0 ? metadata.maxSteps : 200,
              final_state: metadata.final_state || 'error',
              user_evaluation: metadata.user_evaluation || 'not_evaluated',
            };

            return {
              error,
              finalStep: {
                type: 'failure',
                message: error,
                metadata: finalMetadata,
              },
              trace: {
                ...state.trace,
                isRunning: false,
              },
              executionStatus: 'failed' as ExecutionStatus,
              selectedStepIndex: null,
            };
          },
          false,
          'setError'
        ),

      setSelectedStepIndex: (selectedStepIndex) =>
        set({ selectedStepIndex }, false, 'setSelectedStepIndex'),

      toggleDarkMode: () =>
        set((state) => ({ isDarkMode: !state.isDarkMode }), false, 'toggleDarkMode'),

      resetAgent: () =>
        set(
          (state) => ({
            ...initialState,
            traceId: state.traceId,
            isDarkMode: state.isDarkMode,
            isConnected: state.isConnected,
            selectedModelId: state.selectedModelId,
            availableModels: state.availableModels,
            isLoadingModels: state.isLoadingModels,
          }),
          false,
          'resetAgent'
        ),

      setAgentStartTrace: (trace) =>
        set(
          {
            trace,
            finalStep: undefined,
            error: undefined,
            selectedStepIndex: null,
            executionLogs: [],
            executionStatus: 'connecting',
          },
          false,
          'setAgentStartTrace'
        ),
    }),
    { name: 'AgentStore' }
  )
);

export const selectTrace = (state: AgentState) => state.trace;
export const selectTraceId = (state: AgentState) => state.traceId;
export const selectExecutionStatus = (state: AgentState) => state.executionStatus;
export const selectIsAgentProcessing = (state: AgentState) =>
  ['connecting', 'running', 'stopping'].includes(state.executionStatus);
export const selectIsConnectingToDesktop = (state: AgentState) =>
  state.executionStatus === 'connecting';
export const selectVncUrl = (state: AgentState) => state.vncUrl;
export const selectSelectedModelId = (state: AgentState) => state.selectedModelId;
export const selectAvailableModels = (state: AgentState) => state.availableModels;
export const selectIsLoadingModels = (state: AgentState) => state.isLoadingModels;
export const selectIsConnected = (state: AgentState) => state.isConnected;
export const selectSteps = (state: AgentState) => state.trace?.steps;
export const selectMetadata = (state: AgentState) => state.trace?.traceMetadata;
export const selectError = (state: AgentState) => state.error;
export const selectIsDarkMode = (state: AgentState) => state.isDarkMode;
export const selectSelectedStepIndex = (state: AgentState) => state.selectedStepIndex;
export const selectFinalStep = (state: AgentState) => state.finalStep;

export const selectSelectedStep = (state: AgentState) => {
  const steps = state.trace?.steps;
  const selectedIndex = state.selectedStepIndex;

  if (selectedIndex === null || !steps || selectedIndex >= steps.length) {
    return null;
  }

  return steps[selectedIndex];
};
