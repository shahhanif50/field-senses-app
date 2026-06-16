from django.core.management.base import BaseCommand
from core.models import Role, Employee
from datetime import date

class Command(BaseCommand):
    help = 'Seeds the database with a Superadmin Role and a Superadmin Employee'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, default='admin@example.com', help='Admin email address')
        parser.add_argument('--password', type=str, default='Admin@123', help='Admin password')
        parser.add_argument('--name', type=str, default='Super Admin', help='Admin full name')

    def handle(self, *args, **kwargs):
        email = kwargs['email']
        password = kwargs['password']
        name = kwargs['name']

        # 1. Ensure the ADMIN role exists
        role, created = Role.objects.get_or_create(
            roleCode='ADMIN',
            defaults={
                'roleName': 'Superadmin',
                'roleType': 'Management',
                'defaultDashboard': '/master-setup',
                'rolePriority': 1,
                'activeStatus': True
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f"Created new ADMIN role: {role.id}"))
        else:
            self.stdout.write(self.style.WARNING(f"ADMIN role already exists: {role.id}"))

        # 2. Check if admin already exists
        if Employee.objects.filter(email=email).exists():
            self.stdout.write(self.style.ERROR(f"An employee with email {email} already exists!"))
            return

        # 3. Create the superadmin employee
        admin_employee = Employee.objects.create(
            fullName=name,
            email=email,
            mobileNumber='0000000000',
            password=password, # In a real app, hash this. Lovable Ops Hub uses plaintext passwords currently.
            roleId=role,
            designation='System Administrator',
            employmentType='Full-time',
            workMode='Office',
            joiningDate=date.today(),
            accountStatus=True
        )

        self.stdout.write(self.style.SUCCESS(f"Successfully created Superadmin!"))
        self.stdout.write(self.style.SUCCESS(f"Email: {email}"))
        self.stdout.write(self.style.SUCCESS(f"Password: {password}"))
        self.stdout.write(self.style.SUCCESS(f"Employee ID: {admin_employee.employeeId}"))
