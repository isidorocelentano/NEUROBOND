import requests
import json
import re

def debug_stripe_page():
    """Debug the actual Stripe checkout page content"""
    
    print("🔍 STRIPE CHECKOUT PAGE DETAILED DEBUG")
    print("="*60)
    
    base_url = "https://payment-debug-6.preview.emergentagent.com"
    api_url = f"{base_url}/api"
    
    # Create a fresh session
    test_data = {
        "package_type": "monthly",
        "origin_url": "https://payment-debug-6.preview.emergentagent.com"
    }
    
    print("1. 🎯 CREATING FRESH STRIPE SESSION")
    print("-" * 40)
    
    try:
        response = requests.post(f"{api_url}/checkout/session", json=test_data, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            stripe_url = data.get('url')
            session_id = data.get('session_id')
            
            print(f"✅ Session ID: {session_id}")
            print(f"✅ Stripe URL: {stripe_url}")
            
            print("\n2. 🎯 ANALYZING STRIPE PAGE CONTENT")
            print("-" * 40)
            
            # Test with different approaches
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            }
            
            stripe_response = requests.get(stripe_url, headers=headers, timeout=15)
            
            print(f"Status Code: {stripe_response.status_code}")
            print(f"Content Length: {len(stripe_response.text)} characters")
            print(f"Content Type: {stripe_response.headers.get('Content-Type', 'Not specified')}")
            
            content = stripe_response.text
            
            # Check for specific error patterns
            print("\n3. 🎯 ERROR PATTERN ANALYSIS")
            print("-" * 40)
            
            error_patterns = [
                ('Invalid session', r'invalid.*session'),
                ('Expired session', r'expired.*session'),
                ('Configuration error', r'configuration.*error'),
                ('Payment method error', r'payment.*method.*error'),
                ('Currency error', r'currency.*error'),
                ('Amount error', r'amount.*error'),
                ('Subscription error', r'subscription.*error'),
                ('Line items error', r'line.*items.*error'),
                ('Metadata error', r'metadata.*error'),
                ('Webhook error', r'webhook.*error'),
            ]
            
            found_errors = []
            content_lower = content.lower()
            
            for error_name, pattern in error_patterns:
                if re.search(pattern, content_lower):
                    found_errors.append(error_name)
                    print(f"🚨 Found: {error_name}")
            
            if not found_errors:
                print("✅ No specific error patterns found in content")
            
            # Check for JavaScript errors or loading issues
            print("\n4. 🎯 JAVASCRIPT AND LOADING ANALYSIS")
            print("-" * 40)
            
            js_patterns = [
                ('JavaScript error', r'javascript.*error'),
                ('Script error', r'script.*error'),
                ('Loading error', r'loading.*error'),
                ('Network error', r'network.*error'),
                ('Timeout error', r'timeout.*error'),
                ('CORS error', r'cors.*error'),
                ('CSP error', r'content.*security.*policy'),
            ]
            
            for error_name, pattern in js_patterns:
                if re.search(pattern, content_lower):
                    print(f"🚨 Found: {error_name}")
            
            # Check for Stripe-specific elements
            print("\n5. 🎯 STRIPE ELEMENT ANALYSIS")
            print("-" * 40)
            
            stripe_elements = [
                ('Stripe form', r'<form.*stripe'),
                ('Payment element', r'payment.*element'),
                ('Card element', r'card.*element'),
                ('Checkout form', r'checkout.*form'),
                ('Submit button', r'<button.*submit'),
                ('Error message', r'error.*message'),
                ('Loading spinner', r'loading.*spinner'),
            ]
            
            for element_name, pattern in stripe_elements:
                if re.search(pattern, content_lower):
                    print(f"✅ Found: {element_name}")
                else:
                    print(f"❌ Missing: {element_name}")
            
            # Extract any visible error messages
            print("\n6. 🎯 VISIBLE ERROR MESSAGES")
            print("-" * 40)
            
            # Look for common error message containers
            error_containers = [
                r'<div[^>]*error[^>]*>(.*?)</div>',
                r'<span[^>]*error[^>]*>(.*?)</span>',
                r'<p[^>]*error[^>]*>(.*?)</p>',
                r'"error":\s*"([^"]*)"',
                r'"message":\s*"([^"]*)"',
            ]
            
            visible_errors = []
            for pattern in error_containers:
                matches = re.findall(pattern, content, re.IGNORECASE | re.DOTALL)
                for match in matches:
                    if isinstance(match, tuple):
                        match = match[0] if match else ""
                    if match and len(match.strip()) > 0:
                        # Clean up HTML tags
                        clean_match = re.sub(r'<[^>]+>', '', match).strip()
                        if clean_match and len(clean_match) < 200:
                            visible_errors.append(clean_match)
            
            if visible_errors:
                for error in visible_errors[:5]:  # Show first 5 errors
                    print(f"🚨 Error: {error}")
            else:
                print("✅ No visible error messages found")
            
            # Check if the page is actually loading properly
            print("\n7. 🎯 PAGE LOADING STATUS")
            print("-" * 40)
            
            if 'stripe' in content_lower and len(content) > 100000:
                print("✅ Page appears to be loading Stripe content")
                
                # Check for white screen indicators
                if content.count('<div') < 10:
                    print("🚨 Very few HTML elements - possible white screen")
                elif 'display:none' in content_lower and content_lower.count('display:none') > 10:
                    print("⚠️  Many hidden elements - possible loading issue")
                else:
                    print("✅ Page structure appears normal")
                    
                # Check for loading states
                if 'loading' in content_lower:
                    loading_count = content_lower.count('loading')
                    print(f"⚠️  Found {loading_count} loading references - may be stuck loading")
                
            else:
                print("🚨 Page content is too short or doesn't contain Stripe elements")
            
            # Final recommendation
            print("\n8. 💡 DIAGNOSIS AND RECOMMENDATIONS")
            print("-" * 40)
            
            if found_errors:
                print("🚨 CONFIGURATION ERRORS DETECTED:")
                for error in found_errors:
                    print(f"   - {error}")
                print("\n   Recommendation: Check Stripe dashboard for session details")
            elif len(content) < 50000:
                print("🚨 PAGE CONTENT TOO SHORT:")
                print("   - Possible network issue or server error")
                print("   - Check browser developer tools for JavaScript errors")
            elif 'loading' in content_lower and content_lower.count('loading') > 5:
                print("⚠️  LOADING ISSUES DETECTED:")
                print("   - Page may be stuck in loading state")
                print("   - Check network connectivity and JavaScript execution")
            else:
                print("✅ PAGE APPEARS TO BE LOADING CORRECTLY:")
                print("   - Content length is appropriate")
                print("   - No obvious error patterns detected")
                print("   - Issue may be browser-specific or JavaScript-related")
                print("\n   Next steps:")
                print("   1. Test in different browsers")
                print("   2. Check browser console for JavaScript errors")
                print("   3. Verify network connectivity")
                print("   4. Test with different user agents")
        
        else:
            print(f"❌ Failed to create session: {response.status_code}")
            print(f"   Error: {response.text}")
    
    except Exception as e:
        print(f"❌ Debug failed: {str(e)}")

if __name__ == "__main__":
    debug_stripe_page()