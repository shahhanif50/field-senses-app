from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MeetingViewSet, TrackingEntryViewSet, EmployeeTaskViewSet, AlertViewSet,
    AttendanceEntryViewSet, GeoFenceAlertViewSet, LeaveBalanceViewSet, PerformanceMetricViewSet,
    EmployeeWalletViewSet, WithdrawalRequestViewSet, LeaveRequestViewSet, MessageViewSet, TravelExpenseViewSet
)
from .report_views import ReportAPIView

router = DefaultRouter()
router.register(r'meetings', MeetingViewSet)
router.register(r'expenses', TravelExpenseViewSet)
router.register(r'tracking-entries', TrackingEntryViewSet)
router.register(r'employee-tasks', EmployeeTaskViewSet)
router.register(r'alerts', AlertViewSet)
router.register(r'attendance', AttendanceEntryViewSet)
router.register(r'geofence-alerts', GeoFenceAlertViewSet)
router.register(r'leave-balances', LeaveBalanceViewSet)
router.register(r'performance-metrics', PerformanceMetricViewSet)
router.register(r'wallets', EmployeeWalletViewSet)
router.register(r'withdrawals', WithdrawalRequestViewSet)
router.register(r'leave-requests', LeaveRequestViewSet)
router.register(r'messages', MessageViewSet)

urlpatterns = [
    path('reports/', ReportAPIView.as_view(), name='reports'),
    path('', include(router.urls)),
]
