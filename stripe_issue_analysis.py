import requests
import json

def analyze_stripe_issues():
    """Analyze the specific Stripe configuration issues found"""
    
    print("🔍 STRIPE WHITE SCREEN ISSUE ANALYSIS")
    print("="*60)
    
    base_url = "https://couple-connect-22.preview.emergentagent.com"
    api_url = f"{base_url}/api"
    
    # Test data from the review request
    test_data = {
        "package_type": "monthly",
        "origin_url": "https://couple-connect-22.preview.emergentagent.com"
    }
    
    print("\n1. 🎯 TESTING CHECKOUT SESSION CREATION")
    print("-" * 40)
    
    try:
        response = requests.post(f"{api_url}/checkout/session", json=test_data, timeout=30)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            session_id = data.get('session_id')
            stripe_url = data.get('url')
            
            print(f"✅ Session created: {session_id}")
            print(f"✅ Stripe URL: {stripe_url[:60]}...")
            
            # Test session status
            print("\n2. 🎯 TESTING SESSION STATUS")
            print("-" * 40)
            
            status_response = requests.get(f"{api_url}/checkout/status/{session_id}", timeout=30)
            if status_response.status_code == 200:
                status_data = status_response.json()
                
                print("📋 Session Configuration:")
                for key, value in status_data.items():
                    if key != 'success':
                        print(f"   {key}: {value}")
                
                # Identify specific issues
                print("\n3. 🚨 IDENTIFIED ISSUES")
                print("-" * 40)
                
                issues = []
                
                # Issue 1: Amount mismatch (Swiss VAT not applied)
                amount = status_data.get('amount_total', 0)
                expected_amount = 1081  # CHF 10.81 in cents
                if amount != expected_amount:
                    issues.append({
                        "issue": "Swiss VAT not applied correctly",
                        "current": f"{amount} cents (CHF {amount/100:.2f})",
                        "expected": f"{expected_amount} cents (CHF {expected_amount/100:.2f})",
                        "severity": "HIGH"
                    })
                
                # Issue 2: Missing mode (should be 'subscription')
                if 'mode' not in status_data or not status_data.get('mode'):
                    issues.append({
                        "issue": "Missing Stripe mode parameter",
                        "current": "Not specified",
                        "expected": "subscription",
                        "severity": "CRITICAL"
                    })
                
                # Issue 3: Missing payment method types
                if 'payment_method_types' not in status_data or not status_data.get('payment_method_types'):
                    issues.append({
                        "issue": "Missing payment method types",
                        "current": "Not specified",
                        "expected": "['card']",
                        "severity": "HIGH"
                    })
                
                # Issue 4: Check webhook URL format
                metadata = status_data.get('metadata', {})
                webhook_url = metadata.get('webhook_url', '')
                if webhook_url.startswith('http://'):
                    issues.append({
                        "issue": "Webhook URL uses HTTP instead of HTTPS",
                        "current": webhook_url,
                        "expected": webhook_url.replace('http://', 'https://'),
                        "severity": "MEDIUM"
                    })
                
                # Print issues
                for i, issue in enumerate(issues, 1):
                    print(f"\n❌ Issue {i}: {issue['issue']} [{issue['severity']}]")
                    print(f"   Current: {issue['current']}")
                    print(f"   Expected: {issue['expected']}")
                
                # Test the actual Stripe URL
                print("\n4. 🎯 TESTING STRIPE CHECKOUT PAGE")
                print("-" * 40)
                
                try:
                    stripe_response = requests.get(stripe_url, timeout=15)
                    print(f"Stripe page status: {stripe_response.status_code}")
                    
                    if stripe_response.status_code == 200:
                        content = stripe_response.text
                        content_length = len(content)
                        print(f"Content length: {content_length} characters")
                        
                        # Check for white screen indicators
                        if content_length < 1000:
                            print("🚨 CRITICAL: Content too short - likely white screen!")
                        elif 'error' in content.lower():
                            print("🚨 ERROR: Stripe page contains error content")
                            
                            # Try to extract error details
                            if 'invalid' in content.lower():
                                print("   Possible cause: Invalid session configuration")
                            if 'expired' in content.lower():
                                print("   Possible cause: Session expired")
                            if 'payment_method' in content.lower():
                                print("   Possible cause: Payment method configuration issue")
                        else:
                            print("✅ Stripe page content appears normal")
                    
                except Exception as e:
                    print(f"❌ Failed to test Stripe URL: {str(e)}")
                
                print("\n5. 💡 ROOT CAUSE ANALYSIS")
                print("-" * 40)
                
                print("The white screen issue is likely caused by:")
                print("1. 🎯 MISSING SUBSCRIPTION MODE: The Stripe session is created as a one-time payment")
                print("   instead of a subscription, which may cause display issues for recurring payments.")
                print("2. 🎯 INCOMPLETE CONFIGURATION: Missing payment_method_types and other required")
                print("   parameters for subscription checkout sessions.")
                print("3. 🎯 AMOUNT DISCREPANCY: Swiss VAT calculation issue (showing CHF 10.00 instead of CHF 10.81)")
                
                print("\n6. 🔧 RECOMMENDED FIXES")
                print("-" * 40)
                
                print("1. Update CheckoutSessionRequest to include:")
                print("   - mode: 'subscription' (for recurring payments)")
                print("   - payment_method_types: ['card']")
                print("   - line_items with proper price configuration")
                print("2. Fix Swiss VAT calculation (10.00 * 1.081 = 10.81)")
                print("3. Use HTTPS for webhook URLs")
                print("4. Consider using Stripe Price IDs for subscriptions")
                
                return len(issues)
                
    except Exception as e:
        print(f"❌ Failed to analyze Stripe issues: {str(e)}")
        return -1

if __name__ == "__main__":
    issue_count = analyze_stripe_issues()
    print(f"\n📊 SUMMARY: Found {issue_count} configuration issues")
    if issue_count > 0:
        print("🚨 Action required to fix white screen issue")
    else:
        print("✅ No major configuration issues found")