import requests
import sys
import json
from datetime import datetime
import uuid

class EmpathyTrainingAPITester:
    def __init__(self, base_url="https://connect-emote.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_id = None

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

    def test_create_user(self):
        """Test user creation endpoint"""
        test_data = {
            "name": "Adam",
            "email": f"adam.test.{datetime.now().strftime('%H%M%S')}@example.com",
            "partner_name": "Linda"
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
            return True
        return False

    def test_get_user(self):
        """Test get user by ID"""
        if not self.test_user_id:
            print("❌ Skipping get user test - no user ID available")
            return False
            
        success, response = self.run_test(
            "Get User",
            "GET",
            f"users/{self.test_user_id}",
            200
        )
        return success

    def test_get_training_stages(self):
        """Test training stages retrieval"""
        success, response = self.run_test(
            "Get Training Stages",
            "GET",
            "stages",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} training stages")
            if len(response) >= 5:
                print("   ✅ All 5 stages present")
                return True
            else:
                print(f"   ❌ Expected 5 stages, found {len(response)}")
        return False

    def test_get_single_stage(self):
        """Test getting a single training stage"""
        success, response = self.run_test(
            "Get Single Stage (Stage 1)",
            "GET",
            "stages/1",
            200
        )
        
        if success and 'scenarios' in response:
            scenarios_count = len(response['scenarios'])
            print(f"   Stage 1 has {scenarios_count} scenarios")
            return True
        return False

    def test_ai_feedback(self):
        """Test AI feedback generation"""
        test_data = {
            "scenario_text": "Linda erzählt emotional von ihrem Arbeitstag: Linda kommt gestresst nach Hause und möchte über ihren schwierigen Tag sprechen.",
            "user_response": "Ich höre dir zu, Linda. Das klingt wirklich stressig. Erzähl mir mehr darüber, was heute passiert ist.",
            "stage_number": 1
        }
        
        success, response = self.run_test(
            "AI Feedback Generation",
            "POST",
            "ai-feedback",
            200,
            data=test_data
        )
        
        if success and 'feedback' in response:
            feedback_length = len(response['feedback'])
            print(f"   AI feedback length: {feedback_length} characters")
            return True
        return False

    def test_save_progress(self):
        """Test saving user progress"""
        if not self.test_user_id:
            print("❌ Skipping progress test - no user ID available")
            return False
            
        test_data = {
            "user_id": self.test_user_id,
            "stage_number": 1,
            "scenario_id": "s1_1",
            "user_response": "Test response for scenario practice",
            "ai_feedback": "Test AI feedback",
            "score": 8
        }
        
        success, response = self.run_test(
            "Save User Progress",
            "POST",
            "progress",
            200,
            data=test_data
        )
        return success

    def test_get_progress(self):
        """Test getting user progress"""
        if not self.test_user_id:
            print("❌ Skipping get progress test - no user ID available")
            return False
            
        success, response = self.run_test(
            "Get User Progress",
            "GET",
            f"progress/{self.test_user_id}",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} progress entries")
            return True
        return False

    def test_generate_scenario(self):
        """Test custom scenario generation"""
        test_data = {
            "stage_number": 2,
            "context": "Linda ist müde nach einem langen Arbeitstag"
        }
        
        success, response = self.run_test(
            "Generate Custom Scenario",
            "POST",
            "generate-scenario",
            200,
            data=test_data
        )
        
        if success and 'scenario' in response:
            scenario_length = len(response['scenario'])
            print(f"   Generated scenario length: {scenario_length} characters")
            return True
        return False

def main():
    print("🚀 Starting Empathy Training App Backend API Tests")
    print("=" * 60)
    
    tester = EmpathyTrainingAPITester()
    
    # Run all tests
    tests = [
        tester.test_create_user,
        tester.test_get_user,
        tester.test_get_training_stages,
        tester.test_get_single_stage,
        tester.test_ai_feedback,
        tester.test_save_progress,
        tester.test_get_progress,
        tester.test_generate_scenario
    ]
    
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All backend API tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())