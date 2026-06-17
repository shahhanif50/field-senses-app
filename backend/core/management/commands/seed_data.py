from django.core.management.base import BaseCommand
from core.models import Organization, Role, Department, Employee, Project, Task, PermissionRequest
from ops.models import TrackingEntry, EmployeeWallet, WithdrawalRequest
from crm.models import Territory, Customer
from inventory.models import POSTerminal
import datetime
from django.utils import timezone

class Command(BaseCommand):
    help = 'Seeds the database with initial mock data including Organization, Admin, Regional Manager, and Employees'

    def handle(self, *args, **kwargs):
        self.stdout.write("Starting database seeding...")

        # Clear existing
        Role.objects.all().delete()
        Department.objects.all().delete()
        Employee.objects.all().delete()
        Organization.objects.all().delete()

        # Create Organization
        org = Organization.objects.create(
            name="Demo Corp",
            domain="democorp.com",
            modulesEnabled=["Master Setup", "Employee Portal", "Daily Tracking", "Team Tracking", "Reports", "Sales Executive", "Inventory Management"]
        )

        # Create Roles
        role_admin = Role.objects.create(roleName="System Admin", roleCode="ADMIN", roleType="Management", defaultDashboard="/master-setup", rolePriority=1, organization=org)
        role_manager = Role.objects.create(roleName="Manager", roleCode="MANAGER", roleType="Management", defaultDashboard="/employee-dashboard", rolePriority=2, organization=org)
        role_rm = Role.objects.create(roleName="Regional Manager", roleCode="REGIONAL_MANAGER", roleType="Management", defaultDashboard="/employee-dashboard", rolePriority=2, organization=org)
        role_employee = Role.objects.create(roleName="Employee", roleCode="EMPLOYEE", roleType="Execution", defaultDashboard="/employee-dashboard", rolePriority=3, organization=org)
        role_sales = Role.objects.create(roleName="Sales Executive", roleCode="SALES_EXEC", roleType="Execution", defaultDashboard="/employee-dashboard", rolePriority=3, organization=org)

        # Create Departments
        dept_management = Department.objects.create(departmentName="Management", departmentCode="MGMT", trackingEnabled=True, organization=org)
        dept_sales = Department.objects.create(departmentName="Sales", departmentCode="SALES", trackingEnabled=True, organization=org)
        dept_ops = Department.objects.create(departmentName="Operations", departmentCode="OPS", trackingEnabled=True, organization=org)

        # Create Employees
        # 1. Tenant Admin
        admin = Employee.objects.create(
            employeeId="EMP-0001", fullName="Demo Admin", email="admin@democorp.com", mobileNumber="1234567890",
            password="Password123!", roleId=role_admin, departmentId=dept_management,
            designation="Tenant Administrator", employmentType="Full-time", workMode="Office",
            joiningDate=datetime.date(2024, 1, 1), accountStatus=True, organization=org
        )
        
        # 2. Regional Manager
        rm = Employee.objects.create(
            employeeId="EMP-0002", fullName="Region Manager", email="rm@democorp.com", mobileNumber="1112223333",
            password="Password123!", roleId=role_rm, departmentId=dept_management,
            designation="Regional Manager", employmentType="Full-time", workMode="Hybrid",
            joiningDate=datetime.date(2024, 1, 10), reportingManager=str(admin.id),
            region="North", accountStatus=True, organization=org
        )

        # 3. Regular Manager
        manager1 = Employee.objects.create(
            employeeId="EMP-0003", fullName="Sales Manager", email="manager@democorp.com", mobileNumber="4445556666",
            password="Password123!", roleId=role_manager, departmentId=dept_sales,
            designation="Sales Manager", employmentType="Full-time", workMode="Office",
            joiningDate=datetime.date(2024, 2, 1), reportingManager=str(rm.id),
            region="North", accountStatus=True, organization=org
        )

        # 4. Sales Executive
        emp1 = Employee.objects.create(
            employeeId="EMP-0004", fullName="Sales Executive", email="sales@democorp.com", mobileNumber="7778889999",
            password="Password123!", roleId=role_sales, departmentId=dept_sales,
            designation="Sales Representative", employmentType="Full-time", workMode="Field",
            joiningDate=datetime.date(2024, 3, 5), reportingManager=str(manager1.id),
            region="North", accountStatus=True, organization=org
        )

        # 5. Regular Employee
        emp2 = Employee.objects.create(
            employeeId="EMP-0005", fullName="Regular Employee", email="employee@democorp.com", mobileNumber="0001112222",
            password="Password123!", roleId=role_employee, departmentId=dept_ops,
            designation="Field Technician", employmentType="Full-time", workMode="Field",
            joiningDate=datetime.date(2024, 4, 10), reportingManager=str(admin.id),
            accountStatus=True, organization=org
        )

        self.stdout.write(self.style.SUCCESS('\nSuccessfully seeded the database with mock data!\n'))
        self.stdout.write(self.style.SUCCESS('--- DEMO LOGIN CREDENTIALS ---'))
        self.stdout.write('All passwords are: Password123!')
        self.stdout.write(f'Tenant Admin:      {admin.email}')
        self.stdout.write(f'Regional Manager:  {rm.email}')
        self.stdout.write(f'Sales Manager:     {manager1.email}')
        self.stdout.write(f'Sales Executive:   {emp1.email}')
        self.stdout.write(f'Regular Employee:  {emp2.email}')
        self.stdout.write(self.style.SUCCESS('------------------------------\n'))
