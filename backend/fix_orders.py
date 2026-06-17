import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from inventory.models import ProductOrder
from core.models import Employee

orders = ProductOrder.objects.filter(organization__isnull=True)
count = 0
for o in orders:
    try:
        emp = Employee.objects.filter(id=o.employeeId).first()
        if not emp:
            emp = Employee.objects.filter(employeeId=o.employeeId).first()
        if emp and emp.organization:
            o.organization = emp.organization
            o.save()
            count += 1
    except Exception as e:
        print("Error:", e)

print(f'Fixed {count} orders.')
