/**
 * Integration Tests - Measurement Routes
 */
const request = require('supertest');
const app = require('../../src/app');
const pool = require('../../src/db/pool');

jest.mock('../../src/db/pool');

describe('Measurement Routes Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/measurements', () => {
    it('should record a measurement', async () => {
      const mockMeasurement = {
        id: 'measurement-123',
        station_id: 'station-123',
        temperature: 23.5,
        humidity: 65,
        pressure: 1013.25,
        recorded_at: new Date(),
      };

      // Mock station exists check
      pool.query.mockResolvedValueOnce({ rows: [{ id: 'station-123' }] });
      // Mock measurement insert (recordMeasurementWithAlerts)
      pool.query.mockResolvedValueOnce({ rows: [mockMeasurement] });
      // Mock alert processing (no alerts triggered)
      // Mock update last_seen
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/measurements')
        .send({
          stationId: 'station-123',
          temperature: 23.5,
          humidity: 65,
          pressure: 1013.25,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Measurement recorded successfully');
      expect(response.body).toHaveProperty('measurement');
      expect(response.body).toHaveProperty('alerts');
      expect(response.body).toHaveProperty('alertsTriggered');
    });

    it('should reject missing stationId', async () => {
      const response = await request(app)
        .post('/api/measurements')
        .send({
          temperature: 23.5,
          humidity: 65,
        });

      expect(response.status).toBe(400);
    });

    it('should reject invalid humidity', async () => {
      const response = await request(app)
        .post('/api/measurements')
        .send({
          stationId: 'station-123',
          humidity: 150,
        });

      expect(response.status).toBe(400);
    });

    it('should return 404 if station not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/measurements')
        .send({
          stationId: 'invalid-station',
          temperature: 23.5,
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Station not found');
    });
  });

  describe('GET /api/measurements/station/:stationId', () => {
    it('should get measurements for a station', async () => {
      const mockMeasurements = [
        { id: '1', temperature: 23.5, recorded_at: new Date() },
        { id: '2', temperature: 24.1, recorded_at: new Date() },
      ];

      // Mock station exists check
      pool.query.mockResolvedValueOnce({ rows: [{ id: 'station-123' }] });
      // Mock measurements query
      pool.query.mockResolvedValueOnce({ rows: mockMeasurements });

      const response = await request(app)
        .get('/api/measurements/station/station-123')
        .query({ period: '24h' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Measurements retrieved successfully');
      expect(response.body).toHaveProperty('count', 2);
      expect(response.body.measurements).toHaveLength(2);
    });

    it('should accept different periods', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 'station-123' }] });
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/measurements/station/station-123')
        .query({ period: '7d' });

      expect(response.status).toBe(200);
    });

    it('should reject invalid period', async () => {
      const response = await request(app)
        .get('/api/measurements/station/station-123')
        .query({ period: 'invalid' });

      expect(response.status).toBe(400);
    });

    it('should return 404 if station not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/measurements/station/invalid-station');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/measurements/station/:stationId/latest', () => {
    it('should get latest measurement', async () => {
      const mockMeasurement = {
        id: 'measurement-123',
        temperature: 25.0,
        recorded_at: new Date(),
      };

      // Mock station exists check
      pool.query.mockResolvedValueOnce({ rows: [{ id: 'station-123' }] });
      // Mock latest measurement query
      pool.query.mockResolvedValueOnce({ rows: [mockMeasurement] });

      const response = await request(app)
        .get('/api/measurements/station/station-123/latest');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Latest measurement retrieved');
      expect(response.body).toHaveProperty('measurement');
    });
  });

  describe('GET /api/measurements/station/:stationId/stats', () => {
    it('should get measurement statistics', async () => {
      const mockStats = {
        avg_temperature: 23.5,
        min_temperature: 20.0,
        max_temperature: 26.5,
        avg_humidity: 65,
        total_measurements: 100,
      };

      // Mock station exists check
      pool.query.mockResolvedValueOnce({ rows: [{ id: 'station-123' }] });
      // Mock stats query
      pool.query.mockResolvedValueOnce({ rows: [mockStats] });

      const response = await request(app)
        .get('/api/measurements/station/station-123/stats')
        .query({ period: '24h' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Measurement statistics retrieved');
      expect(response.body).toHaveProperty('stats');
      expect(response.body.stats).toHaveProperty('avg_temperature');
    });
  });
});
