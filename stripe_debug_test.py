import requests
import sys
import json
from datetime import datetime
import uuid

class StripeWhiteScreenDebugger:
    def __init__(self, base_url="https://payment-debug-6.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.debug_findings = []

    def log_finding(self, category, message, severity="INFO"):
        """Log debugging findings"""
        finding = {
            "category": category,
            "message": message,
            "severity": severity,
            "timestamp": datetime.now().isoformat()
        }
        self.debug_findings.append(finding)
        print(f"🔍 [{severity}] {category}: {message}")

    def run_debug_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a debug test with detailed response analysis"""
        url = f"{self.api_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 DEBUG TEST: {name}")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)

            print(f"   Status: {response.status_code}")
            
            # Detailed response analysis
            try:
                response_data = response.json()
                print(f"   Response Type: {type(response_data)}")
                
                if isinstance(response_data, dict):
                    print(f"   Response Keys: {list(response_data.keys())}")
                    for key, value in response_data.items():
                        if isinstance(value, str) and len(value) < 200:
                            print(f"   {key}: {value}")
                        elif isinstance(value, (int, float, bool)):
                            print(f"   {key}: {value}")
                        else:
                            print(f"   {key}: {type(value)} (length: {len(str(value))})")
                
            except Exception as e:
                print(f"   Response parsing error: {str(e)}")
                print(f"   Raw response: {response.text[:500]}...")

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Test Passed")
            else:
                print(f"❌ Test Failed - Expected {expected_status}, got {response.status_code}")

            return success, response.json() if response.status_code < 400 else {}, response

        except Exception as e:
            print(f"❌ Test Failed - Error: {str(e)}")
            return False, {}, None

    def debug_stripe_session_creation_detailed(self):
        """Create Stripe session and examine EVERY detail of the response"""
        print("\n" + "="*80)
        print("🎯 DETAILED STRIPE SESSION CREATION DEBUG")
        print("="*80)
        
        test_data = {
            "package_type": "monthly",
            "origin_url": "https://payment-debug-6.preview.emergentagent.com"
        }
        
        success, response, raw_response = self.run_debug_test(
            "Detailed Stripe Session Creation",
            "POST",
            "checkout/session",
            200,
            data=test_data
        )
        
        if success and response:
            print("\n🔍 STRIPE SESSION RESPONSE ANALYSIS:")
            print("-" * 50)
            
            # Check all response fields
            required_fields = ['url', 'session_id', 'success']
            for field in required_fields:
                if field in response:
                    print(f"✅ {field}: {response[field]}")
                    if field == 'url':
                        self.analyze_stripe_url(response[field])
                else:
                    print(f"❌ Missing field: {field}")
                    self.log_finding("MISSING_FIELD", f"Required field '{field}' missing from response", "ERROR")
            
            # Check for additional fields
            extra_fields = [key for key in response.keys() if key not in required_fields]
            if extra_fields:
                print(f"📋 Additional fields: {extra_fields}")
                for field in extra_fields:
                    print(f"   {field}: {response[field]}")
            
            return response
        else:
            self.log_finding("SESSION_CREATION", "Failed to create Stripe checkout session", "CRITICAL")
            return None

    def analyze_stripe_url(self, stripe_url):
        """Analyze the Stripe URL for potential issues"""
        print(f"\n🔍 STRIPE URL ANALYSIS:")
        print(f"   Full URL: {stripe_url}")
        
        # Check URL structure
        if not stripe_url.startswith('https://checkout.stripe.com'):
            self.log_finding("URL_FORMAT", f"Unexpected Stripe URL format: {stripe_url}", "ERROR")
        else:
            print("✅ URL format correct (checkout.stripe.com)")
        
        # Extract session ID from URL
        if '/c/pay/' in stripe_url:
            session_part = stripe_url.split('/c/pay/')[-1]
            print(f"✅ Session identifier: {session_part[:20]}...")
        else:
            self.log_finding("URL_STRUCTURE", "URL doesn't contain expected /c/pay/ structure", "WARNING")
        
        # Test URL accessibility
        try:
            print("\n🔍 Testing Stripe URL accessibility...")
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            url_response = requests.get(stripe_url, headers=headers, timeout=15, allow_redirects=False)
            
            print(f"   Status Code: {url_response.status_code}")
            print(f"   Headers: {dict(url_response.headers)}")
            
            if url_response.status_code == 200:
                print("✅ Stripe URL is accessible")
                
                # Check response content
                content = url_response.text
                if 'stripe' in content.lower():
                    print("✅ Response contains Stripe content")
                else:
                    self.log_finding("URL_CONTENT", "Stripe URL doesn't contain expected Stripe content", "WARNING")
                    
                # Check for white screen indicators
                if len(content.strip()) < 100:
                    self.log_finding("WHITE_SCREEN", "Stripe page content is suspiciously short - possible white screen", "CRITICAL")
                elif 'error' in content.lower():
                    self.log_finding("STRIPE_ERROR", "Stripe page contains error content", "ERROR")
                else:
                    print("✅ Stripe page content appears normal")
                    
            elif url_response.status_code in [302, 303]:
                print("✅ Stripe URL redirects (normal behavior)")
                redirect_location = url_response.headers.get('Location', 'Not specified')
                print(f"   Redirect to: {redirect_location}")
            else:
                self.log_finding("URL_ACCESS", f"Stripe URL returned unexpected status: {url_response.status_code}", "ERROR")
                
        except Exception as e:
            self.log_finding("URL_TEST", f"Failed to test Stripe URL: {str(e)}", "ERROR")

    def debug_stripe_session_parameters(self):
        """Debug all Stripe session parameters in detail"""
        print("\n" + "="*80)
        print("🎯 STRIPE SESSION PARAMETERS DEBUG")
        print("="*80)
        
        # Test with explicit parameters to see what's being sent to Stripe
        test_data = {
            "package_type": "monthly",
            "origin_url": "https://payment-debug-6.preview.emergentagent.com"
        }
        
        success, response, raw_response = self.run_debug_test(
            "Create Session for Parameter Analysis",
            "POST",
            "checkout/session",
            200,
            data=test_data
        )
        
        if success and 'session_id' in response:
            session_id = response['session_id']
            
            # Get detailed session status
            status_success, status_response, status_raw = self.run_debug_test(
                "Get Detailed Session Status",
                "GET",
                f"checkout/status/{session_id}",
                200
            )
            
            if status_success:
                print("\n🔍 STRIPE SESSION CONFIGURATION ANALYSIS:")
                print("-" * 50)
                
                # Analyze all session parameters
                session_params = [
                    'status', 'payment_status', 'amount_total', 'currency', 
                    'metadata', 'mode', 'payment_method_types'
                ]
                
                for param in session_params:
                    if param in status_response:
                        value = status_response[param]
                        print(f"✅ {param}: {value}")
                        
                        # Specific parameter validation
                        if param == 'amount_total':
                            expected_amount = 1081  # CHF 10.81 in cents
                            if value != expected_amount:
                                self.log_finding("AMOUNT_MISMATCH", 
                                               f"Amount mismatch: expected {expected_amount}, got {value}", 
                                               "WARNING")
                        
                        elif param == 'currency':
                            if value.lower() != 'chf':
                                self.log_finding("CURRENCY_ERROR", 
                                               f"Wrong currency: expected CHF, got {value}", 
                                               "ERROR")
                        
                        elif param == 'metadata':
                            if not isinstance(value, dict) or not value:
                                self.log_finding("METADATA_MISSING", 
                                               "Metadata is missing or empty", 
                                               "WARNING")
                            else:
                                print(f"   Metadata details: {value}")
                    else:
                        print(f"❌ Missing parameter: {param}")
                        self.log_finding("MISSING_PARAM", f"Session missing parameter: {param}", "WARNING")
                
                return status_response
        
        return None

    def debug_stripe_configuration_issues(self):
        """Debug potential Stripe configuration issues"""
        print("\n" + "="*80)
        print("🎯 STRIPE CONFIGURATION DEBUG")
        print("="*80)
        
        # Test different package types
        package_types = ["monthly", "yearly"]
        
        for package_type in package_types:
            print(f"\n🔍 Testing {package_type} package configuration...")
            
            test_data = {
                "package_type": package_type,
                "origin_url": "https://payment-debug-6.preview.emergentagent.com"
            }
            
            success, response, raw_response = self.run_debug_test(
                f"Configuration Test - {package_type}",
                "POST",
                "checkout/session",
                200,
                data=test_data
            )
            
            if success:
                print(f"✅ {package_type} package configuration working")
                
                # Check if URL is properly formed
                if 'url' in response:
                    url = response['url']
                    if 'checkout.stripe.com' in url:
                        print(f"✅ {package_type} generates valid Stripe URL")
                    else:
                        self.log_finding("CONFIG_ERROR", 
                                       f"{package_type} generates invalid URL: {url}", 
                                       "ERROR")
            else:
                self.log_finding("CONFIG_FAILURE", 
                               f"{package_type} package configuration failed", 
                               "CRITICAL")

    def debug_webhook_configuration(self):
        """Debug webhook configuration issues"""
        print("\n" + "="*80)
        print("🎯 WEBHOOK CONFIGURATION DEBUG")
        print("="*80)
        
        webhook_url = f"{self.api_url}/webhook/stripe"
        print(f"🔍 Testing webhook endpoint: {webhook_url}")
        
        # Test webhook endpoint accessibility
        try:
            # Test with empty POST (should fail with signature error)
            response = requests.post(webhook_url, 
                                   json={}, 
                                   headers={'Content-Type': 'application/json'},
                                   timeout=10)
            
            print(f"   Webhook status: {response.status_code}")
            print(f"   Webhook response: {response.text[:200]}...")
            
            if response.status_code == 400:
                print("✅ Webhook endpoint exists and properly validates signatures")
            elif response.status_code == 500:
                print("⚠️  Webhook endpoint exists but has server error")
                self.log_finding("WEBHOOK_ERROR", "Webhook endpoint returns 500 error", "WARNING")
            elif response.status_code == 404:
                self.log_finding("WEBHOOK_MISSING", "Webhook endpoint not found", "CRITICAL")
            else:
                print(f"⚠️  Webhook returned unexpected status: {response.status_code}")
                
        except Exception as e:
            self.log_finding("WEBHOOK_TEST", f"Failed to test webhook: {str(e)}", "ERROR")

    def debug_cors_and_security_issues(self):
        """Debug CORS and security issues that might cause white screen"""
        print("\n" + "="*80)
        print("🎯 CORS AND SECURITY DEBUG")
        print("="*80)
        
        # Test CORS headers
        test_data = {
            "package_type": "monthly",
            "origin_url": "https://payment-debug-6.preview.emergentagent.com"
        }
        
        # Add Origin header to simulate browser request
        headers = {
            'Content-Type': 'application/json',
            'Origin': 'https://payment-debug-6.preview.emergentagent.com',
            'Referer': 'https://payment-debug-6.preview.emergentagent.com'
        }
        
        success, response, raw_response = self.run_debug_test(
            "CORS Headers Test",
            "POST",
            "checkout/session",
            200,
            data=test_data,
            headers=headers
        )
        
        if raw_response:
            print("\n🔍 CORS HEADERS ANALYSIS:")
            cors_headers = [
                'Access-Control-Allow-Origin',
                'Access-Control-Allow-Methods',
                'Access-Control-Allow-Headers',
                'Access-Control-Allow-Credentials'
            ]
            
            for header in cors_headers:
                value = raw_response.headers.get(header, 'Not set')
                print(f"   {header}: {value}")
                
                if header == 'Access-Control-Allow-Origin' and value == 'Not set':
                    self.log_finding("CORS_MISSING", "CORS Allow-Origin header not set", "WARNING")

    def debug_success_cancel_urls(self):
        """Debug success and cancel URL configuration"""
        print("\n" + "="*80)
        print("🎯 SUCCESS/CANCEL URLs DEBUG")
        print("="*80)
        
        origin_url = "https://payment-debug-6.preview.emergentagent.com"
        
        test_data = {
            "package_type": "monthly",
            "origin_url": origin_url
        }
        
        success, response, raw_response = self.run_debug_test(
            "Success/Cancel URLs Test",
            "POST",
            "checkout/session",
            200,
            data=test_data
        )
        
        if success and 'session_id' in response:
            session_id = response['session_id']
            
            # Expected URLs
            expected_success = f"{origin_url}/success?session_id={session_id}"
            expected_cancel = f"{origin_url}/cancel"
            
            print(f"\n🔍 EXPECTED URLs:")
            print(f"   Success: {expected_success}")
            print(f"   Cancel: {expected_cancel}")
            
            # Test if these URLs would be accessible
            for url_type, url in [("Success", expected_success), ("Cancel", expected_cancel)]:
                try:
                    test_response = requests.head(url, timeout=10)
                    print(f"   {url_type} URL status: {test_response.status_code}")
                    
                    if test_response.status_code == 404:
                        self.log_finding("URL_NOT_FOUND", 
                                       f"{url_type} URL returns 404 - may cause Stripe issues", 
                                       "WARNING")
                except Exception as e:
                    print(f"   {url_type} URL test failed: {str(e)}")

    def debug_stripe_mode_and_payment_methods(self):
        """Debug Stripe mode and payment method configuration"""
        print("\n" + "="*80)
        print("🎯 STRIPE MODE AND PAYMENT METHODS DEBUG")
        print("="*80)
        
        # Create session and analyze the actual Stripe configuration
        test_data = {
            "package_type": "monthly",
            "origin_url": "https://payment-debug-6.preview.emergentagent.com"
        }
        
        success, response, raw_response = self.run_debug_test(
            "Mode and Payment Methods Test",
            "POST",
            "checkout/session",
            200,
            data=test_data
        )
        
        if success and 'session_id' in response:
            session_id = response['session_id']
            
            # Get session details
            status_success, status_response, status_raw = self.run_debug_test(
                "Get Session Mode Details",
                "GET",
                f"checkout/status/{session_id}",
                200
            )
            
            if status_success:
                print("\n🔍 STRIPE MODE ANALYSIS:")
                
                # Check for mode (should be 'subscription' for recurring payments)
                mode = status_response.get('mode', 'Not specified')
                print(f"   Mode: {mode}")
                
                if mode != 'subscription':
                    self.log_finding("MODE_ERROR", 
                                   f"Wrong mode: expected 'subscription', got '{mode}'", 
                                   "ERROR")
                
                # Check payment method types
                payment_methods = status_response.get('payment_method_types', [])
                print(f"   Payment Methods: {payment_methods}")
                
                expected_methods = ['card']  # At minimum should support cards
                for method in expected_methods:
                    if method not in payment_methods:
                        self.log_finding("PAYMENT_METHOD", 
                                       f"Missing payment method: {method}", 
                                       "WARNING")

    def test_minimal_stripe_configuration(self):
        """Test with minimal configuration to isolate issues"""
        print("\n" + "="*80)
        print("🎯 MINIMAL STRIPE CONFIGURATION TEST")
        print("="*80)
        
        # Test with the exact data from the review request
        test_data = {
            "package_type": "monthly",
            "origin_url": "https://payment-debug-6.preview.emergentagent.com"
        }
        
        print("🔍 Testing with EXACT review request data:")
        print(f"   Package: {test_data['package_type']}")
        print(f"   Origin: {test_data['origin_url']}")
        
        success, response, raw_response = self.run_debug_test(
            "Minimal Configuration Test",
            "POST",
            "checkout/session",
            200,
            data=test_data
        )
        
        if success:
            print("\n✅ MINIMAL TEST PASSED")
            
            # Get the Stripe URL and test it thoroughly
            if 'url' in response:
                stripe_url = response['url']
                print(f"🔍 Generated Stripe URL: {stripe_url}")
                
                # Test the URL with different user agents
                user_agents = [
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15'
                ]
                
                for i, ua in enumerate(user_agents):
                    try:
                        headers = {'User-Agent': ua}
                        test_response = requests.get(stripe_url, headers=headers, timeout=10)
                        
                        print(f"   User Agent {i+1} Status: {test_response.status_code}")
                        
                        if test_response.status_code == 200:
                            content_length = len(test_response.text)
                            print(f"   Content Length: {content_length}")
                            
                            if content_length < 1000:
                                self.log_finding("WHITE_SCREEN_DETECTED", 
                                               f"Stripe page content too short ({content_length} chars) - possible white screen", 
                                               "CRITICAL")
                            
                            # Check for specific error indicators
                            content = test_response.text.lower()
                            if 'error' in content:
                                self.log_finding("STRIPE_PAGE_ERROR", 
                                               "Stripe page contains error content", 
                                               "ERROR")
                            elif 'loading' in content and content.count('loading') > 2:
                                self.log_finding("LOADING_ISSUE", 
                                               "Stripe page stuck in loading state", 
                                               "ERROR")
                                
                    except Exception as e:
                        print(f"   User Agent {i+1} Failed: {str(e)}")
        else:
            self.log_finding("MINIMAL_TEST_FAILED", 
                           "Even minimal Stripe configuration failed", 
                           "CRITICAL")

    def run_comprehensive_debug(self):
        """Run all debugging tests"""
        print("🚀 STARTING COMPREHENSIVE STRIPE WHITE SCREEN DEBUG")
        print("🎯 Focus: Debugging white screen issue in preview environment")
        print("="*80)
        
        debug_tests = [
            ("Session Creation", self.debug_stripe_session_creation_detailed),
            ("Session Parameters", self.debug_stripe_session_parameters),
            ("Configuration", self.debug_stripe_configuration_issues),
            ("Webhook", self.debug_webhook_configuration),
            ("CORS & Security", self.debug_cors_and_security_issues),
            ("Success/Cancel URLs", self.debug_success_cancel_urls),
            ("Mode & Payment Methods", self.debug_stripe_mode_and_payment_methods),
            ("Minimal Configuration", self.test_minimal_stripe_configuration)
        ]
        
        for test_name, test_func in debug_tests:
            try:
                print(f"\n{'='*20} {test_name} {'='*20}")
                test_func()
            except Exception as e:
                self.log_finding("TEST_ERROR", f"{test_name} failed with exception: {str(e)}", "ERROR")
        
        # Print summary
        self.print_debug_summary()

    def print_debug_summary(self):
        """Print comprehensive debug summary"""
        print("\n" + "="*80)
        print("🎯 STRIPE WHITE SCREEN DEBUG SUMMARY")
        print("="*80)
        
        print(f"📊 Tests Run: {self.tests_run}")
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        
        # Categorize findings
        critical_findings = [f for f in self.debug_findings if f['severity'] == 'CRITICAL']
        error_findings = [f for f in self.debug_findings if f['severity'] == 'ERROR']
        warning_findings = [f for f in self.debug_findings if f['severity'] == 'WARNING']
        
        print(f"\n🚨 CRITICAL Issues: {len(critical_findings)}")
        for finding in critical_findings:
            print(f"   ❌ {finding['category']}: {finding['message']}")
        
        print(f"\n⚠️  ERROR Issues: {len(error_findings)}")
        for finding in error_findings:
            print(f"   ⚠️  {finding['category']}: {finding['message']}")
        
        print(f"\n⚠️  WARNING Issues: {len(warning_findings)}")
        for finding in warning_findings:
            print(f"   ⚠️  {finding['category']}: {finding['message']}")
        
        # Recommendations
        print(f"\n💡 RECOMMENDATIONS:")
        
        if critical_findings:
            print("   🚨 IMMEDIATE ACTION REQUIRED:")
            for finding in critical_findings:
                if finding['category'] == 'WHITE_SCREEN_DETECTED':
                    print("   - Stripe checkout page is returning minimal content (white screen)")
                    print("   - Check Stripe dashboard for session configuration errors")
                    print("   - Verify all required Stripe parameters are being sent")
                elif finding['category'] == 'SESSION_CREATION':
                    print("   - Stripe session creation is failing completely")
                    print("   - Check Stripe API keys and network connectivity")
        
        if error_findings:
            print("   ⚠️  CONFIGURATION ISSUES:")
            for finding in error_findings:
                if finding['category'] == 'MODE_ERROR':
                    print("   - Fix Stripe mode configuration (should be 'subscription')")
                elif finding['category'] == 'CURRENCY_ERROR':
                    print("   - Fix currency configuration (should be 'CHF')")
                elif finding['category'] == 'URL_FORMAT':
                    print("   - Fix Stripe URL format issues")
        
        print(f"\n🎯 NEXT STEPS:")
        print("   1. Address all CRITICAL issues first")
        print("   2. Check Stripe dashboard for session details")
        print("   3. Test with different browsers/devices")
        print("   4. Verify webhook endpoint configuration")
        print("   5. Check for JavaScript errors in browser console")

def main():
    debugger = StripeWhiteScreenDebugger()
    debugger.run_comprehensive_debug()
    
    # Return appropriate exit code
    critical_issues = len([f for f in debugger.debug_findings if f['severity'] == 'CRITICAL'])
    return 1 if critical_issues > 0 else 0

if __name__ == "__main__":
    sys.exit(main())