/**
 * Auth Service Tests
 */
const bcrypt = require('bcrypt');
const authService = require('../../src/services/authService');
const pool = require('../../src/db/pool');

// Mock the database pool
jest.mock('../../src/db/pool');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        username: 'testuser',
        created_at: new Date(),
      };

      pool.query.mockResolvedValueOnce({ rows: [mockUser] });

      const result = await authService.register('test@example.com', 'testuser', 'password123');

      expect(result).toEqual(mockUser);
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining(['test@example.com', 'testuser', expect.any(String)])
      );
    });

    it('should hash the password', async () => {
      const password = 'password123';
      pool.query.mockResolvedValueOnce({ rows: [{ id: '123' }] });

      const bcryptHashSpy = jest.spyOn(bcrypt, 'hash');

      await authService.register('test@example.com', 'testuser', password);

      expect(bcryptHashSpy).toHaveBeenCalledWith(password, 10);
      bcryptHashSpy.mockRestore();
    });
  });

  describe('login', () => {
    it('should return user object on successful login', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        username: 'testuser',
        password_hash: hashedPassword,
        role: 'user',
      };

      pool.query.mockResolvedValueOnce({ rows: [mockUser] });

      const result = await authService.login('test@example.com', 'password123');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email', 'test@example.com');
      expect(result).not.toHaveProperty('password_hash');
    });

    it('should return null if user not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const result = await authService.login('notfound@example.com', 'password123');

      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        username: 'testuser',
        password_hash: hashedPassword,
        role: 'user',
      };

      pool.query.mockResolvedValueOnce({ rows: [mockUser] });

      const result = await authService.login('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return user by id', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'user',
        created_at: new Date(),
      };

      pool.query.mockResolvedValueOnce({ rows: [mockUser] });

      const result = await authService.findById('123');

      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const result = await authService.findById('invalid');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        username: 'testuser',
      };

      pool.query.mockResolvedValueOnce({ rows: [mockUser] });

      const result = await authService.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const result = await authService.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });
});
