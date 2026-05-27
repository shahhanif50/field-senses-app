from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MeetingViewSet, TrackingEntryViewSet, EmployeeTaskViewSet, AlertViewSet,
    AttendanceEntryViewSet, GeoFenceAlertViewSet, LeaveBalanceViewSet, PerformanceMetricViewSet,
    EmployeeWalletViewSet, WithdrawalRequestViewSet
)

router = DefaultRouter()
router.register(r'meetings', MeetingViewSet)
router.register(r'tracking-entries', TrackingEntryViewSet)
router.register(r'employee-tasks', EmployeeTaskViewSet)
router.register(r'alerts', AlertViewSet)
router.register(r'attendance', AttendanceEntryViewSet)
router.register(r'geofence-alerts', GeoFenceAlertViewSet)
router.register(r'leave-balances', LeaveBalanceViewSet)
router.register(r'performance-metrics', PerformanceMetricViewSet)
router.register(r'wallets', EmployeeWalletViewSet)
router.register(r'withdrawals', WithdrawalRequestViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
