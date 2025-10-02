#!/usr/bin/env python3
"""
NEUROBOND Training Scenario API Test
Focus: Testing the "Lade Dialog..." issue with /api/training/start-scenario
"""

import requests
import json
from datetime import datetime

class TrainingScenarioTester:
    def __init__(self, base_url="https://empathy-coach-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0

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
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Error: {response.text[:500]}")
                return False, {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_emergent_llm_key_configuration(self):
        """CRITICAL: Test if EMERGENT_LLM_KEY is properly configured"""
        print("\n🔍 CRITICAL: Testing EMERGENT_LLM_KEY Configuration...")
        
        test_data = {
            "scenario_id": 1,
            "user_id": "llm_test_user",
            "user_name": "TestUser",
            "partner_name": "TestPartner"
        }
        
        success, response = self.run_test(
            "EMERGENT_LLM_KEY Configuration Test",
            "POST",
            "training/start-scenario",
            200,
            data=test_data
        )
        
        if success:
            partner_message = response.get('partner_message', '')
            
            # Check for AI-generated content quality indicators
            quality_indicators = [
                len(partner_message) > 50,  # Reasonable length
                any(word in partner_message.lower() for word in ['ich', 'du', 'mir', 'mich']),  # German pronouns
                not partner_message.startswith('Error'),  # No error messages
                not 'API' in partner_message  # No API error references
            ]
            
            passed_indicators = sum(quality_indicators)
            print(f"   Quality indicators passed: {passed_indicators}/4")
            
            if passed_indicators >= 3:
                print("   ✅ EMERGENT_LLM_KEY is working correctly")
                print("   ✅ AI is generating quality responses")
                return True
            else:
                print("   ❌ EMERGENT_LLM_KEY may not be working properly")
                print(f"   ❌ Generated message: '{partner_message}'")
                return False
        else:
            print("   ❌ EMERGENT_LLM_KEY configuration test failed")
            return False

    def test_training_start_scenario_basic(self):
        """CRITICAL: Test /api/training/start-scenario with basic scenario (scenario_id=1)"""
        print("\n🎯 CRITICAL TEST: Training Start Scenario - Basic Level...")
        
        test_data = {
            "scenario_id": 1,
            "user_id": "test_user_123",
            "user_name": "TestUser",
            "partner_name": "TestPartner"
        }
        
        success, response = self.run_test(
            "Training Start Scenario - Basic (ID=1)",
            "POST",
            "training/start-scenario",
            200,
            data=test_data
        )
        
        if success:
            # Check required response fields
            required_fields = ['session_id', 'scenario', 'partner_message', 'partner_name']
            missing_fields = [field for field in required_fields if field not in response]
            
            if not missing_fields:
                print("   ✅ All required response fields present")
                
                # Check partner_message content
                partner_message = response.get('partner_message', '')
                if partner_message and len(partner_message.strip()) > 0:
                    print(f"   ✅ Partner message generated: '{partner_message[:100]}...'")
                    print(f"   ✅ Partner message length: {len(partner_message)} characters")
                    
                    # Check if it's not just the fallback message
                    fallback_message = "Weißt du... ich kann nicht mehr so weitermachen. Die Arbeit ist einfach zu viel geworden. Ich fühle mich total erschöpft und weiß nicht, wie ich das alles schaffen soll."
                    if partner_message != fallback_message:
                        print("   ✅ AI-generated partner message (not fallback)")
                    else:
                        print("   ⚠️  Using fallback partner message (AI may have failed)")
                    
                    # Check scenario details
                    scenario = response.get('scenario', {})
                    if scenario.get('title') == "Aktives Zuhören":
                        print("   ✅ Correct scenario loaded (Aktives Zuhören)")
                    
                    # Check session_id format
                    session_id = response.get('session_id', '')
                    if session_id.startswith('training_'):
                        print("   ✅ Session ID has correct format")
                        self.test_session_id = session_id  # Store for follow-up tests
                    
                    return True
                else:
                    print("   ❌ CRITICAL: Empty or missing partner_message")
                    print("   🚨 This is the root cause of 'Lade Dialog...' issue!")
                    return False
            else:
                print(f"   ❌ Missing required response fields: {missing_fields}")
                return False
        else:
            print("   ❌ CRITICAL: Training start scenario endpoint failed")
            return False

    def test_training_scenario_response_format(self):
        """CRITICAL: Test exact response format expected by frontend"""
        print("\n🔍 CRITICAL: Testing Training Scenario Response Format...")
        
        test_data = {
            "scenario_id": 1,
            "user_id": "format_test_user",
            "user_name": "FormatTest",
            "partner_name": "FormatPartner"
        }
        
        success, response = self.run_test(
            "Training Scenario Response Format Test",
            "POST",
            "training/start-scenario",
            200,
            data=test_data
        )
        
        if success:
            print("   📋 Checking response format...")
            
            # Expected format based on frontend requirements
            expected_format = {
                "session_id": str,
                "scenario": dict,
                "partner_message": str,
                "partner_name": str
            }
            
            format_correct = True
            for field, expected_type in expected_format.items():
                if field not in response:
                    print(f"   ❌ Missing field: {field}")
                    format_correct = False
                elif not isinstance(response[field], expected_type):
                    print(f"   ❌ Wrong type for {field}: expected {expected_type.__name__}, got {type(response[field]).__name__}")
                    format_correct = False
                else:
                    print(f"   ✅ {field}: {expected_type.__name__} ✓")
            
            # Check scenario sub-fields
            if 'scenario' in response:
                scenario = response['scenario']
                scenario_fields = ['id', 'title', 'context', 'learning_goals']
                for field in scenario_fields:
                    if field in scenario:
                        print(f"   ✅ scenario.{field}: ✓")
                    else:
                        print(f"   ❌ Missing scenario.{field}")
                        format_correct = False
            
            # Most critical check: partner_message content
            partner_message = response.get('partner_message', '')
            if partner_message and partner_message.strip():
                print(f"   ✅ partner_message has content: {len(partner_message)} chars")
                print(f"   ✅ partner_message preview: '{partner_message[:50]}...'")
            else:
                print("   ❌ CRITICAL: partner_message is empty or null")
                print("   🚨 This causes 'Lade Dialog...' to never disappear!")
                format_correct = False
            
            if format_correct:
                print("   ✅ Response format is correct for frontend")
                return True
            else:
                print("   ❌ Response format has issues")
                return False
        else:
            print("   ❌ Failed to get response for format testing")
            return False

    def test_multiple_scenarios(self):
        """Test multiple scenario IDs to verify AI integration"""
        print("\n🤖 Testing Multiple Training Scenarios...")
        
        test_scenarios = [1, 6, 12]  # Basic, intermediate, expert levels
        successful_scenarios = 0
        
        for scenario_id in test_scenarios:
            test_data = {
                "scenario_id": scenario_id,
                "user_id": f"multi_test_{scenario_id}",
                "user_name": "MultiTestUser",
                "partner_name": "MultiTestPartner"
            }
            
            success, response = self.run_test(
                f"Multiple Scenarios - ID {scenario_id}",
                "POST",
                "training/start-scenario",
                200,
                data=test_data
            )
            
            if success and 'partner_message' in response:
                partner_message = response['partner_message']
                if partner_message and len(partner_message.strip()) > 20:
                    print(f"   ✅ Scenario {scenario_id}: AI generated {len(partner_message)} chars")
                    successful_scenarios += 1
                else:
                    print(f"   ❌ Scenario {scenario_id}: Empty or too short AI response")
            else:
                print(f"   ❌ Scenario {scenario_id}: Failed to get AI response")
        
        success_rate = (successful_scenarios / len(test_scenarios)) * 100
        print(f"\n   📊 Multiple Scenarios Success Rate: {success_rate:.1f}% ({successful_scenarios}/{len(test_scenarios)})")
        
        return success_rate >= 80

    def run_training_scenario_tests(self):
        """Run focused training scenario tests"""
        print("🎯 NEUROBOND Training Scenario API Testing")
        print("=" * 60)
        print("🚨 FOCUS: Investigating 'Lade Dialog...' issue")
        print("🔍 Testing: /api/training/start-scenario endpoint")
        print("=" * 60)

        # Run critical tests
        tests = [
            self.test_emergent_llm_key_configuration,
            self.test_training_start_scenario_basic,
            self.test_training_scenario_response_format,
            self.test_multiple_scenarios
        ]

        for test in tests:
            test()

        # Final summary
        print("\n" + "=" * 60)
        print("🏁 TRAINING SCENARIO TESTING COMPLETE")
        print("=" * 60)
        print(f"📊 Total Tests: {self.tests_run}")
        print(f"✅ Passed: {self.tests_passed}")
        print(f"❌ Failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 ALL TRAINING SCENARIO TESTS PASSED!")
            print("✅ Training scenario API is working correctly")
        else:
            print("⚠️  TRAINING SCENARIO ISSUES DETECTED!")
            print("❌ Some training scenario functionality is broken")

if __name__ == "__main__":
    tester = TrainingScenarioTester()
    tester.run_training_scenario_tests()