/**
 * Measurement Service Tests
 */
const measurementService = require('../../src/services/measurementService');
const pool = require('../../src/db/pool');
const alertService = require('../../src/services/alertService');

jest.mock('../../src/db/pool');
jest.mock('../../src/services/alertService');

describe('MeasurementService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('recordMeasurementWithAlerts', () => {
    it('should record a measurement and process alerts', async () => {
      const mockMeasurement = {
        id: 'measurement-123',
        station_id: 'station-123',
        temperature: 23.5,
        humidity: 65,
      };

      pool.query.mockResolvedValueOnce({ rows: [mockMeasurement] });
      alertService.processAlerts.mockResolvedValueOnce([]);

      const result = await measurementService.recordMeasurementWithAlerts('station-123', {
        temperature: 23.5,
        humidity: 65,
        pressure: 1013.25,
      });

      expect(result).toHaveProperty('measurement');
      expect(result).toHaveProperty('alerts');
      expect(result.alertCount).toBe(0);
    });
  });

  describe('getMeasurementsByPeriod', () => {
    it('should get measurements for 24h period', async () => {
      const mockMeasurements = [
        { id: '1', temperature: 23.5 },
        { id: '2', temperature: 24.1 },
      ];

      pool.query.mockResolvedValueOnce({ rows: mockMeasurements });

      const result = await measurementService.getMeasurementsByPeriod('station-123', '24h');

      expect(result).toHaveLength(2);
      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['station-123', '24 hours', 1000])
      );
    });

    it('should get measurements for 7d period', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await measurementService.getMeasurementsByPeriod('station-123', '7d');

      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['station-123', '7 days', 1000])
      );
    });

    it('should default to 24h if period is invalid', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await measurementService.getMeasurementsByPeriod('station-123', 'invalid');

      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['station-123', '24 hours', 1000])
      );
    });
  });

  describe('getLatestMeasurement', () => {
    it('should return latest measurement', async () => {
      const mockMeasurement = {
        id: 'measurement-123',
        temperature: 25.0,
        recorded_at: new Date(),
      };

      pool.query.mockResolvedValueOnce({ rows: [mockMeasurement] });

      const result = await measurementService.getLatestMeasurement('station-123');

      expect(result).toEqual(mockMeasurement);
    });

    it('should return null if no measurements', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const result = await measurementService.getLatestMeasurement('station-123');

      expect(result).toBeNull();
    });
  });

  describe('getMeasurementStats', () => {
    it('should return measurement statistics', async () => {
      const mockStats = {
        avg_temperature: 23.5,
        min_temperature: 20.0,
        max_temperature: 26.5,
        avg_humidity: 65,
        total_measurements: 100,
      };

      pool.query.mockResolvedValueOnce({ rows: [mockStats] });

      const result = await measurementService.getMeasurementStats('station-123', '24h');

      expect(result).toEqual(mockStats);
      expect(result).toHaveProperty('avg_temperature');
      expect(result).toHaveProperty('min_temperature');
      expect(result).toHaveProperty('max_temperature');
    });
  });

  describe('deleteOldMeasurements', () => {
    it('should delete measurements older than specified days', async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 50 });

      const result = await measurementService.deleteOldMeasurements(365);

      expect(result).toBe(50);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM measurements')
      );
    });
  });
});
