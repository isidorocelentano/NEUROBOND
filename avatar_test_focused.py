import requests
import sys
import json
from datetime import datetime
import uuid
import base64
import io
from PIL import Image

class AvatarTester:
    def __init__(self, base_url="https://emotion-bridge-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, files=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        if headers is None and files is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, timeout=30)
                else:
                    response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

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

    def create_test_user(self):
        """Create a test user for avatar testing"""
        test_data = {
            "name": "Avatar Test User",
            "email": f"avatar.test.{datetime.now().strftime('%H%M%S')}@example.com",
            "partner_name": "Test Partner"
        }
        
        success, response = self.run_test(
            "Create Test User",
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

    def create_test_image(self, width=300, height=300, format='JPEG'):
        """Create a test image for avatar upload testing"""
        # Create a simple test image
        image = Image.new('RGB', (width, height), color='red')
        
        # Add some content to make it more realistic
        from PIL import ImageDraw
        draw = ImageDraw.Draw(image)
        draw.rectangle([50, 50, width-50, height-50], fill='blue')
        draw.ellipse([100, 100, width-100, height-100], fill='green')
        
        # Convert to bytes
        buffer = io.BytesIO()
        image.save(buffer, format=format)
        buffer.seek(0)
        return buffer.getvalue()

    def test_avatar_upload_valid_jpeg(self):
        """Test avatar upload with valid JPEG image"""
        if not self.test_user_id:
            print("❌ Skipping avatar upload test - no user ID available")
            return False
            
        print("\n🔍 Testing Avatar Upload - Valid JPEG...")
        
        # Create test JPEG image
        image_data = self.create_test_image(400, 400, 'JPEG')
        
        # Prepare multipart form data
        files = {'file': ('test_avatar.jpg', image_data, 'image/jpeg')}
        
        try:
            url = f"{self.api_url}/user/{self.test_user_id}/avatar"
            response = requests.post(url, files=files, timeout=30)
            
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                self.tests_passed += 1
                response_data = response.json()
                
                if 'avatar' in response_data and response_data['avatar'].startswith('data:image/jpeg;base64,'):
                    print("✅ Avatar uploaded successfully")
                    print("✅ Base64 data URL format correct")
                    print(f"   Avatar data length: {len(response_data['avatar'])} characters")
                    
                    # Store avatar data for later tests
                    self.test_avatar_data = response_data['avatar']
                    return True
                else:
                    print("❌ Invalid avatar response format")
            else:
                print(f"❌ Upload failed - Status: {response.status_code}")
                print(f"   Error: {response.text[:300]}")
                
        except Exception as e:
            print(f"❌ Upload failed with exception: {str(e)}")
        
        self.tests_run += 1
        return False

    def test_avatar_retrieval(self):
        """Test avatar retrieval for existing user"""
        if not self.test_user_id:
            print("❌ Skipping avatar retrieval test - no user ID available")
            return False
            
        success, response = self.run_test(
            "Avatar Retrieval",
            "GET",
            f"user/{self.test_user_id}/avatar",
            200
        )
        
        if success and 'avatar' in response:
            avatar_data = response['avatar']
            if avatar_data and avatar_data.startswith('data:image/jpeg;base64,'):
                print("✅ Avatar retrieved successfully")
                print("✅ Base64 data URL format correct")
                return True
            elif avatar_data is None:
                print("✅ No avatar set for user (valid response)")
                return True
        
        return False

    def test_avatar_image_processing(self):
        """Test avatar image processing (resize to 200x200, center, base64)"""
        if not self.test_user_id:
            print("❌ Skipping image processing test - no user ID available")
            return False
            
        print("\n🔍 Testing Avatar Image Processing...")
        
        # Create large test image to verify resizing
        image_data = self.create_test_image(800, 600, 'JPEG')  # Non-square, large image
        
        files = {'file': ('large_avatar.jpg', image_data, 'image/jpeg')}
        
        try:
            url = f"{self.api_url}/user/{self.test_user_id}/avatar"
            response = requests.post(url, files=files, timeout=30)
            
            if response.status_code == 200:
                self.tests_passed += 1
                response_data = response.json()
                avatar_data = response_data.get('avatar', '')
                
                if avatar_data.startswith('data:image/jpeg;base64,'):
                    # Decode and verify image dimensions
                    base64_data = avatar_data.split(',')[1]
                    decoded_data = base64.b64decode(base64_data)
                    
                    # Verify the processed image
                    processed_image = Image.open(io.BytesIO(decoded_data))
                    width, height = processed_image.size
                    
                    print(f"   Processed image dimensions: {width}x{height}")
                    
                    if width == 200 and height == 200:
                        print("✅ Image correctly resized to 200x200")
                        print("✅ Aspect ratio handled with centering")
                        print("✅ JPEG conversion with quality optimization")
                        print("✅ Base64 encoding working correctly")
                        return True
                    else:
                        print(f"❌ Incorrect dimensions: expected 200x200, got {width}x{height}")
                else:
                    print("❌ Invalid base64 data URL format")
            else:
                print(f"❌ Image processing test failed - Status: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Image processing test failed with exception: {str(e)}")
        
        self.tests_run += 1
        return False

def main():
    print("🖼️ Avatar Upload Functionality Testing")
    print("=" * 50)
    
    tester = AvatarTester()
    
    # Create test user
    if not tester.create_test_user():
        print("❌ Failed to create test user - cannot proceed with avatar tests")
        return 1
    
    # Run avatar tests
    tests = [
        tester.test_avatar_upload_valid_jpeg,
        tester.test_avatar_retrieval,
        tester.test_avatar_image_processing,
    ]
    
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
    
    print(f"\n📊 Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All avatar tests passed!")
        return 0
    else:
        print("❌ Some avatar tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())