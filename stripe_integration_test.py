#!/usr/bin/env python3
"""
URGENT Stripe Integration Test - Post Trust & Authority Elements Implementation
Testing specific Stripe functionality as requested in review.
"""

import requests
import json
import sys
from datetime import datetime

class StripeIntegrationTester:
    def __init__(self):
        self.base_url = "https://payment-debug-6.preview.emergentagent.com"
        self.api_url = f"{self.base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_result(self, test_name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name}")
            if details:
                print(f"   {details}")
        else:
            self.failed_tests.append(test_name)
            print(f"❌ {test_name}")
            if details:
                print(f"   {details}")

    def test_stripe_monthly_checkout(self):
        """Test POST /api/checkout/session with monthly package"""
        print("\n🔍 Testing Stripe Monthly Checkout Session...")
        
        test_data = {
            "package_type": "monthly",
            "origin_url": "https://neurobond.ch"
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/checkout/session",
                json=test_data,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if 'url' in data and 'session_id' in data:
                    self.log_result(
                        "Monthly Checkout Session Creation", 
                        True, 
                        f"URL: {data['url'][:50]}..., Session: {data['session_id'][:20]}..."
                    )
                    return True, data
                else:
                    self.log_result(
                        "Monthly Checkout Session Creation", 
                        False, 
                        f"Missing required fields in response: {data}"
                    )
                    return False, {}
            else:
                self.log_result(
                    "Monthly Checkout Session Creation", 
                    False, 
                    f"HTTP {response.status_code}: {response.text[:200]}"
                )
                return False, {}
                
        except Exception as e:
            self.log_result(
                "Monthly Checkout Session Creation", 
                False, 
                f"Exception: {str(e)}"
            )
            return False, {}

    def test_stripe_yearly_checkout(self):
        """Test POST /api/checkout/session with yearly package"""
        print("\n🔍 Testing Stripe Yearly Checkout Session...")
        
        test_data = {
            "package_type": "yearly",
            "origin_url": "https://neurobond.ch"
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/checkout/session",
                json=test_data,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if 'url' in data and 'session_id' in data:
                    self.log_result(
                        "Yearly Checkout Session Creation", 
                        True, 
                        f"URL: {data['url'][:50]}..., Session: {data['session_id'][:20]}..."
                    )
                    return True, data
                else:
                    self.log_result(
                        "Yearly Checkout Session Creation", 
                        False, 
                        f"Missing required fields in response: {data}"
                    )
                    return False, {}
            else:
                self.log_result(
                    "Yearly Checkout Session Creation", 
                    False, 
                    f"HTTP {response.status_code}: {response.text[:200]}"
                )
                return False, {}
                
        except Exception as e:
            self.log_result(
                "Yearly Checkout Session Creation", 
                False, 
                f"Exception: {str(e)}"
            )
            return False, {}

    def test_backend_health_check(self):
        """Test backend service health"""
        print("\n🔍 Testing Backend Service Health...")
        
        try:
            # Test basic API endpoint
            response = requests.get(
                f"{self.api_url}/stages",
                timeout=15
            )
            
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    self.log_result(
                        "Backend Service Health Check", 
                        True, 
                        f"Backend responding correctly, {len(data)} stages available"
                    )
                    return True
                else:
                    self.log_result(
                        "Backend Service Health Check", 
                        False, 
                        f"Unexpected response format: {data}"
                    )
                    return False
            else:
                self.log_result(
                    "Backend Service Health Check", 
                    False, 
                    f"HTTP {response.status_code}: {response.text[:200]}"
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Backend Service Health Check", 
                False, 
                f"Exception: {str(e)}"
            )
            return False

    def test_mongodb_connection(self):
        """Test MongoDB connection by creating a user"""
        print("\n🔍 Testing MongoDB Connection...")
        
        test_data = {
            "name": f"Test User {datetime.now().strftime('%H%M%S')}",
            "email": f"test.{datetime.now().strftime('%H%M%S')}@example.com",
            "partner_name": "Test Partner"
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/users",
                json=test_data,
                headers={'Content-Type': 'application/json'},
                timeout=15
            )
            
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if 'id' in data:
                    self.log_result(
                        "MongoDB Connection Test", 
                        True, 
                        f"User created successfully with ID: {data['id']}"
                    )
                    return True, data['id']
                else:
                    self.log_result(
                        "MongoDB Connection Test", 
                        False, 
                        f"Missing user ID in response: {data}"
                    )
                    return False, None
            else:
                self.log_result(
                    "MongoDB Connection Test", 
                    False, 
                    f"HTTP {response.status_code}: {response.text[:200]}"
                )
                return False, None
                
        except Exception as e:
            self.log_result(
                "MongoDB Connection Test", 
                False, 
                f"Exception: {str(e)}"
            )
            return False, None

    def test_stripe_url_accessibility(self, stripe_url):
        """Test if generated Stripe URL is accessible"""
        print("\n🔍 Testing Stripe URL Accessibility...")
        
        try:
            response = requests.head(
                stripe_url,
                timeout=15,
                allow_redirects=True
            )
            
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code in [200, 302, 303]:
                self.log_result(
                    "Stripe URL Accessibility", 
                    True, 
                    f"Stripe checkout URL is accessible (Status: {response.status_code})"
                )
                return True
            else:
                self.log_result(
                    "Stripe URL Accessibility", 
                    False, 
                    f"Stripe URL not accessible (Status: {response.status_code})"
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Stripe URL Accessibility", 
                False, 
                f"Exception: {str(e)}"
            )
            return False

    def test_environment_variables(self):
        """Test if environment variables are working by checking API responses"""
        print("\n🔍 Testing Environment Variables...")
        
        # Test if Stripe keys are working by attempting to create a session
        test_data = {
            "package_type": "monthly",
            "origin_url": "https://neurobond.ch"
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/checkout/session",
                json=test_data,
                headers={'Content-Type': 'application/json'},
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'url' in data and 'checkout.stripe.com' in data['url']:
                    self.log_result(
                        "Environment Variables Check", 
                        True, 
                        "Stripe keys are properly configured and working"
                    )
                    return True
                else:
                    self.log_result(
                        "Environment Variables Check", 
                        False, 
                        f"Unexpected Stripe URL format: {data.get('url', 'No URL')}"
                    )
                    return False
            else:
                self.log_result(
                    "Environment Variables Check", 
                    False, 
                    f"Failed to create checkout session: HTTP {response.status_code}"
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Environment Variables Check", 
                False, 
                f"Exception: {str(e)}"
            )
            return False

    def run_comprehensive_test(self):
        """Run all critical Stripe integration tests"""
        print("🚨 URGENT: Stripe Integration Test - Post Trust & Authority Elements")
        print("=" * 70)
        print(f"Testing backend at: {self.base_url}")
        print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()

        # 1. Backend Health Check
        backend_healthy = self.test_backend_health_check()
        
        # 2. MongoDB Connection Test
        mongodb_working, user_id = self.test_mongodb_connection()
        
        # 3. Environment Variables Test
        env_vars_working = self.test_environment_variables()
        
        # 4. Monthly Stripe Checkout Test
        monthly_success, monthly_data = self.test_stripe_monthly_checkout()
        
        # 5. Yearly Stripe Checkout Test
        yearly_success, yearly_data = self.test_stripe_yearly_checkout()
        
        # 6. Test Stripe URL accessibility if we got URLs
        stripe_url_accessible = False
        if monthly_success and 'url' in monthly_data:
            stripe_url_accessible = self.test_stripe_url_accessibility(monthly_data['url'])
        
        # Summary
        print("\n" + "=" * 70)
        print("🎯 STRIPE INTEGRATION TEST SUMMARY")
        print("=" * 70)
        
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {len(self.failed_tests)}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"   - {test}")
        
        print(f"\n🔍 CRITICAL FINDINGS:")
        
        if backend_healthy and mongodb_working and monthly_success and yearly_success:
            print("✅ STRIPE INTEGRATION IS WORKING CORRECTLY")
            print("✅ Backend APIs return 200 OK with valid Stripe URLs")
            print("✅ MongoDB connection is functional")
            print("✅ Payment system is operational")
            
            if stripe_url_accessible:
                print("✅ Generated Stripe URLs are accessible")
            
            print("\n🎉 CONCLUSION: No regression detected in Stripe integration")
            print("🎉 Trust & Authority elements implementation did NOT break Stripe")
            
        else:
            print("🚨 CRITICAL ISSUES DETECTED:")
            
            if not backend_healthy:
                print("❌ Backend service is not responding correctly")
            
            if not mongodb_working:
                print("❌ MongoDB connection issues detected")
            
            if not monthly_success:
                print("❌ Monthly Stripe checkout session creation FAILED")
            
            if not yearly_success:
                print("❌ Yearly Stripe checkout session creation FAILED")
            
            if not env_vars_working:
                print("❌ Environment variables may be misconfigured")
            
            print("\n🚨 URGENT ACTION REQUIRED: Stripe integration is broken")
        
        return self.tests_passed == self.tests_run

if __name__ == "__main__":
    tester = StripeIntegrationTester()
    success = tester.run_comprehensive_test()
    sys.exit(0 if success else 1)