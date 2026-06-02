from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RoleViewSet, DepartmentViewSet, StatusMasterViewSet,
    ProjectViewSet, EmployeeViewSet, RolePermissionViewSet,
    ReportingManagerViewSet, LoginView, RegistrationRequestViewSet,
    TaskViewSet, DocumentViewSet, PermissionRequestViewSet
)

router = DefaultRouter()
router.register(r'roles', RoleViewSet)
router.register(r'departments', DepartmentViewSet)
router.register(r'status-masters', StatusMasterViewSet)
router.register(r'projects', ProjectViewSet)
router.register(r'employees', EmployeeViewSet)
router.register(r'role-permissions', RolePermissionViewSet)
router.register(r'reporting-managers', ReportingManagerViewSet)
router.register(r'registration-requests', RegistrationRequestViewSet)
router.register(r'tasks', TaskViewSet)
router.register(r'documents', DocumentViewSet)
router.register(r'permission-requests', PermissionRequestViewSet)
urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='api-login'),
    path('', include(router.urls)),
]
