import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000/api"

def print_result(name, res):
    if res.status_code in [200, 201]:
        print(f"[SUCCESS] {name} - Status: {res.status_code}")
    else:
        print(f"[FAILED] {name} - Status: {res.status_code}")
        print(f"   Response: {res.text}")

def run_tests():
    print("Starting E2E Backend Tests...\n")
    
    # 1. Test GET Employees (Core)
    res = requests.get(f"{BASE_URL}/employees/")
    print_result("GET Employees", res)
    if res.status_code == 200 and len(res.json()) > 0:
        print(f"   Found {len(res.json())} employees in DB.")

    # 2. Test POST Product (Inventory)
    new_product = {
        "productId": "PID-TEST",
        "sku": "SKU-TEST-001",
        "name": "Test Product E2E",
        "category": "TestCategory",
        "brand": "TestBrand",
        "uom": "Unit",
        "sellingPrice": 99.99,
        "taxCategory": "GST",
        "trackInventory": True,
        "allowDiscount": False,
        "serialBatchTracking": False,
        "expiryTracking": False,
        "status": "Active"
    }
    res = requests.post(f"{BASE_URL}/inventory/products/", json=new_product)
    print_result("POST New Product", res)
    
    # 3. Test GET Products (Inventory)
    res = requests.get(f"{BASE_URL}/inventory/products/")
    print_result("GET Products", res)
    if res.status_code == 200:
        products = res.json()
        print(f"   Found {len(products)} products in DB.")
        
    # 4. Test PATCH Product (Inventory)
    if products and any(p.get("productId") == "PID-TEST" for p in products):
        product_id = next(p["id"] for p in products if p.get("productId") == "PID-TEST")
        update_data = {"sellingPrice": 149.99}
        res = requests.patch(f"{BASE_URL}/inventory/products/{product_id}/", json=update_data)
        print_result("PATCH Product Price", res)

    # 5. Test GET Territories (CRM)
    res = requests.get(f"{BASE_URL}/crm/territories/")
    print_result("GET Territories", res)

    # 6. Test GET Customers (CRM)
    res = requests.get(f"{BASE_URL}/crm/customers/")
    print_result("GET Customers", res)
    
    print("\nE2E Backend Test Suite Completed!")

if __name__ == "__main__":
    # Add a tiny delay in case the server needs a moment
    time.sleep(1)
    try:
        run_tests()
    except Exception as e:
        print(f"[ERROR] Could not connect to server: {e}")
