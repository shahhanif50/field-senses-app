from rest_framework import viewsets
from .models import Meeting, TrackingEntry, EmployeeTask, Alert, AttendanceEntry, GeoFenceAlert, LeaveBalance, PerformanceMetric, EmployeeWallet, WithdrawalRequest
from .serializers import (
    MeetingSerializer, TrackingEntrySerializer, EmployeeTaskSerializer, AlertSerializer,
    AttendanceEntrySerializer, GeoFenceAlertSerializer, LeaveBalanceSerializer, PerformanceMetricSerializer,
    EmployeeWalletSerializer, WithdrawalRequestSerializer
)

class MeetingViewSet(viewsets.ModelViewSet):
    queryset = Meeting.objects.all()
    serializer_class = MeetingSerializer

class TrackingEntryViewSet(viewsets.ModelViewSet):
    queryset = TrackingEntry.objects.all()
    serializer_class = TrackingEntrySerializer

class EmployeeTaskViewSet(viewsets.ModelViewSet):
    queryset = EmployeeTask.objects.all()
    serializer_class = EmployeeTaskSerializer

class AlertViewSet(viewsets.ModelViewSet):
    queryset = Alert.objects.all()
    serializer_class = AlertSerializer

class AttendanceEntryViewSet(viewsets.ModelViewSet):
    queryset = AttendanceEntry.objects.all()
    serializer_class = AttendanceEntrySerializer

class GeoFenceAlertViewSet(viewsets.ModelViewSet):
    queryset = GeoFenceAlert.objects.all()
    serializer_class = GeoFenceAlertSerializer

class LeaveBalanceViewSet(viewsets.ModelViewSet):
    queryset = LeaveBalance.objects.all()
    serializer_class = LeaveBalanceSerializer

class PerformanceMetricViewSet(viewsets.ModelViewSet):
    queryset = PerformanceMetric.objects.all()
    serializer_class = PerformanceMetricSerializer

class EmployeeWalletViewSet(viewsets.ModelViewSet):
    queryset = EmployeeWallet.objects.all()
    serializer_class = EmployeeWalletSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        employee_id = self.request.query_params.get('employeeId')
        if employee_id:
            queryset = queryset.filter(employeeId=employee_id)
        return queryset

class WithdrawalRequestViewSet(viewsets.ModelViewSet):
    queryset = WithdrawalRequest.objects.all()
    serializer_class = WithdrawalRequestSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        employee_id = self.request.query_params.get('employeeId')
        status = self.request.query_params.get('status')
        if employee_id:
            queryset = queryset.filter(employeeId=employee_id)
        if status:
            queryset = queryset.filter(status=status)
        return queryset
