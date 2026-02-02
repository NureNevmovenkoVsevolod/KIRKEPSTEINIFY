/**
 * Validation Middleware Tests
 */
const validators = require('../../src/middleware/validation');

describe('Validation Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe('validateRegister', () => {
    it('should pass valid registration data', () => {
      req.body = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      };

      validators.validateRegister(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject missing email', () => {
      req.body = {
        username: 'testuser',
        password: 'password123',
      };

      validators.validateRegister(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid email format', () => {
      req.body = {
        email: 'invalid-email',
        username: 'testuser',
        password: 'password123',
      };

      validators.validateRegister(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject short password', () => {
      req.body = {
        email: 'test@example.com',
        username: 'testuser',
        password: '123',
      };

      validators.validateRegister(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject invalid username length', () => {
      req.body = {
        email: 'test@example.com',
        username: 'ab',
        password: 'password123',
      };

      validators.validateRegister(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateLogin', () => {
    it('should pass valid login data', () => {
      req.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      validators.validateLogin(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject missing email', () => {
      req.body = {
        password: 'password123',
      };

      validators.validateLogin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateCreateStation', () => {
    it('should pass valid station data', () => {
      req.body = {
        userId: 'user-123',
        name: 'My Station',
        location: 'Berlin',
      };

      validators.validateCreateStation(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject missing userId', () => {
      req.body = {
        name: 'My Station',
      };

      validators.validateCreateStation(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject invalid station name length', () => {
      req.body = {
        userId: 'user-123',
        name: 'A',
      };

      validators.validateCreateStation(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateMeasurement', () => {
    it('should pass valid measurement data', () => {
      req.body = {
        stationId: 'station-123',
        temperature: 23.5,
        humidity: 65,
      };

      validators.validateMeasurement(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject missing stationId', () => {
      req.body = {
        temperature: 23.5,
      };

      validators.validateMeasurement(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject invalid temperature type', () => {
      req.body = {
        stationId: 'station-123',
        temperature: 'not-a-number',
      };

      validators.validateMeasurement(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject invalid humidity range', () => {
      req.body = {
        stationId: 'station-123',
        humidity: 150,
      };

      validators.validateMeasurement(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validatePeriod', () => {
    it('should pass valid period', () => {
      req.query = { period: '24h' };

      validators.validatePeriod(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should pass without period', () => {
      req.query = {};

      validators.validatePeriod(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject invalid period', () => {
      req.query = { period: 'invalid' };

      validators.validatePeriod(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
