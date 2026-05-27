from django.core.management.base import BaseCommand
from core.models import Role, Department, Employee
from crm.models import Territory, Customer
from inventory.models import POSTerminal
import datetime

class Command(BaseCommand):
    help = 'Seeds the database with initial mock data for the Lovable Ops Hub'

    def handle(self, *args, **kwargs):
        self.stdout.write("Starting database seeding...")

        # Clear existing
        Role.objects.all().delete()
        Department.objects.all().delete()
        Employee.objects.all().delete()
        Territory.objects.all().delete()
        Customer.objects.all().delete()
        POSTerminal.objects.all().delete()

        # Create Roles
        role_admin = Role.objects.create(roleName="System Admin", roleCode="ADMIN", roleType="Management", defaultDashboard="/admin", rolePriority=1)
        role_sales = Role.objects.create(roleName="Sales Executive", roleCode="SALES_EXEC", roleType="Execution", defaultDashboard="/sales", rolePriority=2)
        role_warehouse = Role.objects.create(roleName="Warehouse Manager", roleCode="WH_MGR", roleType="Execution", defaultDashboard="/inventory", rolePriority=2)

        # Create Departments
        dept_management = Department.objects.create(departmentName="Management", departmentCode="MGMT", trackingEnabled=True)
        dept_sales = Department.objects.create(departmentName="Sales", departmentCode="SALES", trackingEnabled=True)
        dept_ops = Department.objects.create(departmentName="Operations", departmentCode="OPS", trackingEnabled=True)

        # Create Employees
        emp_1 = Employee.objects.create(
            employeeId="EMP-001", fullName="Laksh Rewale", email="laksh@example.com", mobileNumber="1234567890",
            password="hashed_password", roleId=role_admin, departmentId=dept_management,
            designation="Director", employmentType="Full-time", workMode="Office",
            joiningDate=datetime.date(2023, 1, 15)
        )
        emp_2 = Employee.objects.create(
            employeeId="EMP-002", fullName="Rahul Sharma", email="rahul@example.com", mobileNumber="0987654321",
            password="hashed_password", roleId=role_sales, departmentId=dept_sales,
            designation="Senior Sales Exec", employmentType="Full-time", workMode="Field",
            joiningDate=datetime.date(2024, 2, 1)
        )

        # Create Territory
        Territory.objects.create(name="North Region", region="North", district="New Delhi", coverageArea="100 sq km", status="Active")
        
        # Create Customer
        Customer.objects.create(name="Metro Builders", company="Metro Construction", email="contact@metro.com", phone="555-1234", territory="North Region", lastContact="2025-01-08", status="active")

        # Create POS Terminal
        POSTerminal.objects.create(name="POS-1001 Main Store", location="Downtown", type="Hardware", status="online", lastSync="2025-01-01T10:00:00Z", ipAddress="192.168.1.10", version="1.0", operator="Laksh Rewale")

        self.stdout.write(self.style.SUCCESS('Successfully seeded the database with mock data!'))
