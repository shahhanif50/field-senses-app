from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    OrganizationViewSet, SiteViewSet,
    RoleViewSet, DepartmentViewSet, StatusMasterViewSet,
    ProjectViewSet, EmployeeViewSet, RolePermissionViewSet,
    ReportingManagerViewSet, LoginView, MeView, RegistrationRequestViewSet,
    TaskViewSet, DocumentViewSet, PermissionRequestViewSet,
    RouteAnalyticsViewSet, predict_eta, TerritoryViewSet
)

router = DefaultRouter()
router.register(r'organizations', OrganizationViewSet)
router.register(r'sites', SiteViewSet)
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
router.register(r'route-analytics', RouteAnalyticsViewSet)
router.register(r'territories', TerritoryViewSet)
urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='api-login'),
    path('auth/me/', MeView.as_view(), name='api-me'),
    path('predict-eta/', predict_eta, name='predict-eta'),
    path('', include(router.urls)),
]
