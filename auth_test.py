#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import uuid

class AuthenticationTester:
    def __init__(self, base_url="https://couplesai.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_auth_user = None
        self.test_auth_email = None
        self.test_auth_password = None
        self.test_reset_token = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        if headers is None:
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

    def test_auth_register_valid(self):
        """Test user registration with valid data"""
        test_data = {
            "name": "Isi Cel",
            "email": "isicel@bluewin.ch",
            "password": "TestPass123",
            "partner_name": "Test Partner"
        }
        
        success, response = self.run_test(
            "Authentication - Register Valid User",
            "POST",
            "auth/register",
            200,
            data=test_data
        )
        
        if success:
            if 'user' in response and 'message' in response:
                user_data = response['user']
                print(f"   ✅ User registered successfully")
                print(f"   ✅ User ID: {user_data.get('id')}")
                print(f"   ✅ Name: {user_data.get('name')}")
                print(f"   ✅ Email: {user_data.get('email')}")
                print(f"   ✅ Partner: {user_data.get('partner_name')}")
                print(f"   ✅ Subscription: {user_data.get('subscription_status', 'free')}")
                
                # Store user data for subsequent tests
                self.test_auth_user = user_data
                self.test_auth_email = test_data['email']
                self.test_auth_password = test_data['password']
                
                # Verify PRO subscription features are present
                if 'subscription_status' in user_data:
                    print(f"   ✅ PRO subscription field present: {user_data['subscription_status']}")
                
                return True
            else:
                print(f"   ❌ Missing required fields in response")
        return False

    def test_auth_register_duplicate_email(self):
        """Test registration with duplicate email"""
        test_data = {
            "name": "Duplicate User",
            "email": "isicel@bluewin.ch",  # Same email as previous test
            "password": "AnotherPass123",
            "partner_name": "Another Partner"
        }
        
        success, response = self.run_test(
            "Authentication - Register Duplicate Email",
            "POST",
            "auth/register",
            400,  # Should return 400 for duplicate email
            data=test_data
        )
        
        if success:
            print("   ✅ Duplicate email properly rejected")
            return True
        return False

    def test_auth_login_valid(self):
        """Test login with valid credentials"""
        if not self.test_auth_email:
            print("❌ Skipping login test - no registered user available")
            return False
            
        test_data = {
            "email": self.test_auth_email,
            "password": self.test_auth_password
        }
        
        success, response = self.run_test(
            "Authentication - Login Valid Credentials",
            "POST",
            "auth/login",
            200,
            data=test_data
        )
        
        if success:
            if 'user' in response and 'message' in response:
                user_data = response['user']
                print(f"   ✅ Login successful")
                print(f"   ✅ User ID: {user_data.get('id')}")
                print(f"   ✅ Name: {user_data.get('name')}")
                print(f"   ✅ Email: {user_data.get('email')}")
                print(f"   ✅ Partner: {user_data.get('partner_name')}")
                
                # Verify password_hash is not returned
                if 'password_hash' not in user_data:
                    print("   ✅ Password hash properly excluded from response")
                else:
                    print("   ❌ Password hash exposed in response")
                
                # Verify all expected fields are present
                expected_fields = ['id', 'name', 'email', 'subscription_status', 'created_at']
                missing_fields = [field for field in expected_fields if field not in user_data]
                
                if not missing_fields:
                    print("   ✅ All expected user fields present")
                    return True
                else:
                    print(f"   ❌ Missing user fields: {missing_fields}")
            else:
                print(f"   ❌ Missing required fields in response")
        return False

    def test_auth_login_invalid_email(self):
        """Test login with invalid email"""
        test_data = {
            "email": "nonexistent@example.com",
            "password": "SomePassword123"
        }
        
        success, response = self.run_test(
            "Authentication - Login Invalid Email",
            "POST",
            "auth/login",
            401,  # Should return 401 for invalid credentials
            data=test_data
        )
        
        if success:
            print("   ✅ Invalid email properly rejected")
            return True
        return False

    def test_auth_login_invalid_password(self):
        """Test login with invalid password"""
        if not self.test_auth_email:
            print("❌ Skipping invalid password test - no registered user available")
            return False
            
        test_data = {
            "email": self.test_auth_email,
            "password": "WrongPassword123"
        }
        
        success, response = self.run_test(
            "Authentication - Login Invalid Password",
            "POST",
            "auth/login",
            401,  # Should return 401 for invalid credentials
            data=test_data
        )
        
        if success:
            print("   ✅ Invalid password properly rejected")
            return True
        return False

    def test_auth_password_reset_request(self):
        """Test password reset request"""
        if not self.test_auth_email:
            print("❌ Skipping password reset test - no registered user available")
            return False
            
        test_data = {
            "email": self.test_auth_email
        }
        
        success, response = self.run_test(
            "Authentication - Password Reset Request",
            "POST",
            "auth/password-reset",
            200,
            data=test_data
        )
        
        if success:
            if 'message' in response and 'reset_token' in response:
                print("   ✅ Password reset request successful")
                print(f"   ✅ Reset token generated: {response['reset_token'][:20]}...")
                
                # Store reset token for confirmation test
                self.test_reset_token = response['reset_token']
                return True
            else:
                print(f"   ❌ Missing required fields in response")
        return False

    def test_auth_password_reset_nonexistent_email(self):
        """Test password reset request for nonexistent email"""
        test_data = {
            "email": "nonexistent@example.com"
        }
        
        success, response = self.run_test(
            "Authentication - Password Reset Nonexistent Email",
            "POST",
            "auth/password-reset",
            200,  # Should return 200 to not reveal if email exists
            data=test_data
        )
        
        if success:
            if 'message' in response:
                print("   ✅ Password reset request handled securely")
                print("   ✅ Does not reveal if email exists")
                return True
        return False

    def test_auth_password_reset_confirm(self):
        """Test password reset confirmation with token"""
        if not self.test_reset_token:
            print("❌ Skipping password reset confirm test - no reset token available")
            return False
            
        new_password = "NewTestPass456"
        test_data = {
            "token": self.test_reset_token,
            "new_password": new_password
        }
        
        success, response = self.run_test(
            "Authentication - Password Reset Confirm",
            "POST",
            "auth/password-reset/confirm",
            200,
            data=test_data
        )
        
        if success:
            if 'message' in response:
                print("   ✅ Password reset confirmation successful")
                
                # Update stored password for subsequent tests
                self.test_auth_password = new_password
                return True
            else:
                print(f"   ❌ Missing message in response")
        return False

    def test_auth_password_reset_invalid_token(self):
        """Test password reset confirmation with invalid token"""
        test_data = {
            "token": "invalid_token_12345",
            "new_password": "SomeNewPassword789"
        }
        
        success, response = self.run_test(
            "Authentication - Password Reset Invalid Token",
            "POST",
            "auth/password-reset/confirm",
            400,  # Should return 400 for invalid token
            data=test_data
        )
        
        if success:
            print("   ✅ Invalid reset token properly rejected")
            return True
        return False

    def test_auth_login_with_new_password(self):
        """Test login with new password after reset"""
        if not self.test_auth_email or not self.test_auth_password:
            print("❌ Skipping new password login test - no credentials available")
            return False
            
        test_data = {
            "email": self.test_auth_email,
            "password": self.test_auth_password
        }
        
        success, response = self.run_test(
            "Authentication - Login With New Password",
            "POST",
            "auth/login",
            200,
            data=test_data
        )
        
        if success:
            if 'user' in response and 'message' in response:
                user_data = response['user']
                print(f"   ✅ Login with new password successful")
                print(f"   ✅ User authenticated: {user_data.get('name')}")
                
                # Verify user has all expected PRO subscription features
                subscription_status = user_data.get('subscription_status', 'free')
                print(f"   ✅ Subscription status: {subscription_status}")
                
                # Check for PRO features fields
                pro_fields = ['subscription_type', 'subscription_expires_at']
                present_pro_fields = [field for field in pro_fields if field in user_data]
                
                if present_pro_fields:
                    print(f"   ✅ PRO subscription fields present: {present_pro_fields}")
                else:
                    print("   ℹ️  PRO subscription fields not set (user is free tier)")
                
                return True
            else:
                print(f"   ❌ Missing required fields in response")
        return False

    def test_auth_user_fields_verification(self):
        """Verify user has all expected fields including PRO subscription features"""
        if not self.test_auth_user:
            print("❌ Skipping user fields verification - no user data available")
            return False
            
        user_data = self.test_auth_user
        
        print("\n🔍 Verifying User Fields and PRO Subscription Features...")
        
        # Required fields
        required_fields = {
            'id': 'User ID',
            'name': 'User Name', 
            'email': 'Email Address',
            'subscription_status': 'Subscription Status',
            'created_at': 'Creation Date'
        }
        
        # Optional PRO fields
        pro_fields = {
            'partner_name': 'Partner Name',
            'avatar': 'Avatar Image',
            'subscription_type': 'Subscription Type',
            'subscription_expires_at': 'Subscription Expiry',
            'password_reset_token': 'Password Reset Token',
            'password_reset_expires': 'Password Reset Expiry'
        }
        
        all_passed = True
        
        # Check required fields
        for field, description in required_fields.items():
            if field in user_data:
                print(f"   ✅ {description}: {user_data[field]}")
            else:
                print(f"   ❌ Missing {description}")
                all_passed = False
        
        # Check PRO fields (optional)
        for field, description in pro_fields.items():
            if field in user_data:
                value = user_data[field]
                if value is not None:
                    print(f"   ✅ {description}: {value}")
                else:
                    print(f"   ℹ️  {description}: null (default)")
            else:
                print(f"   ℹ️  {description}: not present (optional)")
        
        # Verify password_hash is NOT present
        if 'password_hash' not in user_data:
            print("   ✅ Password hash properly excluded from user data")
        else:
            print("   ❌ Password hash exposed in user data")
            all_passed = False
        
        # Verify subscription status
        subscription_status = user_data.get('subscription_status', 'unknown')
        if subscription_status in ['free', 'active', 'cancelled', 'expired']:
            print(f"   ✅ Valid subscription status: {subscription_status}")
        else:
            print(f"   ❌ Invalid subscription status: {subscription_status}")
            all_passed = False
        
        if all_passed:
            print("   ✅ All user fields verification passed")
            return True
        else:
            print("   ❌ Some user fields verification failed")
            return False

    def run_all_tests(self):
        """Run all authentication system tests"""
        print("🔐 Starting Authentication System Testing...")
        print(f"   Base URL: {self.base_url}")
        print(f"   API URL: {self.api_url}")
        print("=" * 60)
        
        # Test registration
        self.test_auth_register_valid()
        self.test_auth_register_duplicate_email()
        
        # Test login
        self.test_auth_login_valid()
        self.test_auth_login_invalid_email()
        self.test_auth_login_invalid_password()
        
        # Test password reset flow
        self.test_auth_password_reset_request()
        self.test_auth_password_reset_nonexistent_email()
        self.test_auth_password_reset_confirm()
        self.test_auth_password_reset_invalid_token()
        
        # Test login with new password
        self.test_auth_login_with_new_password()
        
        # Verify user fields and PRO features
        self.test_auth_user_fields_verification()
        
        # Print final results
        print("\n" + "=" * 60)
        print(f"🏁 Authentication Testing Complete!")
        print(f"   Tests Run: {self.tests_run}")
        print(f"   Tests Passed: {self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("   🎉 All authentication tests passed!")
        else:
            failed = self.tests_run - self.tests_passed
            print(f"   ⚠️  {failed} authentication test(s) failed")
        
        return self.tests_passed == self.tests_run

if __name__ == "__main__":
    tester = AuthenticationTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)