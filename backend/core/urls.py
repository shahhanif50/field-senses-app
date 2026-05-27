from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RoleViewSet, DepartmentViewSet, StatusMasterViewSet,
    ProjectViewSet, EmployeeViewSet, RolePermissionViewSet,
    ReportingManagerViewSet, LoginView
)

router = DefaultRouter()
router.register(r'roles', RoleViewSet)
router.register(r'departments', DepartmentViewSet)
router.register(r'status-masters', StatusMasterViewSet)
router.register(r'projects', ProjectViewSet)
router.register(r'employees', EmployeeViewSet)
router.register(r'role-permissions', RolePermissionViewSet)
router.register(r'reporting-managers', ReportingManagerViewSet)

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='api-login'),
    path('', include(router.urls)),
]
