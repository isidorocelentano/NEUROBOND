import requests
import json
import os

def validate_stripe_session():
    """Validate the Stripe session configuration directly"""
    
    print("🔍 STRIPE SESSION VALIDATION")
    print("="*50)
    
    base_url = "https://empathybond.preview.emergentagent.com"
    api_url = f"{base_url}/api"
    
    # Create a session
    test_data = {
        "package_type": "monthly",
        "origin_url": "https://empathybond.preview.emergentagent.com"
    }
    
    print("1. 🎯 CREATING SESSION")
    print("-" * 30)
    
    try:
        response = requests.post(f"{api_url}/checkout/session", json=test_data, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            session_id = data.get('session_id')
            
            print(f"✅ Session created: {session_id}")
            
            # Get detailed session status
            print("\n2. 🎯 SESSION DETAILS")
            print("-" * 30)
            
            status_response = requests.get(f"{api_url}/checkout/status/{session_id}", timeout=30)
            
            if status_response.status_code == 200:
                status_data = status_response.json()
                
                print("📋 Complete Session Configuration:")
                for key, value in status_data.items():
                    print(f"   {key}: {value}")
                
                # Validate critical fields
                print("\n3. 🎯 VALIDATION CHECKS")
                print("-" * 30)
                
                validations = []
                
                # Check mode
                mode = status_data.get('mode')
                if mode == 'subscription':
                    validations.append(("Mode", "✅ PASS", f"Correctly set to '{mode}'"))
                else:
                    validations.append(("Mode", "❌ FAIL", f"Expected 'subscription', got '{mode}'"))
                
                # Check payment methods
                payment_methods = status_data.get('payment_method_types', [])
                if 'card' in payment_methods:
                    validations.append(("Payment Methods", "✅ PASS", f"Card payment enabled: {payment_methods}"))
                else:
                    validations.append(("Payment Methods", "❌ FAIL", f"Card payment not found: {payment_methods}"))
                
                # Check amount
                amount = status_data.get('amount_total', 0)
                if amount == 1081:
                    validations.append(("Amount", "✅ PASS", f"Correct Swiss VAT amount: {amount} cents"))
                else:
                    validations.append(("Amount", "❌ FAIL", f"Expected 1081 cents, got {amount}"))
                
                # Check currency
                currency = status_data.get('currency', '').upper()
                if currency == 'CHF':
                    validations.append(("Currency", "✅ PASS", f"Correct currency: {currency}"))
                else:
                    validations.append(("Currency", "❌ FAIL", f"Expected CHF, got {currency}"))
                
                # Check status
                session_status = status_data.get('status')
                if session_status == 'open':
                    validations.append(("Session Status", "✅ PASS", f"Session is open: {session_status}"))
                else:
                    validations.append(("Session Status", "⚠️  WARNING", f"Session status: {session_status}"))
                
                # Check metadata
                metadata = status_data.get('metadata', {})
                if metadata and 'package_type' in metadata:
                    validations.append(("Metadata", "✅ PASS", f"Metadata present: {len(metadata)} fields"))
                else:
                    validations.append(("Metadata", "❌ FAIL", "Metadata missing or incomplete"))
                
                # Print validation results
                for check, result, details in validations:
                    print(f"{result} {check}: {details}")
                
                # Test the session with a direct Stripe API call
                print("\n4. 🎯 DIRECT STRIPE API VALIDATION")
                print("-" * 30)
                
                # We can't directly call Stripe API without the secret key in this context,
                # but we can check if the session URL structure is correct
                stripe_url = data.get('url', '')
                
                if stripe_url.startswith('https://checkout.stripe.com/c/pay/'):
                    print("✅ Stripe URL format is correct")
                    
                    # Extract session ID from URL
                    url_session_id = stripe_url.split('/c/pay/')[-1].split('#')[0]
                    if url_session_id == session_id:
                        print("✅ Session ID in URL matches created session")
                    else:
                        print(f"❌ Session ID mismatch: URL has {url_session_id}, expected {session_id}")
                else:
                    print(f"❌ Invalid Stripe URL format: {stripe_url}")
                
                # Summary
                print("\n5. 💡 VALIDATION SUMMARY")
                print("-" * 30)
                
                passed = len([v for v in validations if v[1] == "✅ PASS"])
                failed = len([v for v in validations if v[1] == "❌ FAIL"])
                warnings = len([v for v in validations if v[1] == "⚠️  WARNING"])
                
                print(f"✅ Passed: {passed}")
                print(f"❌ Failed: {failed}")
                print(f"⚠️  Warnings: {warnings}")
                
                if failed == 0:
                    print("\n🎉 SESSION CONFIGURATION IS VALID!")
                    print("The white screen issue is likely NOT due to session configuration.")
                    print("\nPossible causes:")
                    print("- Browser JavaScript issues")
                    print("- Network connectivity problems")
                    print("- Stripe service temporary issues")
                    print("- Browser security settings blocking content")
                    print("\nRecommended next steps:")
                    print("1. Test in different browsers (Chrome, Firefox, Safari)")
                    print("2. Check browser developer console for JavaScript errors")
                    print("3. Try in incognito/private browsing mode")
                    print("4. Test from different networks/locations")
                else:
                    print(f"\n🚨 {failed} CONFIGURATION ISSUES FOUND!")
                    print("These issues may be causing the white screen problem.")
                
            else:
                print(f"❌ Failed to get session status: {status_response.status_code}")
        else:
            print(f"❌ Failed to create session: {response.status_code}")
            print(f"Error: {response.text}")
    
    except Exception as e:
        print(f"❌ Validation failed: {str(e)}")

if __name__ == "__main__":
    validate_stripe_session()