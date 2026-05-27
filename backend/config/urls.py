from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),

    # Core app: employees, roles, departments, status-masters, projects
    path('api/', include('core.urls')),

    # CRM app: distributors, territories, sales-executives, sales-targets, distributor-links
    path('api/crm/', include('crm.urls')),

    # Inventory app: categories, uoms, products, locations, vendors
    path('api/inventory/', include('inventory.urls')),

    # Ops app: meetings, tracking-entries, employee-tasks, alerts
    path('api/ops/', include('ops.urls')),
]