#!/usr/bin/env python3
"""
KirkEpsteinify API Test Script
Script for testing all API endpoints
"""

import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:5000"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

def print_header(text):
    print(f"\n{Colors.BLUE}{'='*50}{Colors.RESET}")
    print(f"{Colors.BLUE}{text}{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*50}{Colors.RESET}\n")

def print_success(text):
    print(f"{Colors.GREEN}✓ {text}{Colors.RESET}")

def print_error(text):
    print(f"{Colors.RED}✗ {text}{Colors.RESET}")

def print_info(text):
    print(f"{Colors.YELLOW}ℹ {text}{Colors.RESET}")

def test_health_check():
    """Test /health endpoint"""
    print_header("1. HEALTH CHECK")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print_success("Server is healthy")
            print(f"Status: {data['status']}")
            print(f"Database: {data['database']}")
            return True
        else:
            print_error(f"Health check failed with status {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Error: {e}")
        return False

def test_registration():
    """Test user registration"""
    print_header("2. USER REGISTRATION")
    try:
        user_data = {
            "email": f"testuser_{int(time.time())}@example.com",
            "username": f"testuser_{int(time.time())}",
            "password": "testpass123!"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=user_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 201:
            data = response.json()
            user_id = data['user']['id']
            print_success(f"User registered: {user_data['email']}")
            print(f"User ID: {user_id}")
            return user_id, user_data['email'], user_data['password']
        else:
            print_error(f"Registration failed: {response.json()}")
            return None, None, None
    except Exception as e:
        print_error(f"Error: {e}")
        return None, None, None

def test_login(email, password):
    """Test user login"""
    print_header("3. USER LOGIN")
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": email, "password": password},
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Login successful for {email}")
            print(f"User role: {data['user']['role']}")
            return True
        else:
            print_error(f"Login failed: {response.json()}")
            return False
    except Exception as e:
        print_error(f"Error: {e}")
        return False

def test_add_station(user_id):
    """Test adding a weather station"""
    print_header("4. ADD WEATHER STATION")
    try:
        station_data = {
            "userId": user_id,
            "name": f"Test Station {int(time.time())}",
            "location": "Kyiv, Ukraine"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/stations",
            json=station_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 201:
            data = response.json()
            station_id = data['station']['id']
            print_success(f"Station created: {station_data['name']}")
            print(f"Station ID: {station_id}")
            return station_id
        else:
            print_error(f"Station creation failed: {response.json()}")
            return None
    except Exception as e:
        print_error(f"Error: {e}")
        return None

def test_get_stations(user_id):
    """Test getting user's stations"""
    print_header("5. GET USER STATIONS")
    try:
        response = requests.get(
            f"{BASE_URL}/api/stations?userId={user_id}",
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Retrieved {len(data['stations'])} stations")
            for station in data['stations']:
                print(f"  - {station['name']} ({station['id']})")
            return True
        else:
            print_error(f"Failed to get stations: {response.json()}")
            return False
    except Exception as e:
        print_error(f"Error: {e}")
        return False

def test_post_measurement(station_id):
    """Test posting a measurement"""
    print_header("6. POST MEASUREMENT")
    try:
        measurement_data = {
            "stationId": station_id,
            "temperature": 22.5,
            "humidity": 65.0,
            "pressure": 1013.25,
            "windSpeed": 5.2,
            "rainfall": 0.0,
            "lightLevel": 750.0
        }
        
        response = requests.post(
            f"{BASE_URL}/api/measurements",
            json=measurement_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 201:
            data = response.json()
            print_success("Measurement recorded successfully")
            print(f"Temperature: {data['measurement']['temperature']}°C")
            print(f"Humidity: {data['measurement']['humidity']}%")
            print(f"Pressure: {data['measurement']['pressure']} hPa")
            return True
        else:
            print_error(f"Failed to post measurement: {response.json()}")
            return False
    except Exception as e:
        print_error(f"Error: {e}")
        return False

def test_post_multiple_measurements(station_id):
    """Test posting multiple measurements"""
    print_header("7. POST MULTIPLE MEASUREMENTS")
    try:
        measurements = [
            {"temperature": 21.8, "humidity": 62.5, "pressure": 1012.80},
            {"temperature": 23.1, "humidity": 68.0, "pressure": 1014.00},
            {"temperature": 20.5, "humidity": 70.5, "pressure": 1015.20}
        ]
        
        for i, meas in enumerate(measurements):
            data = {
                "stationId": station_id,
                "temperature": meas['temperature'],
                "humidity": meas['humidity'],
                "pressure": meas['pressure']
            }
            response = requests.post(
                f"{BASE_URL}/api/measurements",
                json=data,
                headers={"Content-Type": "application/json"}
            )
            if response.status_code == 201:
                print_success(f"Measurement {i+1} posted: {meas['temperature']}°C")
            time.sleep(0.5)
        
        return True
    except Exception as e:
        print_error(f"Error: {e}")
        return False

def test_get_measurements(station_id, period='24h'):
    """Test getting measurements history"""
    print_header(f"8. GET MEASUREMENTS HISTORY ({period})")
    try:
        response = requests.get(
            f"{BASE_URL}/api/stations/{station_id}/measurements?period={period}",
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Retrieved {data['count']} measurements")
            for i, meas in enumerate(data['measurements'][:3]):  # Show first 3
                print(f"  {i+1}. T: {meas['temperature']}°C, H: {meas['humidity']}%, P: {meas['pressure']} hPa")
            if len(data['measurements']) > 3:
                print(f"  ... and {len(data['measurements']) - 3} more")
            return True
        else:
            print_error(f"Failed to get measurements: {response.json()}")
            return False
    except Exception as e:
        print_error(f"Error: {e}")
        return False

def main():
    """Run all tests"""
    print(f"\n{Colors.BLUE}")
    print("╔════════════════════════════════════════╗")
    print("║  KirkEpsteinify API Test Suite         ║")
    print("║  Backend Testing Tool                  ║")
    print("╚════════════════════════════════════════╝")
    print(f"{Colors.RESET}")
    
    print_info(f"Testing API at: {BASE_URL}")
    print_info(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Run tests in sequence
    tests_passed = 0
    tests_failed = 0
    
    # Test 1: Health Check
    if test_health_check():
        tests_passed += 1
    else:
        tests_failed += 1
        return
    
    # Test 2: Registration
    user_id, email, password = test_registration()
    if user_id:
        tests_passed += 1
    else:
        tests_failed += 1
        return
    
    # Test 3: Login
    if test_login(email, password):
        tests_passed += 1
    else:
        tests_failed += 1
    
    # Test 4: Add Station
    station_id = test_add_station(user_id)
    if station_id:
        tests_passed += 1
    else:
        tests_failed += 1
        return
    
    # Test 5: Get Stations
    if test_get_stations(user_id):
        tests_passed += 1
    else:
        tests_failed += 1
    
    # Test 6: Post Measurement
    if test_post_measurement(station_id):
        tests_passed += 1
    else:
        tests_failed += 1
    
    # Test 7: Post Multiple Measurements
    if test_post_multiple_measurements(station_id):
        tests_passed += 1
    else:
        tests_failed += 1
    
    # Test 8: Get Measurements
    if test_get_measurements(station_id, '24h'):
        tests_passed += 1
    else:
        tests_failed += 1
    
    # Print summary
    print_header("TEST SUMMARY")
    print_success(f"Tests passed: {tests_passed}")
    print_error(f"Tests failed: {tests_failed}")
    print_info(f"Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"\n{Colors.GREEN}All tests completed!{Colors.RESET}\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print_error("\nTests interrupted by user")
    except Exception as e:
        print_error(f"Unexpected error: {e}")
