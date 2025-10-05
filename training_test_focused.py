#!/usr/bin/env python3
"""
Focused Training Scenario Testing
Specifically testing the training functionality that the user reported issues with
"""

import requests
import json
from datetime import datetime

class TrainingScenarioTester:
    def __init__(self, base_url="https://neurobond-cursor.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.session_id = None

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
                    if isinstance(response_data, dict) and len(str(response_data)) < 1000:
                        print(f"   Response: {response_data}")
                    elif isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
                    else:
                        print(f"   Response: Large object with keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'Non-dict'}")
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

    def test_training_start_scenario_1(self):
        """Test starting training scenario 1 specifically (user's issue)"""
        test_data = {
            "scenario_id": 1,
            "user_id": "test_user_scenario_1",
            "user_name": "TestUser",
            "partner_name": "TestPartner"
        }
        
        success, response = self.run_test(
            "Training Start Scenario 1 (User's Issue)",
            "POST",
            "training/start-scenario",
            200,
            data=test_data
        )
        
        if success:
            # Check critical fields that frontend needs
            required_fields = ['session_id', 'scenario', 'partner_message', 'partner_name']
            missing_fields = [field for field in required_fields if field not in response]
            
            if not missing_fields:
                print("   ✅ All required response fields present")
                
                # Check partner_message - this is critical for the "Lade Dialog..." issue
                partner_message = response.get('partner_message', '')
                if partner_message and len(partner_message.strip()) > 0:
                    print(f"   ✅ Partner message generated: '{partner_message[:100]}...'")
                    print(f"   ✅ Partner message length: {len(partner_message)} characters")
                    
                    # Store session_id for follow-up tests
                    self.session_id = response.get('session_id')
                    print(f"   ✅ Session ID stored: {self.session_id}")
                    
                    return True
                else:
                    print("   ❌ CRITICAL: Empty or missing partner_message")
                    print("   🚨 This would cause 'Lade Dialog...' to never disappear!")
                    return False
            else:
                print(f"   ❌ Missing required response fields: {missing_fields}")
                return False
        else:
            print("   ❌ CRITICAL: Training start scenario endpoint failed")
            return False

    def test_training_respond(self):
        """Test the training respond endpoint"""
        if not self.session_id:
            print("   ❌ No session ID available, cannot test respond endpoint")
            return False
            
        test_data = {
            "session_id": self.session_id,
            "user_response": "Das klingt wirklich stressig. Ich kann verstehen, dass du dich überfordert fühlst. Möchtest du mir mehr darüber erzählen?"
        }
        
        success, response = self.run_test(
            "Training Respond Endpoint",
            "POST",
            "training/respond",
            200,
            data=test_data
        )
        
        if success:
            if 'partner_response' in response and 'session_continues' in response:
                partner_response = response.get('partner_response', '')
                if partner_response and len(partner_response.strip()) > 0:
                    print(f"   ✅ Partner response generated: {len(partner_response)} chars")
                    print(f"   ✅ Session continues: {response.get('session_continues')}")
                    return True
                else:
                    print("   ❌ Empty partner response")
                    return False
            else:
                print("   ❌ Missing required response fields")
                return False
        return False

    def test_training_evaluate(self):
        """Test the training evaluate endpoint"""
        test_data = {
            "user_response": "Ich verstehe, dass du dich gestresst fühlst. Das muss wirklich schwierig für dich sein.",
            "scenario_id": 1,
            "user_id": "test_user_eval"
        }
        
        success, response = self.run_test(
            "Training Evaluate Endpoint",
            "POST",
            "training/evaluate",
            200,
            data=test_data
        )
        
        if success:
            required_fields = ['empathy_score', 'feedback', 'improvements', 'alternative_responses']
            missing_fields = [field for field in required_fields if field not in response]
            
            if not missing_fields:
                print(f"   ✅ Empathy score: {response.get('empathy_score', 'N/A')}")
                print(f"   ✅ Feedback length: {len(response.get('feedback', ''))} chars")
                return True
            else:
                print(f"   ❌ Missing evaluation fields: {missing_fields}")
                return False
        return False

    def test_training_end_scenario(self):
        """Test the training end scenario endpoint"""
        if not self.session_id:
            print("   ❌ No session ID available, cannot test end scenario endpoint")
            return False
            
        test_data = {
            "session_id": self.session_id
        }
        
        success, response = self.run_test(
            "Training End Scenario Endpoint",
            "POST",
            "training/end-scenario",
            200,
            data=test_data
        )
        
        if success:
            if 'session_completed' in response and 'summary' in response:
                if response.get('session_completed') == True:
                    print("   ✅ Training session completed successfully")
                    print(f"   ✅ Summary: {response.get('summary', 'N/A')[:100]}...")
                    return True
                else:
                    print("   ❌ Session not marked as completed")
                    return False
            else:
                print("   ❌ Missing required response fields")
                return False
        return False

    def test_analyze_dialog_endpoint(self):
        """Test the analyze-dialog endpoint for training scenario analysis"""
        test_data = {
            "dialog_messages": [
                {
                    "speaker": "TestUser",
                    "message": "Wie war dein Tag?",
                    "timestamp": "2024-01-15T10:00:00Z"
                },
                {
                    "speaker": "TestPartner", 
                    "message": "Stressig! Mein Chef war wieder unmöglich.",
                    "timestamp": "2024-01-15T10:01:00Z"
                },
                {
                    "speaker": "TestUser",
                    "message": "Das klingt frustrierend. Erzähl mir mehr darüber.",
                    "timestamp": "2024-01-15T10:02:00Z"
                }
            ],
            "partner1_name": "TestUser",
            "partner2_name": "TestPartner"
        }
        
        success, response = self.run_test(
            "Analyze Dialog Endpoint",
            "POST",
            "analyze-dialog",
            200,
            data=test_data
        )
        
        if success:
            if 'analysis' in response:
                analysis_length = len(response['analysis'])
                print(f"   ✅ Analysis generated: {analysis_length} characters")
                print(f"   ✅ Analysis preview: {response['analysis'][:100]}...")
                return True
            else:
                print("   ❌ Missing analysis field in response")
                return False
        return False

    def test_backend_logs_check(self):
        """Check backend logs for any errors"""
        print("\n🔍 Checking Backend Logs for Errors...")
        try:
            import subprocess
            result = subprocess.run(['tail', '-n', '50', '/var/log/supervisor/backend.err.log'], 
                                  capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                logs = result.stdout
                if logs.strip():
                    print("   📋 Recent backend error logs:")
                    print(f"   {logs}")
                    
                    # Check for specific errors
                    if 'training' in logs.lower():
                        print("   ⚠️  Training-related errors found in logs")
                    if 'error' in logs.lower():
                        print("   ⚠️  General errors found in logs")
                    else:
                        print("   ✅ No critical errors in recent logs")
                else:
                    print("   ✅ No recent error logs")
            else:
                print("   ⚠️  Could not access backend error logs")
                
        except Exception as e:
            print(f"   ⚠️  Error checking logs: {str(e)}")

    def run_all_tests(self):
        """Run all training scenario tests"""
        print("🎯 FOCUSED TRAINING SCENARIO TESTING")
        print("=" * 60)
        print("Testing the specific training functionality that user reported issues with")
        print("Focus: Training Session 1 and 'onNext' JavaScript error")
        print("=" * 60)
        
        # Test the main training endpoints
        tests = [
            self.test_training_start_scenario_1,
            self.test_training_respond,
            self.test_training_evaluate,
            self.test_training_end_scenario,
            self.test_analyze_dialog_endpoint,
            self.test_backend_logs_check
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                print(f"   ❌ Test failed with exception: {str(e)}")
        
        print(f"\n📊 FINAL RESULTS:")
        print(f"   Tests Run: {self.tests_run}")
        print(f"   Tests Passed: {self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "No tests run")
        
        if self.tests_passed == self.tests_run:
            print("   ✅ ALL TRAINING TESTS PASSED")
        else:
            print("   ❌ SOME TRAINING TESTS FAILED")
            print("   🚨 Training functionality may have issues")

if __name__ == "__main__":
    tester = TrainingScenarioTester()
    tester.run_all_tests()