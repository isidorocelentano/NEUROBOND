#!/usr/bin/env python3
"""
FRONTEND 422 ERROR SIMULATION TEST
Simulating the exact frontend request that causes 422 errors
"""

import requests
import json
import time

class Frontend422ErrorSimulation:
    def __init__(self, base_url="https://neurobond-empathy.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        
        print("🚨 FRONTEND 422 ERROR SIMULATION")
        print("=" * 50)
        print(f"Backend URL: {self.base_url}")
        print(f"API URL: {self.api_url}")
        print("Simulating exact frontend requests that cause 422 errors")
        print("=" * 50)

    def simulate_frontend_checkout_request(self):
        """Simulate the exact request that frontend makes"""
        print("\n🔍 SIMULATING FRONTEND CHECKOUT REQUEST")
        print("-" * 40)
        
        # This simulates what the frontend JavaScript might send
        frontend_request_data = {
            "package_type": "monthly",
            "origin_url": self.base_url,
            "user_id": "test-user-123",  # Extra field that might cause issues
            "additional_data": "some_value"  # Extra field that might cause issues
        }
        
        url = f"{self.api_url}/checkout/session"
        headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Frontend-Test)',
            'Accept': 'application/json'
        }
        
        print(f"URL: {url}")
        print(f"Headers: {json.dumps(headers, indent=2)}")
        print(f"Request Data: {json.dumps(frontend_request_data, indent=2)}")
        
        try:
            start_time = time.time()
            response = requests.post(url, json=frontend_request_data, headers=headers, timeout=30)
            response_time = time.time() - start_time
            
            print(f"\nResponse Time: {response_time:.2f}s")
            print(f"Status Code: {response.status_code}")
            print(f"Response Headers: {dict(response.headers)}")
            
            if response.status_code == 422:
                print("🚨 422 ERROR FOUND!")
                try:
                    error_data = response.json()
                    print(f"Error Details: {json.dumps(error_data, indent=2)}")
                    return True, error_data
                except:
                    print(f"Error Text: {response.text}")
                    return True, response.text
            else:
                print(f"✅ No 422 error - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"Response: {json.dumps(response_data, indent=2)}")
                    return False, response_data
                except:
                    print(f"Response Text: {response.text}")
                    return False, response.text
                    
        except Exception as e:
            print(f"❌ Request failed: {str(e)}")
            return False, str(e)

    def test_various_frontend_scenarios(self):
        """Test various scenarios that might cause 422 errors"""
        print("\n🔍 TESTING VARIOUS FRONTEND SCENARIOS")
        print("-" * 40)
        
        scenarios = [
            {
                "name": "Standard Frontend Request",
                "data": {
                    "package_type": "monthly",
                    "origin_url": self.base_url
                }
            },
            {
                "name": "Frontend with Extra Fields",
                "data": {
                    "package_type": "monthly",
                    "origin_url": self.base_url,
                    "user_id": "test-user",
                    "csrf_token": "abc123",
                    "timestamp": "2024-01-15T10:00:00Z"
                }
            },
            {
                "name": "Frontend with Null Values",
                "data": {
                    "package_type": "monthly",
                    "origin_url": self.base_url,
                    "user_id": None,
                    "additional_info": None
                }
            },
            {
                "name": "Frontend with Empty Strings",
                "data": {
                    "package_type": "monthly",
                    "origin_url": self.base_url,
                    "user_name": "",
                    "email": ""
                }
            },
            {
                "name": "Frontend with Wrong Types",
                "data": {
                    "package_type": "monthly",
                    "origin_url": self.base_url,
                    "user_id": 12345,
                    "is_premium": True,
                    "metadata": {"key": "value"}
                }
            },
            {
                "name": "Malformed Package Type",
                "data": {
                    "package_type": "Monthly",  # Capital M
                    "origin_url": self.base_url
                }
            },
            {
                "name": "Package Type with Spaces",
                "data": {
                    "package_type": " monthly ",  # Spaces
                    "origin_url": self.base_url
                }
            },
            {
                "name": "Missing Required Fields",
                "data": {
                    "package_type": "monthly"
                    # Missing origin_url
                }
            },
            {
                "name": "URL with Query Parameters",
                "data": {
                    "package_type": "monthly",
                    "origin_url": f"{self.base_url}?utm_source=test&utm_medium=frontend"
                }
            },
            {
                "name": "URL with Fragment",
                "data": {
                    "package_type": "monthly",
                    "origin_url": f"{self.base_url}#checkout"
                }
            }
        ]
        
        results = []
        for scenario in scenarios:
            print(f"\n📋 Testing: {scenario['name']}")
            print(f"   Data: {json.dumps(scenario['data'], indent=6)}")
            
            url = f"{self.api_url}/checkout/session"
            headers = {'Content-Type': 'application/json'}
            
            try:
                response = requests.post(url, json=scenario['data'], headers=headers, timeout=15)
                
                result = {
                    "scenario": scenario['name'],
                    "status_code": response.status_code,
                    "is_422": response.status_code == 422,
                    "request_data": scenario['data']
                }
                
                if response.status_code == 422:
                    print(f"   🚨 422 ERROR FOUND!")
                    try:
                        error_data = response.json()
                        result["error_details"] = error_data
                        print(f"   Error: {json.dumps(error_data, indent=6)}")
                    except:
                        result["error_details"] = response.text
                        print(f"   Error Text: {response.text}")
                else:
                    print(f"   ✅ Status: {response.status_code}")
                    if response.status_code == 200:
                        try:
                            response_data = response.json()
                            if 'session_id' in response_data:
                                print(f"   ✅ Session created: {response_data['session_id']}")
                        except:
                            pass
                
                results.append(result)
                
            except Exception as e:
                print(f"   ❌ Request failed: {str(e)}")
                results.append({
                    "scenario": scenario['name'],
                    "status_code": "ERROR",
                    "is_422": False,
                    "error": str(e),
                    "request_data": scenario['data']
                })
        
        return results

    def analyze_422_errors(self, results):
        """Analyze all 422 errors found"""
        print("\n" + "=" * 60)
        print("🚨 422 ERROR ANALYSIS REPORT")
        print("=" * 60)
        
        error_422_results = [r for r in results if r.get('is_422', False)]
        
        if not error_422_results:
            print("✅ NO 422 ERRORS FOUND in frontend simulation")
            print("   This suggests the 422 errors might be:")
            print("   1. Intermittent/timing related")
            print("   2. Specific to certain frontend configurations")
            print("   3. Related to browser-specific request formatting")
            print("   4. Already fixed in current backend version")
            return
        
        print(f"Found {len(error_422_results)} scenarios that produce 422 errors:")
        
        for i, result in enumerate(error_422_results, 1):
            print(f"\n{i}. SCENARIO: {result['scenario']}")
            print(f"   Request Data: {json.dumps(result['request_data'], indent=4)}")
            print(f"   Error Details: {json.dumps(result.get('error_details', 'No details'), indent=4)}")
            print("   " + "-" * 50)
        
        # Categorize error types
        error_types = {}
        for result in error_422_results:
            error_details = result.get('error_details', {})
            if isinstance(error_details, dict) and 'detail' in error_details:
                for detail in error_details['detail']:
                    error_type = detail.get('type', 'unknown')
                    if error_type not in error_types:
                        error_types[error_type] = []
                    error_types[error_type].append(result['scenario'])
        
        if error_types:
            print(f"\n📊 ERROR TYPE BREAKDOWN:")
            for error_type, scenarios in error_types.items():
                print(f"   {error_type}: {len(scenarios)} scenarios")
                for scenario in scenarios:
                    print(f"     - {scenario}")

    def run_comprehensive_422_test(self):
        """Run comprehensive 422 error testing"""
        print("\n🚀 STARTING COMPREHENSIVE 422 ERROR TESTING")
        
        # Test 1: Basic frontend simulation
        print("\n" + "=" * 50)
        print("TEST 1: BASIC FRONTEND SIMULATION")
        print("=" * 50)
        
        has_422, result = self.simulate_frontend_checkout_request()
        
        # Test 2: Various scenarios
        print("\n" + "=" * 50)
        print("TEST 2: VARIOUS FRONTEND SCENARIOS")
        print("=" * 50)
        
        results = self.test_various_frontend_scenarios()
        
        # Test 3: Analysis
        self.analyze_422_errors(results)
        
        # Summary
        total_422_errors = len([r for r in results if r.get('is_422', False)])
        if has_422:
            total_422_errors += 1
            
        print("\n" + "=" * 60)
        print("🎯 FRONTEND 422 ERROR SIMULATION SUMMARY")
        print("=" * 60)
        print(f"Total scenarios tested: {len(results) + 1}")
        print(f"422 errors found: {total_422_errors}")
        
        if total_422_errors > 0:
            print(f"✅ Successfully reproduced 422 errors")
            print("   These errors are likely the cause of frontend issues")
        else:
            print("❌ Could not reproduce 422 errors")
            print("   The 422 errors might be:")
            print("   - Fixed in current backend version")
            print("   - Caused by specific frontend library formatting")
            print("   - Intermittent/race condition related")
            print("   - Browser-specific request differences")
        
        return total_422_errors > 0

if __name__ == "__main__":
    tester = Frontend422ErrorSimulation()
    found_422_errors = tester.run_comprehensive_422_test()
    
    if found_422_errors:
        print(f"\n🚨 422 errors successfully reproduced and analyzed")
        exit(1)
    else:
        print(f"\n✅ No 422 errors found in simulation")
        exit(0)