#!/usr/bin/env python3

import sys
sys.path.append('/app')

try:
    from backend_test import EmpathyTrainingAPITester
    tester = EmpathyTrainingAPITester()
    
    print("Checking if method exists...")
    if hasattr(tester, 'run_comprehensive_seo_regression_tests'):
        print("✅ Method exists!")
        print("Running comprehensive SEO regression tests...")
        success = tester.run_comprehensive_seo_regression_tests()
        print(f"Result: {success}")
    else:
        print("❌ Method does not exist!")
        print("Available methods with 'run' in name:")
        for method in dir(tester):
            if 'run' in method:
                print(f"  - {method}")
                
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()