from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            time.sleep(10)
            page.goto("http://localhost:3000/login")
            page.wait_for_selector("h1")
            page.screenshot(path="verification/login_fix.png")
            print("Screenshot saved")
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
