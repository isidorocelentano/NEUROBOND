#!/usr/bin/env python3

import sys
import requests
from datetime import datetime

class SEOBackendTester:
    def __init__(self, base_url="https://neurobond-cursor.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)

            print(f"   Status: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(str(response_data)) < 500:
                        print(f"   Response: {response_data}")
                    elif isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
                except:
                    print(f"   Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Error: {response.text[:300]}")

            return success, response.json() if response.status_code < 400 else {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def run_comprehensive_seo_regression_tests(self):
        """Run comprehensive backend API testing after SEO updates"""
        print("🚀 COMPREHENSIVE BACKEND API TESTING AFTER SEO UPDATES")
        print(f"🌐 Base URL: {self.base_url}")
        print(f"🔗 API URL: {self.api_url}")
        print("🎯 Focus: Verify all backend functionality remains intact after frontend SEO changes")
        print("=" * 80)

        # 1. CORE API ENDPOINTS VERIFICATION
        print("\n📋 1. CORE API ENDPOINTS VERIFICATION")
        print("-" * 50)
        
        # Test user creation
        test_data = {
            "name": "SEO Test User",
            "email": f"seo.test.{datetime.now().strftime('%H%M%S')}@example.com",
            "partner_name": "SEO Partner"
        }
        
        success, response = self.run_test(
            "Create User",
            "POST",
            "users",
            200,
            data=test_data
        )
        
        if success and 'id' in response:
            self.test_user_id = response['id']
            print(f"   Created user with ID: {self.test_user_id}")

        # Test training system APIs
        training_data = {
            "scenario_id": 1,
            "user_id": "test-user-123",
            "user_name": "Adam",
            "partner_name": "Linda"
        }
        
        self.run_test(
            "Training Start Scenario",
            "POST",
            "training/start-scenario",
            200,
            data=training_data
        )
        
        # Test emotion lexicon API
        self.run_test(
            "Gefühlslexikon API",
            "GET",
            "gefuehlslexikon",
            200
        )
        
        # Test community cases endpoints
        self.run_test(
            "Community Cases",
            "GET",
            "community-cases",
            200
        )

        # 2. STRIPE PAYMENT INTEGRATION
        print("\n💳 2. STRIPE PAYMENT INTEGRATION")
        print("-" * 50)
        
        # Test checkout session creation
        checkout_data = {
            "package_type": "monthly",
            "origin_url": "https://neurobond-cursor.preview.emergentagent.com"
        }
        
        self.run_test(
            "Stripe Checkout - Monthly",
            "POST",
            "checkout/session",
            200,
            data=checkout_data
        )

        # 3. FREEMIUM MODEL LOGIC
        print("\n🔓 3. FREEMIUM MODEL LOGIC")
        print("-" * 50)
        
        # Test stage access
        self.run_test(
            "Stage 1 Access (Free)",
            "GET",
            "stages/1",
            200
        )
        
        self.run_test(
            "Stage 2 Access (Premium)",
            "GET",
            "stages/2",
            200
        )

        # 4. CONTACT & COMMUNICATION
        print("\n📧 4. CONTACT & COMMUNICATION")
        print("-" * 50)
        
        # Test contact form
        contact_data = {
            "name": "SEO Test Contact",
            "email": "seo.contact@example.com",
            "subject": "SEO Testing",
            "message": "Testing contact form after SEO updates"
        }
        
        self.run_test(
            "Contact Form",
            "POST",
            "contact",
            200,
            data=contact_data
        )

        # 5. DATABASE CONNECTIVITY
        print("\n🗄️ 5. DATABASE CONNECTIVITY")
        print("-" * 50)
        
        # Test database operations
        self.run_test(
            "Get Training Stages",
            "GET",
            "stages",
            200
        )

        # 6. REGRESSION TESTING - SEO IMPACT
        print("\n🔍 6. REGRESSION TESTING - SEO IMPACT")
        print("-" * 50)
        
        # Test multiple endpoints to verify no regressions
        endpoints = [
            ("GET", "stages", 200),
            ("GET", "community-cases", 200),
            ("GET", "gefuehlslexikon", 200),
        ]
        
        for method, endpoint, expected_status in endpoints:
            self.run_test(
                f"Regression Test - {method} /{endpoint}",
                method,
                endpoint,
                expected_status
            )

        # Print final results
        print("\n" + "=" * 80)
        print("🏁 COMPREHENSIVE BACKEND API TESTING COMPLETE")
        print(f"📊 Tests Run: {self.tests_run}")
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed! Backend API is fully functional after SEO updates.")
        else:
            print("⚠️  Some tests failed. Backend may have regressions from SEO updates.")
        
        return self.tests_passed == self.tests_run

if __name__ == "__main__":
    tester = SEOBackendTester()
    success = tester.run_comprehensive_seo_regression_tests()
    sys.exit(0 if success else 1)