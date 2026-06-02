from django.core.management.base import BaseCommand
from core.models import Role, Department, Employee, Project, Task, PermissionRequest
from ops.models import TrackingEntry, EmployeeWallet, WithdrawalRequest
from crm.models import Territory, Customer
from inventory.models import POSTerminal
import datetime
from django.utils import timezone

class Command(BaseCommand):
    help = 'Seeds the database with initial mock data for the Lovable Ops Hub'

    def handle(self, *args, **kwargs):
        self.stdout.write("Starting database seeding...")

        # Clear existing
        Role.objects.all().delete()
        Department.objects.all().delete()
        Employee.objects.all().delete()
        Project.objects.all().delete()
        Task.objects.all().delete()
        PermissionRequest.objects.all().delete()
        TrackingEntry.objects.all().delete()
        EmployeeWallet.objects.all().delete()
        WithdrawalRequest.objects.all().delete()
        Territory.objects.all().delete()
        Customer.objects.all().delete()
        POSTerminal.objects.all().delete()

        # Create Roles
        role_admin = Role.objects.create(roleName="System Admin", roleCode="ADMIN", roleType="Management", defaultDashboard="/admin", rolePriority=1)
        role_manager = Role.objects.create(roleName="Manager", roleCode="MANAGER", roleType="Management", defaultDashboard="/dashboard", rolePriority=2)
        role_employee = Role.objects.create(roleName="Employee", roleCode="EMPLOYEE", roleType="Execution", defaultDashboard="/employee-portal", rolePriority=3)
        role_sales = Role.objects.create(roleName="Sales Executive", roleCode="SALES_EXEC", roleType="Execution", defaultDashboard="/sales", rolePriority=3)
        role_warehouse = Role.objects.create(roleName="Warehouse Manager", roleCode="WH_MGR", roleType="Execution", defaultDashboard="/inventory", rolePriority=3)

        # Create Departments
        dept_management = Department.objects.create(departmentName="Management", departmentCode="MGMT", trackingEnabled=True)
        dept_sales = Department.objects.create(departmentName="Sales", departmentCode="SALES", trackingEnabled=True)
        dept_ops = Department.objects.create(departmentName="Operations", departmentCode="OPS", trackingEnabled=True)

        # Create Employees
        admin = Employee.objects.create(
            employeeId="admin", fullName="System Admin", email="admin@example.com", mobileNumber="1234567890",
            password="Admin@123", roleId=role_admin, departmentId=dept_management,
            designation="Administrator", employmentType="Full-time", workMode="Office",
            joiningDate=datetime.date(2023, 1, 15)
        )
        
        manager1 = Employee.objects.create(
            employeeId="EMP-MGR-01", fullName="Alice Smith", email="alice@example.com", mobileNumber="1112223333",
            password="password123", roleId=role_manager, departmentId=dept_sales,
            designation="Sales Manager", employmentType="Full-time", workMode="Hybrid",
            joiningDate=datetime.date(2023, 5, 10),
            reportingManager=str(admin.id)
        )
        
        manager2 = Employee.objects.create(
            employeeId="EMP-MGR-02", fullName="Bob Johnson", email="bob@example.com", mobileNumber="4445556666",
            password="password123", roleId=role_manager, departmentId=dept_ops,
            designation="Operations Manager", employmentType="Full-time", workMode="Office",
            joiningDate=datetime.date(2023, 6, 12),
            reportingManager=str(admin.id)
        )

        emp1 = Employee.objects.create(
            employeeId="EMP-001", fullName="Charlie Davis", email="charlie@example.com", mobileNumber="7778889999",
            password="password123", roleId=role_sales, departmentId=dept_sales,
            designation="Sales Representative", employmentType="Full-time", workMode="Field",
            joiningDate=datetime.date(2024, 1, 5),
            reportingManager=str(manager1.id)
        )

        emp2 = Employee.objects.create(
            employeeId="EMP-002", fullName="Diana Evans", email="diana@example.com", mobileNumber="0001112222",
            password="password123", roleId=role_sales, departmentId=dept_sales,
            designation="Sales Representative", employmentType="Full-time", workMode="Field",
            joiningDate=datetime.date(2024, 2, 10),
            reportingManager=str(manager1.id)
        )

        emp3 = Employee.objects.create(
            employeeId="EMP-003", fullName="Eve Foster", email="eve@example.com", mobileNumber="3334445555",
            password="password123", roleId=role_employee, departmentId=dept_ops,
            designation="Field Technician", employmentType="Full-time", workMode="Field",
            joiningDate=datetime.date(2024, 3, 15),
            reportingManager=str(manager2.id)
        )

        # Projects and Tasks
        p1 = Project.objects.create(name="Q3 Sales Expansion", status="Active")
        p1.assignedEmployees.add(manager1, emp1, emp2)
        
        p2 = Project.objects.create(name="Operations Overhaul", status="Active")
        p2.assignedEmployees.add(manager2, emp3)

        t1 = Task.objects.create(title="Lead Generation Campaign", project=p1, status="In Progress")
        t1.assignedEmployees.add(emp1)
        
        t2 = Task.objects.create(title="Client Follow-ups", project=p1, status="Pending")
        t2.assignedEmployees.add(emp1, emp2)
        
        t3 = Task.objects.create(title="Equipment Maintenance", project=p2, status="Done")
        t3.assignedEmployees.add(emp3)

        # Wallets
        EmployeeWallet.objects.create(employeeId=emp1.employeeId, balance=5000.0, totalEarned=15000.0, totalWithdrawn=10000.0)
        EmployeeWallet.objects.create(employeeId=emp2.employeeId, balance=2500.0, totalEarned=8000.0, totalWithdrawn=5500.0)
        EmployeeWallet.objects.create(employeeId=emp3.employeeId, balance=1200.0, totalEarned=3000.0, totalWithdrawn=1800.0)

        WithdrawalRequest.objects.create(employeeId=emp1.employeeId, amount=1000.0, status="pending")
        WithdrawalRequest.objects.create(employeeId=emp2.employeeId, amount=2000.0, status="approved")

        # Permission Requests
        PermissionRequest.objects.create(requester=emp1, approver=manager1, title="Sick Leave", description="Fever and cold", status="Pending")
        PermissionRequest.objects.create(requester=manager1, approver=admin, title="Software License", description="Need a new CRM license", status="Approved")

        # Tracking Entries
        TrackingEntry.objects.create(employeeId=emp1.employeeId, employeeName=emp1.fullName, role=role_sales.roleName, currentLocation="Downtown", checkInTime=timezone.now(), status="online", date=timezone.now().date())
        TrackingEntry.objects.create(employeeId=emp2.employeeId, employeeName=emp2.fullName, role=role_sales.roleName, currentLocation="Uptown", checkInTime=timezone.now(), status="offline", date=timezone.now().date())
        TrackingEntry.objects.create(employeeId=emp3.employeeId, employeeName=emp3.fullName, role=role_employee.roleName, currentLocation="Industrial Park", checkInTime=timezone.now(), status="idle", date=timezone.now().date())
        TrackingEntry.objects.create(employeeId=manager1.employeeId, employeeName=manager1.fullName, role=role_manager.roleName, currentLocation="Office", checkInTime=timezone.now(), status="online", date=timezone.now().date())

        # Create Territory
        Territory.objects.create(name="North Region", region="North", district="New Delhi", coverageArea="100 sq km", status="Active")
        
        # Create Customer
        Customer.objects.create(name="Metro Builders", company="Metro Construction", email="contact@metro.com", phone="555-1234", territory="North Region", lastContact="2025-01-08", status="active")

        # Create POS Terminal
        POSTerminal.objects.create(name="POS-1001 Main Store", location="Downtown", type="Hardware", status="online", lastSync="2025-01-01T10:00:00Z", ipAddress="192.168.1.10", version="1.0", operator="Admin")

        self.stdout.write(self.style.SUCCESS('Successfully seeded the database with mock data!'))
