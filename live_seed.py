import requests
import json
import time

BASE_URL = 'https://fieldsense.vibecopilot.ai/api'

def run():
    print("Starting Live API Seeding...")
    
    # 1. Create Organization
    print("Creating Organization...")
    res = requests.post(f'{BASE_URL}/organizations/', json={
        'name': 'Live Demo Corp',
        'domain': 'livedemo.com',
        'modulesEnabled': ['Master Setup', 'Employee Portal', 'Daily Tracking', 'Team Tracking', 'Reports', 'Sales Executive', 'Inventory Management']
    })
    
    if res.status_code != 201:
        print("Failed to create org:", res.text)
        return
        
    org = res.json()
    org_id = org['id']
    print(f"Created Org: {org['name']} (ID: {org_id})")
    
    headers = {'X-Organization-Id': org_id}
    
    # 2. Create Roles
    print("Creating Roles...")
    roles = [
        {'roleName': 'System Admin', 'roleCode': 'ADMIN', 'roleType': 'Management', 'defaultDashboard': '/master-setup', 'rolePriority': 1, 'activeStatus': True},
        {'roleName': 'Regional Manager', 'roleCode': 'REGIONAL_MANAGER', 'roleType': 'Management', 'defaultDashboard': '/employee-dashboard', 'rolePriority': 2, 'activeStatus': True},
        {'roleName': 'Manager', 'roleCode': 'MANAGER', 'roleType': 'Management', 'defaultDashboard': '/employee-dashboard', 'rolePriority': 2, 'activeStatus': True},
        {'roleName': 'Employee', 'roleCode': 'EMPLOYEE', 'roleType': 'Execution', 'defaultDashboard': '/employee-dashboard', 'rolePriority': 3, 'activeStatus': True}
    ]
    
    role_ids = {}
    for r in roles:
        res = requests.post(f'{BASE_URL}/roles/', json=r, headers=headers)
        if res.status_code == 201:
            data = res.json()
            role_ids[r['roleCode']] = data['id']
        else:
            print(f"Failed to create role {r['roleCode']}:", res.text)
            return

    # 3. Create Department
    print("Creating Department...")
    res = requests.post(f'{BASE_URL}/departments/', json={
        'departmentName': 'Management',
        'trackingEnabled': True
    }, headers=headers)
    
    if res.status_code != 201:
        print("Failed to create department:", res.text)
        return
    dept_id = res.json()['id']
    
    # 4. Create Employees
    print("Creating Employees...")
    employees = [
        {
            'fullName': 'Live Tenant Admin',
            'email': 'admin@livedemo.com',
            'mobileNumber': '1234567890',
            'password': 'Password123!',
            'roleId': role_ids['ADMIN'],
            'departmentId': dept_id,
            'designation': 'Tenant Administrator',
            'employmentType': 'Full-time',
            'workMode': 'Office',
            'joiningDate': '2024-01-01',
            'accountStatus': True
        },
        {
            'fullName': 'Live Region Manager',
            'email': 'rm@livedemo.com',
            'mobileNumber': '1112223333',
            'password': 'Password123!',
            'roleId': role_ids['REGIONAL_MANAGER'],
            'departmentId': dept_id,
            'designation': 'Regional Manager',
            'region': 'North',
            'employmentType': 'Full-time',
            'workMode': 'Hybrid',
            'joiningDate': '2024-01-10',
            'accountStatus': True
        },
        {
            'fullName': 'Live Regular Employee',
            'email': 'employee@livedemo.com',
            'mobileNumber': '0001112222',
            'password': 'Password123!',
            'roleId': role_ids['EMPLOYEE'],
            'departmentId': dept_id,
            'designation': 'Field Technician',
            'employmentType': 'Full-time',
            'workMode': 'Field',
            'joiningDate': '2024-04-10',
            'accountStatus': True
        }
    ]
    
    for emp in employees:
        res = requests.post(f'{BASE_URL}/employees/', json=emp, headers=headers)
        if res.status_code == 201:
            print(f"Created Employee: {emp['fullName']} ({emp['email']})")
        else:
            print(f"Failed to create employee {emp['email']}:", res.text)
            
    print("Seeding Complete!")

if __name__ == '__main__':
    run()
