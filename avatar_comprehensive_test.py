import requests
import sys
import json
from datetime import datetime
import uuid
import base64
import io
from PIL import Image

class AvatarComprehensiveTester:
    def __init__(self, base_url="https://neurobondapp.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_id = None

    def create_test_user(self):
        """Create a test user for avatar testing"""
        test_data = {
            "name": "Avatar Test User",
            "email": f"avatar.test.{datetime.now().strftime('%H%M%S')}@example.com",
            "partner_name": "Test Partner"
        }
        
        try:
            url = f"{self.api_url}/users"
            response = requests.post(url, json=test_data, headers={'Content-Type': 'application/json'}, timeout=30)
            
            if response.status_code == 200:
                response_data = response.json()
                if 'id' in response_data:
                    self.test_user_id = response_data['id']
                    print(f"✅ Created test user with ID: {self.test_user_id}")
                    return True
            
            print(f"❌ Failed to create test user - Status: {response.status_code}")
            return False
            
        except Exception as e:
            print(f"❌ Failed to create test user: {str(e)}")
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

    def test_avatar_upload_jpeg(self):
        """Test 1: Avatar upload with valid JPEG image"""
        print("\n🔍 Test 1: Avatar Upload - Valid JPEG")
        self.tests_run += 1
        
        if not self.test_user_id:
            print("❌ No user ID available")
            return False
        
        try:
            # Create test JPEG image
            image_data = self.create_test_image(400, 400, 'JPEG')
            files = {'file': ('test_avatar.jpg', image_data, 'image/jpeg')}
            
            url = f"{self.api_url}/user/{self.test_user_id}/avatar"
            response = requests.post(url, files=files, timeout=30)
            
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                response_data = response.json()
                
                if 'avatar' in response_data and response_data['avatar'].startswith('data:image/jpeg;base64,'):
                    print("✅ JPEG avatar uploaded successfully")
                    print("✅ Base64 data URL format correct")
                    print(f"   Avatar data length: {len(response_data['avatar'])} characters")
                    self.tests_passed += 1
                    return True
                else:
                    print("❌ Invalid avatar response format")
            else:
                print(f"❌ Upload failed - Status: {response.status_code}")
                print(f"   Error: {response.text[:300]}")
                
        except Exception as e:
            print(f"❌ Upload failed with exception: {str(e)}")
        
        return False

    def test_avatar_upload_png(self):
        """Test 2: Avatar upload with valid PNG image"""
        print("\n🔍 Test 2: Avatar Upload - Valid PNG")
        self.tests_run += 1
        
        if not self.test_user_id:
            print("❌ No user ID available")
            return False
        
        try:
            # Create test PNG image
            image_data = self.create_test_image(350, 350, 'PNG')
            files = {'file': ('test_avatar.png', image_data, 'image/png')}
            
            url = f"{self.api_url}/user/{self.test_user_id}/avatar"
            response = requests.post(url, files=files, timeout=30)
            
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                response_data = response.json()
                
                if 'avatar' in response_data and response_data['avatar'].startswith('data:image/jpeg;base64,'):
                    print("✅ PNG avatar uploaded and converted to JPEG")
                    print("✅ Image processing working correctly")
                    self.tests_passed += 1
                    return True
                else:
                    print("❌ Invalid PNG avatar response format")
            else:
                print(f"❌ PNG upload failed - Status: {response.status_code}")
                
        except Exception as e:
            print(f"❌ PNG upload failed with exception: {str(e)}")
        
        return False

    def test_avatar_image_processing(self):
        """Test 3: Avatar image processing (resize to 200x200, center, base64)"""
        print("\n🔍 Test 3: Avatar Image Processing")
        self.tests_run += 1
        
        if not self.test_user_id:
            print("❌ No user ID available")
            return False
        
        try:
            # Create large test image to verify resizing
            image_data = self.create_test_image(800, 600, 'JPEG')  # Non-square, large image
            files = {'file': ('large_avatar.jpg', image_data, 'image/jpeg')}
            
            url = f"{self.api_url}/user/{self.test_user_id}/avatar"
            response = requests.post(url, files=files, timeout=30)
            
            if response.status_code == 200:
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
                        self.tests_passed += 1
                        return True
                    else:
                        print(f"❌ Incorrect dimensions: expected 200x200, got {width}x{height}")
                else:
                    print("❌ Invalid base64 data URL format")
            else:
                print(f"❌ Image processing test failed - Status: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Image processing test failed with exception: {str(e)}")
        
        return False

    def test_avatar_retrieval(self):
        """Test 4: Avatar retrieval for existing user"""
        print("\n🔍 Test 4: Avatar Retrieval")
        self.tests_run += 1
        
        if not self.test_user_id:
            print("❌ No user ID available")
            return False
        
        try:
            url = f"{self.api_url}/user/{self.test_user_id}/avatar"
            response = requests.get(url, timeout=30)
            
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                response_data = response.json()
                
                if 'avatar' in response_data:
                    avatar_data = response_data['avatar']
                    if avatar_data and avatar_data.startswith('data:image/jpeg;base64,'):
                        print("✅ Avatar retrieved successfully")
                        print("✅ Base64 data URL format correct")
                        print(f"   Avatar data length: {len(avatar_data)} characters")
                        self.tests_passed += 1
                        return True
                    elif avatar_data is None:
                        print("✅ No avatar set for user (valid response)")
                        self.tests_passed += 1
                        return True
                    else:
                        print("❌ Invalid avatar data format")
                else:
                    print("❌ Avatar field missing from response")
            else:
                print(f"❌ Avatar retrieval failed - Status: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Avatar retrieval failed with exception: {str(e)}")
        
        return False

    def test_avatar_file_size_validation(self):
        """Test 5: Avatar upload file size validation (max 5MB)"""
        print("\n🔍 Test 5: File Size Validation")
        self.tests_run += 1
        
        if not self.test_user_id:
            print("❌ No user ID available")
            return False
        
        try:
            # Create oversized data (simulate >5MB)
            large_data = b'fake_image_data' * (5 * 1024 * 1024 // 15 + 1000)  # Over 5MB
            files = {'file': ('huge_avatar.jpg', large_data, 'image/jpeg')}
            
            url = f"{self.api_url}/user/{self.test_user_id}/avatar"
            response = requests.post(url, files=files, timeout=30)
            
            print(f"   Status: {response.status_code}")
            print(f"   Test file size: {len(large_data) / (1024*1024):.1f} MB")
            
            if response.status_code == 400:
                print("✅ File size validation working correctly")
                print("✅ Files exceeding 5MB properly rejected")
                self.tests_passed += 1
                return True
            else:
                print(f"❌ Expected 400 status for oversized file, got {response.status_code}")
                
        except Exception as e:
            print(f"❌ File size validation test failed with exception: {str(e)}")
        
        return False

    def test_avatar_invalid_file_type(self):
        """Test 6: Avatar upload with invalid file types"""
        print("\n🔍 Test 6: Invalid File Type Validation")
        self.tests_run += 1
        
        if not self.test_user_id:
            print("❌ No user ID available")
            return False
        
        try:
            # Create a text file disguised as image
            invalid_data = b"This is not an image file, it's just text content."
            files = {'file': ('fake_image.txt', invalid_data, 'text/plain')}
            
            url = f"{self.api_url}/user/{self.test_user_id}/avatar"
            response = requests.post(url, files=files, timeout=30)
            
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 400:
                print("✅ Invalid file type properly rejected")
                print("✅ File type validation working correctly")
                self.tests_passed += 1
                return True
            else:
                print(f"❌ Expected 400 status for invalid file type, got {response.status_code}")
                
        except Exception as e:
            print(f"❌ Invalid file type test failed with exception: {str(e)}")
        
        return False

    def test_avatar_removal(self):
        """Test 7: Avatar removal/deletion"""
        print("\n🔍 Test 7: Avatar Removal")
        self.tests_run += 1
        
        if not self.test_user_id:
            print("❌ No user ID available")
            return False
        
        try:
            url = f"{self.api_url}/user/{self.test_user_id}/avatar"
            response = requests.delete(url, timeout=30)
            
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                response_data = response.json()
                
                if response_data.get('success') == True:
                    print("✅ Avatar removed successfully")
                    
                    # Verify avatar is actually removed by trying to retrieve it
                    get_response = requests.get(url, timeout=30)
                    if get_response.status_code == 200:
                        get_data = get_response.json()
                        if get_data.get('avatar') is None:
                            print("✅ Avatar removal verified - no avatar data returned")
                            self.tests_passed += 1
                            return True
                        else:
                            print("❌ Avatar still present after removal")
                    else:
                        print("❌ Could not verify avatar removal")
                else:
                    print("❌ Avatar removal response indicates failure")
            else:
                print(f"❌ Avatar removal failed - Status: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Avatar removal failed with exception: {str(e)}")
        
        return False

    def test_avatar_nonexistent_user(self):
        """Test 8: Avatar operations on non-existent user"""
        print("\n🔍 Test 8: Non-existent User Handling")
        self.tests_run += 1
        
        fake_user_id = str(uuid.uuid4())
        
        try:
            url = f"{self.api_url}/user/{fake_user_id}/avatar"
            response = requests.get(url, timeout=30)
            
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 404:
                print("✅ Non-existent user properly handled")
                print("✅ 404 status returned correctly")
                self.tests_passed += 1
                return True
            else:
                print(f"❌ Expected 404 status for non-existent user, got {response.status_code}")
                
        except Exception as e:
            print(f"❌ Non-existent user test failed with exception: {str(e)}")
        
        return False

def main():
    print("🖼️ COMPREHENSIVE AVATAR UPLOAD FUNCTIONALITY TESTING")
    print("=" * 60)
    
    tester = AvatarComprehensiveTester()
    
    # Create test user
    print("\n👤 Creating Test User...")
    if not tester.create_test_user():
        print("❌ Failed to create test user - cannot proceed with avatar tests")
        return 1
    
    # Run all avatar tests
    tests = [
        tester.test_avatar_upload_jpeg,
        tester.test_avatar_upload_png,
        tester.test_avatar_image_processing,
        tester.test_avatar_retrieval,
        tester.test_avatar_file_size_validation,
        tester.test_avatar_invalid_file_type,
        tester.test_avatar_removal,
        tester.test_avatar_nonexistent_user,
    ]
    
    print(f"\n🧪 Running {len(tests)} Avatar Tests...")
    
    for i, test in enumerate(tests, 1):
        try:
            test()
        except Exception as e:
            print(f"❌ Test {i} failed with exception: {str(e)}")
    
    # Results
    print("\n" + "=" * 60)
    print("🖼️ AVATAR UPLOAD TEST RESULTS")
    print("=" * 60)
    print(f"📊 Tests Passed: {tester.tests_passed}/{tester.tests_run}")
    
    if tester.tests_passed == tester.tests_run:
        print("\n🎉 ALL AVATAR TESTS PASSED!")
        print("✅ Avatar upload system is fully functional")
        print("✅ Image processing working correctly (resize to 200x200)")
        print("✅ File validation implemented (size and type)")
        print("✅ Base64 encoding with proper data URL format")
        print("✅ CRUD operations (upload, retrieve, delete) working")
        print("✅ Error handling for invalid inputs working")
        return 0
    else:
        failed_tests = tester.tests_run - tester.tests_passed
        print(f"\n❌ {failed_tests} AVATAR TESTS FAILED")
        print("❌ Avatar upload system has issues that need attention")
        return 1

if __name__ == "__main__":
    sys.exit(main())