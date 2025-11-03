/**
 * Unit tests for Equipment Status Handler
 */

import { handleEquipmentStatus } from '../handlers/equipmentStatusHandler';

describe('Equipment Status Handler', () => {
  describe('Valid Equipment ID Tests', () => {
    it('should return equipment status for PUMP-001', async () => {
      const result = await handleEquipmentStatus('What is the status of PUMP-001?', 'PUMP-001');

      expect(result.success).toBe(true);
      expect(result.message).toContain('PUMP-001');
      expect(result.message).toContain('Primary Cooling Pump');
      expect(result.artifacts).toHaveLength(1);
      expect(result.artifacts[0].messageContentType).toBe('equipment_health');
      expect(result.artifacts[0].data.equipmentId).toBe('PUMP-001');
      expect(result.artifacts[0].data.healthScore).toBeDefined();
      expect(result.thoughtSteps).toBeDefined();
      expect(result.thoughtSteps!.length).toBeGreaterThan(0);
    });

    it('should return equipment status for COMP-123', async () => {
      const result = await handleEquipmentStatus('Check status of COMP-123', 'COMP-123');

      expect(result.success).toBe(true);
      expect(result.message).toContain('COMP-123');
      expect(result.message).toContain('Main Air Compressor');
      expect(result.artifacts).toHaveLength(1);
      expect(result.artifacts[0].data.equipmentId).toBe('COMP-123');
      expect(result.artifacts[0].data.operationalStatus).toBe('degraded');
    });

    it('should include sensor data in response', async () => {
      const result = await handleEquipmentStatus('Status of PUMP-001', 'PUMP-001');

      expect(result.success).toBe(true);
      expect(result.artifacts[0].data.sensors).toBeDefined();
      expect(result.artifacts[0].data.sensors.length).toBeGreaterThan(0);
      
      const sensor = result.artifacts[0].data.sensors[0];
      expect(sensor).toHaveProperty('type');
      expect(sensor).toHaveProperty('currentValue');
      expect(sensor).toHaveProperty('unit');
      expect(sensor).toHaveProperty('status');
      expect(sensor).toHaveProperty('normalRange');
    });

    it('should include health score and operational status', async () => {
      const result = await handleEquipmentStatus('PUMP-001 status', 'PUMP-001');

      expect(result.success).toBe(true);
      expect(result.artifacts[0].data.healthScore).toBe(85);
      expect(result.artifacts[0].data.operationalStatus).toBe('operational');
      expect(result.message).toContain('85/100');
    });

    it('should include maintenance dates', async () => {
      const result = await handleEquipmentStatus('PUMP-001 status', 'PUMP-001');

      expect(result.success).toBe(true);
      expect(result.artifacts[0].data.lastMaintenanceDate).toBeDefined();
      expect(result.artifacts[0].data.nextMaintenanceDate).toBeDefined();
      expect(result.message).toContain('Last maintenance');
      expect(result.message).toContain('Next scheduled');
    });
  });

  describe('Error Handling Tests', () => {
    it('should return error when equipment ID is missing', async () => {
      const result = await handleEquipmentStatus('What is the equipment status?');

      expect(result.success).toBe(false);
      expect(result.message).toContain('specify an equipment ID');
      expect(result.artifacts).toHaveLength(0);
      expect(result.thoughtSteps).toBeDefined();
      expect(result.thoughtSteps![0].type).toBe('error');
      expect(result.thoughtSteps![0].title).toBe('Missing Equipment ID');
    });

    it('should return error when equipment ID is not found', async () => {
      const result = await handleEquipmentStatus('Status of INVALID-999', 'INVALID-999');

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
      expect(result.message).toContain('INVALID-999');
      expect(result.artifacts).toHaveLength(0);
      expect(result.thoughtSteps).toBeDefined();
      expect(result.thoughtSteps![0].type).toBe('error');
      expect(result.thoughtSteps![0].title).toBe('Equipment Not Found');
    });

    it('should handle empty equipment ID', async () => {
      const result = await handleEquipmentStatus('Status check', '');

      expect(result.success).toBe(false);
      expect(result.message).toContain('specify an equipment ID');
      expect(result.artifacts).toHaveLength(0);
    });
  });

  describe('Response Structure Tests', () => {
    it('should return correct artifact structure', async () => {
      const result = await handleEquipmentStatus('PUMP-001 status', 'PUMP-001');

      expect(result.success).toBe(true);
      expect(result.artifacts[0]).toHaveProperty('messageContentType');
      expect(result.artifacts[0]).toHaveProperty('title');
      expect(result.artifacts[0]).toHaveProperty('subtitle');
      expect(result.artifacts[0]).toHaveProperty('data');
      expect(result.artifacts[0]).toHaveProperty('visualizationType');
      expect(result.artifacts[0].visualizationType).toBe('gauge');
    });

    it('should include thought steps with correct structure', async () => {
      const result = await handleEquipmentStatus('PUMP-001 status', 'PUMP-001');

      expect(result.success).toBe(true);
      expect(result.thoughtSteps).toBeDefined();
      expect(result.thoughtSteps!.length).toBeGreaterThan(0);
      
      const step = result.thoughtSteps![0];
      expect(step).toHaveProperty('type');
      expect(step).toHaveProperty('title');
      expect(step).toHaveProperty('summary');
      expect(step).toHaveProperty('status');
      expect(step).toHaveProperty('timestamp');
    });

    it('should include all required data fields', async () => {
      const result = await handleEquipmentStatus('PUMP-001 status', 'PUMP-001');

      expect(result.success).toBe(true);
      const data = result.artifacts[0].data;
      
      expect(data).toHaveProperty('equipmentId');
      expect(data).toHaveProperty('name');
      expect(data).toHaveProperty('type');
      expect(data).toHaveProperty('location');
      expect(data).toHaveProperty('operationalStatus');
      expect(data).toHaveProperty('healthScore');
      expect(data).toHaveProperty('lastMaintenanceDate');
      expect(data).toHaveProperty('nextMaintenanceDate');
      expect(data).toHaveProperty('manufacturer');
      expect(data).toHaveProperty('model');
      expect(data).toHaveProperty('sensors');
    });
  });

  describe('Sensor Status Tests', () => {
    it('should correctly identify normal sensor status', async () => {
      const result = await handleEquipmentStatus('PUMP-001 status', 'PUMP-001');

      expect(result.success).toBe(true);
      const sensors = result.artifacts[0].data.sensors;
      const normalSensors = sensors.filter((s: any) => s.status === 'normal');
      expect(normalSensors.length).toBeGreaterThan(0);
    });

    it('should correctly identify warning sensor status for degraded equipment', async () => {
      const result = await handleEquipmentStatus('COMP-123 status', 'COMP-123');

      expect(result.success).toBe(true);
      const sensors = result.artifacts[0].data.sensors;
      const warningSensors = sensors.filter((s: any) => s.status === 'warning');
      expect(warningSensors.length).toBeGreaterThan(0);
      expect(result.message).toContain('WARNING');
    });

    it('should include sensor alert thresholds', async () => {
      const result = await handleEquipmentStatus('PUMP-001 status', 'PUMP-001');

      expect(result.success).toBe(true);
      const sensor = result.artifacts[0].data.sensors[0];
      expect(sensor.alertThreshold).toBeDefined();
      expect(sensor.alertThreshold).toHaveProperty('warning');
      expect(sensor.alertThreshold).toHaveProperty('critical');
    });
  });

  describe('Message Content Tests', () => {
    it('should include health status description in message', async () => {
      const result = await handleEquipmentStatus('PUMP-001 status', 'PUMP-001');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Good'); // Health score 85 = Good
    });

    it('should warn about degraded equipment', async () => {
      const result = await handleEquipmentStatus('COMP-123 status', 'COMP-123');

      expect(result.success).toBe(true);
      expect(result.message).toContain('degraded');
      expect(result.message).toContain('Fair'); // Health score 65 = Fair
    });

    it('should indicate when all sensors are normal', async () => {
      const result = await handleEquipmentStatus('PUMP-001 status', 'PUMP-001');

      expect(result.success).toBe(true);
      expect(result.message).toContain('normal parameters');
    });
  });
});
