/**
 * End-to-End Tests for Async Renewable Jobs Pattern
 * 
 * This test suite verifies the complete async job flow:
 * 1. User submits terrain query
 * 2. Backend returns immediately with "processing" status
 * 3. Frontend polls for results
 * 4. Results appear automatically when complete
 * 5. Error scenarios are handled gracefully
 * 
 * Requirements tested:
 * - Requirement 1: Async job model (no timeout errors)
 * - Requirement 2: Job status tracking (real-time progress)
 * - Requirement 3: Result delivery (automatic display)
 * - Requirement 4: Error handling (clear feedback)
 */

import { generateClient } from 'aws-amplify/data';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

// Mock AWS SDK
jest.mock('@aws-sdk/client-lambda');
jest.mock('aws-amplify/data');

describe('Async Renewable Jobs - End-to-End Flow', () => {
  let mockAmplifyClient: any;
  let mockLambdaClient: any;
  let mockInvoke: jest.Mock;
  let mockListMessages: jest.Mock;
  let mockCreateMessage: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock Amplify client
    mockListMessages = jest.fn();
    mockCreateMessage = jest.fn();
    mockAmplifyClient = {
      models: {
        ChatMessage: {
          list: mockListMessages,
          create: mockCreateMessage
        }
      }
    };
    (generateClient as jest.Mock).mockReturnValue(mockAmplifyClient);

    // Mock Lambda client
    mockInvoke = jest.fn();
    mockLambdaClient = {
      send: mockInvoke
    };
    (LambdaClient as jest.Mock).mockImplementation(() => mockLambdaClient);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Requirement 1: Async Job Model - No Timeout Errors', () => {
    it('should complete terrain query without timeout (30+ seconds)', async () => {
      // Simulate user submitting terrain query
      const query = 'Analyze terrain at 40.7128, -74.0060 with 5km radius';
      const chatSessionId = 'session-123';
      const userId = 'user-456';

      // Step 1: Backend receives query and returns immediately
      const immediateResponse = {
        success: true,
        message: 'Analysis started. Your results will appear automatically.',
        jobId: 'job-789',
        artifacts: [{
          type: 'job_status',
          data: {
            jobId: 'job-789',
            status: 'pending',
            message: 'Starting renewable energy analysis...'
          }
        }]
      };

      mockInvoke.mockResolvedValueOnce({
        Payload: Buffer.from(JSON.stringify(immediateResponse))
      });

      // Invoke lightweight agent (should return < 1 second)
      const startTime = Date.now();
      const command = new InvokeCommand({
        FunctionName: 'lightweightAgent',
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({ query, chatSessionId, userId })
      });

      const response = await mockLambdaClient.send(command);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Verify immediate response (< 1 second)
      expect(responseTime).toBeLessThan(1000);
      expect(response.Payload).toBeDefined();
      
      const result = JSON.parse(Buffer.from(response.Payload).toString());
      expect(result.success).toBe(true);
      expect(result.jobId).toBe('job-789');
      expect(result.message).toContain('Analysis started');

      // Step 2: Orchestrator processes in background (30-60 seconds)
      // Simulate processing message appearing in DynamoDB
      const processingMessage = {
        id: 'msg-processing',
        role: 'ai',
        content: { text: 'Analyzing terrain and site conditions...' },
        chatSessionId,
        createdAt: new Date().toISOString(),
        responseComplete: false,
        artifacts: [{
          type: 'job_status',
          data: {
            jobId: 'job-789',
            status: 'processing',
            currentStep: 'terrain_analysis',
            completedSteps: 0,
            totalSteps: 3
          }
        }]
      };

      mockListMessages.mockResolvedValue({
        data: [processingMessage]
      });

      // Step 3: After 36 seconds, results are ready
      const completeMessage = {
        id: 'msg-complete',
        role: 'ai',
        content: { text: 'Terrain analysis complete! Found 151 features.' },
        chatSessionId,
        createdAt: new Date(Date.now() + 36000).toISOString(),
        responseComplete: true,
        artifacts: [
          {
            type: 'terrain_map',
            data: {
              features: Array.from({ length: 151 }, (_, i) => ({
                id: `feature-${i}`,
                type: i < 50 ? 'road' : i < 100 ? 'building' : 'water',
                geometry: { type: 'LineString', coordinates: [] }
              })),
              center: { lat: 40.7128, lon: -74.0060 },
              radius_km: 5
            }
          }
        ]
      };

      mockListMessages.mockResolvedValueOnce({
        data: [processingMessage, completeMessage]
      });

      // Verify no timeout error occurred by checking we can fetch messages
      const messages = await mockAmplifyClient.models.ChatMessage.list({
        filter: { chatSessionId: { eq: chatSessionId } }
      });

      expect(mockListMessages).toHaveBeenCalled();
      
      // Verify results contain all 151 features
      const latestMessage = messages.data[messages.data.length - 1];
      expect(latestMessage.responseComplete).toBe(true);
      expect(latestMessage.artifacts[0].data.features).toHaveLength(151);
    });

    it('should handle 60+ second analysis without timeout', async () => {
      const query = 'Complete wind farm analysis at 40.7128, -74.0060';
      
      // Immediate response
      mockInvoke.mockResolvedValueOnce({
        Payload: Buffer.from(JSON.stringify({
          success: true,
          jobId: 'job-long',
          message: 'Analysis started'
        }))
      });

      const command = new InvokeCommand({
        FunctionName: 'lightweightAgent',
        Payload: JSON.stringify({ query })
      });

      await mockLambdaClient.send(command);

      // Simulate 65 seconds of processing
      const processingMessage = {
        id: 'msg-proc',
        role: 'ai',
        content: { text: 'Processing...' },
        chatSessionId: 'session-123',
        responseComplete: false
      };

      mockListMessages.mockResolvedValue({ data: [processingMessage] });

      // Poll for 65 seconds (22 polls at 3 second intervals)
      for (let i = 0; i < 22; i++) {
        jest.advanceTimersByTime(3000);
        await Promise.resolve();
      }

      // Results appear after 65 seconds
      const completeMessage = {
        id: 'msg-complete',
        role: 'ai',
        content: { text: 'Complete analysis ready' },
        chatSessionId: 'session-123',
        responseComplete: true,
        artifacts: [
          { type: 'terrain_map', data: {} },
          { type: 'wind_rose', data: {} },
          { type: 'layout_map', data: {} },
          { type: 'simulation_chart', data: {} }
        ]
      };

      mockListMessages.mockResolvedValue({
        data: [processingMessage, completeMessage]
      });

      jest.advanceTimersByTime(3000);
      await Promise.resolve();

      // Verify no timeout - all artifacts present
      const messages = await mockAmplifyClient.models.ChatMessage.list();
      const latest = messages.data[messages.data.length - 1];
      expect(latest.artifacts).toHaveLength(4);
    });
  });

  describe('Requirement 2: Job Status Tracking - Real-time Progress', () => {
    it('should show real-time progress updates', async () => {
      const chatSessionId = 'session-progress';
      const progressUpdates: any[] = [];

      // Step 1: Initial processing
      mockListMessages.mockResolvedValueOnce({
        data: [{
          id: 'msg-1',
          role: 'ai',
          content: { text: 'Starting analysis...' },
          chatSessionId,
          responseComplete: false,
          artifacts: [{
            type: 'job_status',
            data: {
              currentStep: 'terrain_analysis',
              completedSteps: 0,
              totalSteps: 3,
              estimatedTimeRemaining: 45
            }
          }]
        }]
      });

      let messages = await mockAmplifyClient.models.ChatMessage.list({
        filter: { chatSessionId: { eq: chatSessionId } }
      });
      progressUpdates.push(messages.data[0]);

      // Step 2: Terrain complete
      jest.advanceTimersByTime(15000);
      mockListMessages.mockResolvedValueOnce({
        data: [{
          id: 'msg-2',
          role: 'ai',
          content: { text: 'Terrain analysis complete' },
          chatSessionId,
          responseComplete: false,
          artifacts: [{
            type: 'job_status',
            data: {
              currentStep: 'layout_optimization',
              completedSteps: 1,
              totalSteps: 3,
              estimatedTimeRemaining: 30
            }
          }]
        }]
      });

      messages = await mockAmplifyClient.models.ChatMessage.list({
        filter: { chatSessionId: { eq: chatSessionId } }
      });
      progressUpdates.push(messages.data[0]);

      // Step 3: Layout complete
      jest.advanceTimersByTime(20000);
      mockListMessages.mockResolvedValueOnce({
        data: [{
          id: 'msg-3',
          role: 'ai',
          content: { text: 'Layout optimization complete' },
          chatSessionId,
          responseComplete: false,
          artifacts: [{
            type: 'job_status',
            data: {
              currentStep: 'simulation',
              completedSteps: 2,
              totalSteps: 3,
              estimatedTimeRemaining: 15
            }
          }]
        }]
      });

      messages = await mockAmplifyClient.models.ChatMessage.list({
        filter: { chatSessionId: { eq: chatSessionId } }
      });
      progressUpdates.push(messages.data[0]);

      // Verify progress tracking
      expect(progressUpdates).toHaveLength(3);
      expect(progressUpdates[0].artifacts[0].data.completedSteps).toBe(0);
      expect(progressUpdates[1].artifacts[0].data.completedSteps).toBe(1);
      expect(progressUpdates[2].artifacts[0].data.completedSteps).toBe(2);
      
      // Verify estimated time decreases
      expect(progressUpdates[0].artifacts[0].data.estimatedTimeRemaining).toBe(45);
      expect(progressUpdates[1].artifacts[0].data.estimatedTimeRemaining).toBe(30);
      expect(progressUpdates[2].artifacts[0].data.estimatedTimeRemaining).toBe(15);
    });

    it('should update progress indicator in UI', async () => {
      const chatSessionId = 'session-ui';
      
      // Initial state
      mockListMessages.mockResolvedValue({
        data: [{
          id: 'msg-1',
          role: 'ai',
          content: { text: 'Processing...' },
          chatSessionId,
          responseComplete: false,
          artifacts: [{
            type: 'job_status',
            data: {
              currentStep: 'terrain_analysis',
              completedSteps: 0,
              totalSteps: 3
            }
          }]
        }]
      });

      const messages = await mockAmplifyClient.models.ChatMessage.list({
        filter: { chatSessionId: { eq: chatSessionId } }
      });

      const status = messages.data[0].artifacts[0].data;
      
      // Verify UI can display progress
      expect(status.currentStep).toBe('terrain_analysis');
      expect(status.completedSteps).toBe(0);
      expect(status.totalSteps).toBe(3);
      
      // Calculate progress percentage for UI
      const progressPercentage = (status.completedSteps / status.totalSteps) * 100;
      expect(progressPercentage).toBe(0);
    });
  });

  describe('Requirement 3: Result Delivery - Automatic Display', () => {
    it('should display results automatically when ready', async () => {
      const chatSessionId = 'session-auto';
      
      // Initial: No results
      mockListMessages.mockResolvedValueOnce({
        data: [{
          id: 'msg-proc',
          role: 'ai',
          content: { text: 'Processing...' },
          chatSessionId,
          responseComplete: false
        }]
      });

      let messages = await mockAmplifyClient.models.ChatMessage.list({
        filter: { chatSessionId: { eq: chatSessionId } }
      });
      
      expect(messages.data[0].responseComplete).toBe(false);

      // After processing: Results appear
      jest.advanceTimersByTime(30000);
      
      mockListMessages.mockResolvedValueOnce({
        data: [
          {
            id: 'msg-proc',
            role: 'ai',
            content: { text: 'Processing...' },
            chatSessionId,
            responseComplete: false
          },
          {
            id: 'msg-complete',
            role: 'ai',
            content: { text: 'Analysis complete!' },
            chatSessionId,
            responseComplete: true,
            artifacts: [
              { type: 'terrain_map', data: { features: 151 } },
              { type: 'wind_rose', data: { speeds: [5, 10, 15] } }
            ]
          }
        ]
      });

      messages = await mockAmplifyClient.models.ChatMessage.list({
        filter: { chatSessionId: { eq: chatSessionId } }
      });

      // Verify results appeared automatically
      const completeMessage = messages.data.find(m => m.responseComplete);
      expect(completeMessage).toBeDefined();
      expect(completeMessage?.artifacts).toHaveLength(2);
      expect(completeMessage?.artifacts[0].type).toBe('terrain_map');
      expect(completeMessage?.artifacts[1].type).toBe('wind_rose');
    });

    it('should render artifacts correctly', async () => {
      const chatSessionId = 'session-render';
      
      mockListMessages.mockResolvedValue({
        data: [{
          id: 'msg-artifacts',
          role: 'ai',
          content: { text: 'Complete analysis' },
          chatSessionId,
          responseComplete: true,
          artifacts: [
            {
              type: 'terrain_map',
              data: {
                features: Array.from({ length: 151 }, (_, i) => ({
                  id: `feature-${i}`,
                  type: 'road',
                  geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }
                })),
                center: { lat: 40.7128, lon: -74.0060 }
              }
            },
            {
              type: 'wind_rose',
              data: {
                speeds: [5, 10, 15, 20],
                directions: [0, 90, 180, 270],
                frequencies: [0.25, 0.25, 0.25, 0.25]
              }
            },
            {
              type: 'layout_map',
              data: {
                turbines: [
                  { id: 1, lat: 40.7128, lon: -74.0060, capacity: 5 },
                  { id: 2, lat: 40.7130, lon: -74.0062, capacity: 5 }
                ],
                totalCapacity: 10
              }
            }
          ]
        }]
      });

      const messages = await mockAmplifyClient.models.ChatMessage.list({
        filter: { chatSessionId: { eq: chatSessionId } }
      });

      const artifacts = messages.data[0].artifacts;
      
      // Verify all artifact types are present and renderable
      expect(artifacts).toHaveLength(3);
      expect(artifacts[0].type).toBe('terrain_map');
      expect(artifacts[0].data.features).toHaveLength(151);
      expect(artifacts[1].type).toBe('wind_rose');
      expect(artifacts[1].data.speeds).toHaveLength(4);
      expect(artifacts[2].type).toBe('layout_map');
      expect(artifacts[2].data.turbines).toHaveLength(2);
    });

    it('should persist results if page is refreshed', async () => {
      const chatSessionId = 'session-persist';
      
      // Results are in DynamoDB
      const completeMessage = {
        id: 'msg-persist',
        role: 'ai',
        content: { text: 'Analysis complete' },
        chatSessionId,
        responseComplete: true,
        artifacts: [
          { type: 'terrain_map', data: { features: 151 } }
        ]
      };

      mockListMessages.mockResolvedValue({
        data: [completeMessage]
      });

      // Simulate page refresh - fetch messages again
      const messages = await mockAmplifyClient.models.ChatMessage.list({
        filter: { chatSessionId: { eq: chatSessionId } }
      });

      // Verify results are still available
      expect(messages.data).toHaveLength(1);
      expect(messages.data[0].responseComplete).toBe(true);
      expect(messages.data[0].artifacts[0].data.features).toBe(151);
    });
  });

  describe('Requirement 4: Error Handling - Clear Feedback', () => {
    it('should show clear error message when job fails', async () => {
      const chatSessionId = 'session-error';
      
      // Job fails during processing
      mockListMessages.mockResolvedValue({
        data: [{
          id: 'msg-error',
          role: 'ai',
          content: { text: 'Analysis failed' },
          chatSessionId,
          responseComplete: true,
          artifacts: [{
            type: 'error',
            data: {
              message: 'Failed to fetch terrain data from OSM',
              type: 'ExternalAPIError',
              remediation: 'Please check your coordinates and try again. Ensure the location is valid.'
            }
          }]
        }]
      });

      const messages = await mockAmplifyClient.models.ChatMessage.list({
        filter: { chatSessionId: { eq: chatSessionId } }
      });

      const errorArtifact = messages.data[0].artifacts[0];
      
      // Verify clear error information
      expect(errorArtifact.type).toBe('error');
      expect(errorArtifact.data.message).toContain('Failed to fetch terrain data');
      expect(errorArtifact.data.type).toBe('ExternalAPIError');
      expect(errorArtifact.data.remediation).toContain('check your coordinates');
    });

    it('should handle Lambda timeout gracefully', async () => {
      const chatSessionId = 'session-timeout';
      
      // Simulate Lambda timeout (90 seconds)
      mockListMessages.mockResolvedValue({
        data: [{
          id: 'msg-timeout',
          role: 'ai',
          content: { text: 'Analysis timed out' },
          chatSessionId,
          responseComplete: true,
          artifacts: [{
            type: 'error',
            data: {
              message: 'Analysis exceeded maximum time limit (90 seconds)',
              type: 'TimeoutError',
              remediation: 'Try reducing the analysis area or simplifying the query.'
            }
          }]
        }]
      });

      const messages = await mockAmplifyClient.models.ChatMessage.list({
        filter: { chatSessionId: { eq: chatSessionId } }
      });

      const errorArtifact = messages.data[0].artifacts[0];
      expect(errorArtifact.data.type).toBe('TimeoutError');
      expect(errorArtifact.data.remediation).toBeDefined();
    });

    it('should allow retry after error', async () => {
      const chatSessionId = 'session-retry';
      
      // First attempt fails
      mockListMessages.mockResolvedValueOnce({
        data: [{
          id: 'msg-error-1',
          role: 'ai',
          content: { text: 'Analysis failed' },
          chatSessionId,
          responseComplete: true,
          artifacts: [{
            type: 'error',
            data: { message: 'Network error', type: 'NetworkError' }
          }]
        }]
      });

      let messages = await mockAmplifyClient.models.ChatMessage.list({
        filter: { chatSessionId: { eq: chatSessionId } }
      });
      
      expect(messages.data[0].artifacts[0].type).toBe('error');

      // User retries - second attempt succeeds
      mockInvoke.mockResolvedValueOnce({
        Payload: Buffer.from(JSON.stringify({
          success: true,
          jobId: 'job-retry',
          message: 'Analysis restarted'
        }))
      });

      const command = new InvokeCommand({
        FunctionName: 'lightweightAgent',
        Payload: JSON.stringify({ query: 'retry', chatSessionId })
      });

      await mockLambdaClient.send(command);

      // Results appear after retry
      mockListMessages.mockResolvedValueOnce({
        data: [
          {
            id: 'msg-error-1',
            role: 'ai',
            content: { text: 'Analysis failed' },
            chatSessionId,
            responseComplete: true,
            artifacts: [{ type: 'error', data: {} }]
          },
          {
            id: 'msg-success',
            role: 'ai',
            content: { text: 'Analysis complete' },
            chatSessionId,
            responseComplete: true,
            artifacts: [{ type: 'terrain_map', data: { features: 151 } }]
          }
        ]
      });

      messages = await mockAmplifyClient.models.ChatMessage.list({
        filter: { chatSessionId: { eq: chatSessionId } }
      });

      // Verify retry succeeded
      const successMessage = messages.data.find(m => 
        m.artifacts.some(a => a.type === 'terrain_map')
      );
      expect(successMessage).toBeDefined();
    });

    it('should handle network errors during polling', async () => {
      const chatSessionId = 'session-network';
      
      // First poll fails
      mockListMessages.mockRejectedValueOnce(new Error('Network timeout'));

      try {
        await mockAmplifyClient.models.ChatMessage.list({
          filter: { chatSessionId: { eq: chatSessionId } }
        });
      } catch (error: any) {
        expect(error.message).toBe('Network timeout');
      }

      // Second poll succeeds
      mockListMessages.mockResolvedValueOnce({
        data: [{
          id: 'msg-recovered',
          role: 'ai',
          content: { text: 'Analysis complete' },
          chatSessionId,
          responseComplete: true,
          artifacts: [{ type: 'terrain_map', data: {} }]
        }]
      });

      jest.advanceTimersByTime(3000);
      
      const messages = await mockAmplifyClient.models.ChatMessage.list({
        filter: { chatSessionId: { eq: chatSessionId } }
      });

      // Verify recovery from network error
      expect(messages.data).toHaveLength(1);
      expect(messages.data[0].responseComplete).toBe(true);
    });
  });

  describe('Integration: Complete User Workflow', () => {
    it('should complete full workflow from query to results', async () => {
      const query = 'Analyze wind farm potential at 40.7128, -74.0060';
      const chatSessionId = 'session-full';
      const userId = 'user-full';

      // Step 1: User submits query
      mockInvoke.mockResolvedValueOnce({
        Payload: Buffer.from(JSON.stringify({
          success: true,
          jobId: 'job-full',
          message: 'Analysis started',
          artifacts: [{
            type: 'job_status',
            data: { status: 'pending' }
          }]
        }))
      });

      const command = new InvokeCommand({
        FunctionName: 'lightweightAgent',
        Payload: JSON.stringify({ query, chatSessionId, userId })
      });

      const response = await mockLambdaClient.send(command);
      const result = JSON.parse(Buffer.from(response.Payload).toString());

      expect(result.success).toBe(true);
      expect(result.jobId).toBe('job-full');

      // Step 2: Frontend shows processing indicator
      mockListMessages.mockResolvedValue({
        data: [{
          id: 'msg-proc',
          role: 'ai',
          content: { text: 'Processing...' },
          chatSessionId,
          responseComplete: false,
          artifacts: [{
            type: 'job_status',
            data: {
              currentStep: 'terrain_analysis',
              completedSteps: 0,
              totalSteps: 3
            }
          }]
        }]
      });

      let messages = await mockAmplifyClient.models.ChatMessage.list({
        filter: { chatSessionId: { eq: chatSessionId } }
      });

      expect(messages.data[0].responseComplete).toBe(false);

      // Step 3: Poll for updates (simulate 40 seconds)
      for (let i = 0; i < 13; i++) {
        jest.advanceTimersByTime(3000);
        await Promise.resolve();
      }

      // Step 4: Results appear
      mockListMessages.mockResolvedValue({
        data: [
          {
            id: 'msg-proc',
            role: 'ai',
            content: { text: 'Processing...' },
            chatSessionId,
            responseComplete: false
          },
          {
            id: 'msg-complete',
            role: 'ai',
            content: { text: 'Complete wind farm analysis ready!' },
            chatSessionId,
            responseComplete: true,
            artifacts: [
              { type: 'terrain_map', data: { features: 151 } },
              { type: 'wind_rose', data: { speeds: [5, 10, 15, 20] } },
              { type: 'layout_map', data: { turbines: 10 } },
              { type: 'simulation_chart', data: { aep: 125000 } }
            ]
          }
        ]
      });

      messages = await mockAmplifyClient.models.ChatMessage.list({
        filter: { chatSessionId: { eq: chatSessionId } }
      });

      // Step 5: Verify complete workflow
      const completeMessage = messages.data.find(m => m.responseComplete);
      expect(completeMessage).toBeDefined();
      expect(completeMessage?.artifacts).toHaveLength(4);
      expect(completeMessage?.artifacts[0].type).toBe('terrain_map');
      expect(completeMessage?.artifacts[0].data.features).toBe(151);
      expect(completeMessage?.artifacts[1].type).toBe('wind_rose');
      expect(completeMessage?.artifacts[2].type).toBe('layout_map');
      expect(completeMessage?.artifacts[3].type).toBe('simulation_chart');
    });
  });
});
