import json
import time
import os
from playwright.sync_api import sync_playwright

def test_browser_flow():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load frontend
        print("Navigating to frontend...")
        page.goto("http://localhost:5173")

        # Wait for the company registration form
        page.wait_for_selector("input[name='companyName']", timeout=10000)
        
        # Fill details
        print("Filling registration form...")
        page.fill("input[name='companyName']", "SIET Corp")
        page.fill("input[name='hrName']", "Test HR")
        page.fill("input[name='hrEmail']", "hr@siet.com")
        page.fill("input[name='hrPhone']", "+919876543210")
        
        # Clear mailbox before submission
        if os.path.exists(".test_mailbox.json"):
            os.remove(".test_mailbox.json")

        # Submit
        page.click("button[type='submit']")

        # Poll mailbox
        print("Waiting for OTP...")
        otp = None
        for _ in range(20):
            if os.path.exists(".test_mailbox.json"):
                try:
                    with open(".test_mailbox.json", "r") as f:
                        mailbox = json.load(f)
                        if len(mailbox) > 0:
                            otp = mailbox[-1]["otp"]
                            break
                except Exception:
                    pass
            time.sleep(1)

        if not otp:
            print("Failed to get OTP from mailbox.")
            browser.close()
            return
            
        print(f"Captured OTP: {otp}")

        # Wait for OTP input
        page.wait_for_selector("input[placeholder*='Enter 6-digit code']")
        
        # Test incorrect OTP first
        print("Testing invalid OTP...")
        page.fill("input[placeholder*='Enter 6-digit code']", "000000")
        page.click("button:has-text('Verify Email')")
        time.sleep(2)  # Wait for error

        # Fill correct OTP
        print("Testing correct OTP...")
        page.fill("input[placeholder*='Enter 6-digit code']", otp)
        page.click("button:has-text('Verify Email')")

        # Check if we reached the Company Page (Welcome)
        try:
            # Check for a specific element that appears on the dashboard
            page.wait_for_selector("text=Welcome", timeout=10000)
            print("Successfully verified session and reached dashboard!")
            page.screenshot(path="dashboard_success.png")
        except Exception as e:
            print(f"Failed to reach dashboard: {e}")
            page.screenshot(path="dashboard_fail.png")
            browser.close()
            return

        # Attempt Payment Flow Diagnosis
        try:
            print("Attempting to initiate payment...")
            # Usually there's a button to "Verify a Candidate" or "Initiate Payment" or "Proceed to Payment"
            # Let's find any button containing 'Pay' or 'Verify Candidate'
            if page.query_selector("button:has-text('Pay Verification Fee')"):
                page.click("button:has-text('Pay Verification Fee')")
            elif page.query_selector("button:has-text('Verify a Candidate')"):
                page.click("button:has-text('Verify a Candidate')")
            elif page.query_selector("button:has-text('Submit & Pay')"):
                page.click("button:has-text('Submit & Pay')")
            else:
                print("Could not find a generic payment button, trying to click the first button...")
                page.click("button")

            time.sleep(3)
            # Check for Razorpay frame or checkout UI
            frames = page.frames
            razorpay_found = False
            for frame in frames:
                if "razorpay" in frame.url:
                    razorpay_found = True
                    break
            
            if razorpay_found:
                print("Razorpay checkout widget loaded successfully.")
            else:
                print("Razorpay widget did not load. Checking for errors on page.")
                page.screenshot(path="razorpay_fail.png")
        except Exception as e:
            print(f"Payment diagnosis: Could not interact with payment flow. Error: {e}")

        browser.close()

if __name__ == "__main__":
    test_browser_flow()
