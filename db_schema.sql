-- Create extension for UUID support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  username VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user', -- 'user', 'admin'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for email lookups (frequently used in login)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- STATIONS TABLE (IoT Devices)
-- ============================================
CREATE TABLE IF NOT EXISTS stations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(500),
  firmware_version VARCHAR(50),
  last_seen TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for station lookups
CREATE INDEX IF NOT EXISTS idx_stations_user_id ON stations(user_id);
CREATE INDEX IF NOT EXISTS idx_stations_is_active ON stations(is_active);

-- ============================================
-- MEASUREMENTS TABLE (Time Series Data)
-- ============================================
CREATE TABLE IF NOT EXISTS measurements (
  id BIGSERIAL PRIMARY KEY,
  station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  temperature DECIMAL(10, 2),
  humidity DECIMAL(10, 2),
  pressure DECIMAL(10, 2),
  wind_speed DECIMAL(10, 2),
  rainfall DECIMAL(10, 2),
  light_level DECIMAL(10, 2),
  recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Critical indexes for time series queries
CREATE INDEX IF NOT EXISTS idx_measurements_station_id ON measurements(station_id);
CREATE INDEX IF NOT EXISTS idx_measurements_recorded_at ON measurements(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_measurements_station_recorded ON measurements(station_id, recorded_at DESC);

-- For fast lookups of recent data
CREATE INDEX IF NOT EXISTS idx_measurements_station_created ON measurements(station_id, created_at DESC);

-- ============================================
-- ALERTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL, -- 'temperature', 'humidity', 'pressure', 'custom'
  condition VARCHAR(50) NOT NULL, -- 'greater_than', 'less_than', 'equals'
  threshold DECIMAL(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for alert lookups
CREATE INDEX IF NOT EXISTS idx_alerts_station_id ON alerts(station_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_is_active ON alerts(is_active);

-- ============================================
-- ALERT_NOTIFICATIONS TABLE (Log of triggered alerts)
-- ============================================
CREATE TABLE IF NOT EXISTS alert_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  measurement_value DECIMAL(10, 2),
  triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notification_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for alert history lookups
CREATE INDEX IF NOT EXISTS idx_alert_notifications_alert_id ON alert_notifications(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_triggered_at ON alert_notifications(triggered_at DESC);

-- ============================================
-- SYSTEM ALERTS TABLE (Auto-generated warnings)
-- ============================================
CREATE TABLE IF NOT EXISTS system_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL, -- 'STORM_WARNING', 'FROST_WARNING', etc.
  pressure_change DECIMAL(10, 2),
  temperature_value DECIMAL(10, 2),
  description VARCHAR(500),
  severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  is_resolved BOOLEAN DEFAULT FALSE,
  triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for system alerts
CREATE INDEX IF NOT EXISTS idx_system_alerts_station_id ON system_alerts(station_id);
CREATE INDEX IF NOT EXISTS idx_system_alerts_alert_type ON system_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_system_alerts_triggered_at ON system_alerts(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_alerts_is_resolved ON system_alerts(is_resolved);

-- ============================================
-- AUDIT LOGS TABLE (System activity tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, -- 'USER_CREATED', 'STATION_DELETED', 'ALERT_TRIGGERED', etc.
  resource_type VARCHAR(50), -- 'user', 'station', 'measurement', 'alert'
  resource_id VARCHAR(100),
  details JSONB, -- Additional details as JSON
  ip_address VARCHAR(45),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
