from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
import json
from datetime import datetime
from .models import Meeting, TrackingEntry, EmployeeTask, Alert, AttendanceEntry, GeoFenceAlert, LeaveBalance, PerformanceMetric, EmployeeWallet, WithdrawalRequest, LeaveRequest, Message
from core.models import Employee
from .serializers import (
    MeetingSerializer, TrackingEntrySerializer, EmployeeTaskSerializer, AlertSerializer,
    AttendanceEntrySerializer, GeoFenceAlertSerializer, LeaveBalanceSerializer, PerformanceMetricSerializer,
    EmployeeWalletSerializer, WithdrawalRequestSerializer, LeaveRequestSerializer, MessageSerializer
)

class MeetingViewSet(viewsets.ModelViewSet):
    queryset = Meeting.objects.all()
    serializer_class = MeetingSerializer

class TrackingEntryViewSet(viewsets.ModelViewSet):
    queryset = TrackingEntry.objects.all()
    serializer_class = TrackingEntrySerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user_id = self.request.headers.get('X-User-Id')
        user_role = self.request.headers.get('X-User-Role')
        
        date = self.request.query_params.get('date')
        if date:
            queryset = queryset.filter(date=date)

        if user_role == 'ADMIN' or user_id == 'admin':
            pass
        elif user_role == 'MANAGER':
            team = Employee.objects.filter(reportingManager=user_id)
            team_codes = list(team.values_list('employeeId', flat=True)) + [user_id]
            # TrackingEntry employeeId matches Employee.employeeId or Employee.id depending on implementation. 
            # We'll filter for both just in case, but assume it stores employeeId.
            queryset = queryset.filter(employeeId__in=team_codes)
        elif user_id:
            # Maybe employee id string
            try:
                emp = Employee.objects.get(id=user_id)
                queryset = queryset.filter(employeeId=emp.employeeId)
            except Employee.DoesNotExist:
                queryset = queryset.none()
                
        return queryset

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

    def get_queryset(self):
        queryset = super().get_queryset()
        user_id = self.request.headers.get('X-User-Id')
        user_role = self.request.headers.get('X-User-Role')
        
        # Enforce RBAC
        if user_role == 'ADMIN' or user_id == 'admin':
            pass
        elif user_role == 'MANAGER':
            team_codes = Employee.objects.filter(reportingManager=user_id).values_list('employeeId', flat=True)
            try:
                emp = Employee.objects.get(id=user_id)
                allowed_ids = list(team_codes) + [emp.employeeId]
                queryset = queryset.filter(employeeId__in=allowed_ids)
            except Employee.DoesNotExist:
                queryset = queryset.none()
        elif user_id:
            try:
                emp = Employee.objects.get(id=user_id)
                queryset = queryset.filter(employeeId=emp.employeeId)
            except Employee.DoesNotExist:
                queryset = queryset.none()

        employee_id = self.request.query_params.get('employeeId')
        if employee_id:
            queryset = queryset.filter(employeeId=employee_id)
        return queryset

class PerformanceMetricViewSet(viewsets.ModelViewSet):
    queryset = PerformanceMetric.objects.all()
    serializer_class = PerformanceMetricSerializer

class EmployeeWalletViewSet(viewsets.ModelViewSet):
    queryset = EmployeeWallet.objects.all()
    serializer_class = EmployeeWalletSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user_id = self.request.headers.get('X-User-Id')
        user_role = self.request.headers.get('X-User-Role')
        
        # Enforce RBAC
        if user_role == 'ADMIN' or user_id == 'admin':
            pass
        elif user_role == 'MANAGER':
            team_codes = Employee.objects.filter(reportingManager=user_id).values_list('employeeId', flat=True)
            # Need to get current manager's employeeId too
            try:
                emp = Employee.objects.get(id=user_id)
                allowed_ids = list(team_codes) + [emp.employeeId]
                queryset = queryset.filter(employeeId__in=allowed_ids)
            except Employee.DoesNotExist:
                queryset = queryset.none()
        elif user_id:
            try:
                emp = Employee.objects.get(id=user_id)
                queryset = queryset.filter(employeeId=emp.employeeId)
            except Employee.DoesNotExist:
                queryset = queryset.none()

        employee_id = self.request.query_params.get('employeeId')
        if employee_id:
            queryset = queryset.filter(employeeId=employee_id)
        return queryset

class WithdrawalRequestViewSet(viewsets.ModelViewSet):
    queryset = WithdrawalRequest.objects.all()
    serializer_class = WithdrawalRequestSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user_id = self.request.headers.get('X-User-Id')
        user_role = self.request.headers.get('X-User-Role')
        
        # Enforce RBAC
        if user_role == 'ADMIN' or user_id == 'admin':
            pass
        elif user_role == 'MANAGER':
            team_codes = Employee.objects.filter(reportingManager=user_id).values_list('employeeId', flat=True)
            try:
                emp = Employee.objects.get(id=user_id)
                allowed_ids = list(team_codes) + [emp.employeeId]
                queryset = queryset.filter(employeeId__in=allowed_ids)
            except Employee.DoesNotExist:
                queryset = queryset.none()
        elif user_id:
            try:
                emp = Employee.objects.get(id=user_id)
                queryset = queryset.filter(employeeId=emp.employeeId)
            except Employee.DoesNotExist:
                queryset = queryset.none()

        employee_id = self.request.query_params.get('employeeId')
        status = self.request.query_params.get('status')
        if employee_id:
            queryset = queryset.filter(employeeId=employee_id)
        if status:
            queryset = queryset.filter(status=status)
        return queryset

class LeaveRequestViewSet(viewsets.ModelViewSet):
    queryset = LeaveRequest.objects.all().order_by('-requestDate')
    serializer_class = LeaveRequestSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user_id = self.request.headers.get('X-User-Id')
        user_role = self.request.headers.get('X-User-Role')
        
        if user_role == 'ADMIN' or user_id == 'admin':
            pass
        elif user_role == 'MANAGER':
            team_codes = Employee.objects.filter(reportingManager=user_id).values_list('employeeId', flat=True)
            try:
                emp = Employee.objects.get(id=user_id)
                allowed_ids = list(team_codes) + [emp.employeeId]
                queryset = queryset.filter(employeeId__in=allowed_ids)
            except Employee.DoesNotExist:
                queryset = queryset.none()
        elif user_id:
            try:
                emp = Employee.objects.get(id=user_id)
                queryset = queryset.filter(employeeId=emp.employeeId)
            except Employee.DoesNotExist:
                queryset = queryset.none()

        employee_id = self.request.query_params.get('employeeId')
        status = self.request.query_params.get('status')
        if employee_id:
            queryset = queryset.filter(employeeId=employee_id)
        if status:
            queryset = queryset.filter(status=status)
        return queryset
class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all().order_by('timestamp')
    serializer_class = MessageSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user_id = self.request.headers.get('X-User-Id')
        
        if user_id and user_id != 'admin':
            queryset = queryset.filter(Q(senderId=user_id) | Q(receiverId=user_id) | Q(receiverId__isnull=True))
            
        group = self.request.query_params.get('groupName')
        if group:
            queryset = queryset.filter(groupName=group)
            
        return queryset

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        message = self.get_object()
        user_id = request.headers.get('X-User-Id')
        if not user_id:
            return Response({"error": "User ID required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Normalize readBy — it may be a string in older records
        read_by = message.readBy if isinstance(message.readBy, list) else []
        
        if any(r.get('userId') == user_id for r in read_by):
            return Response({"status": "already read"})
            
        read_by.append({
            "userId": user_id,
            "readAt": datetime.now().isoformat()
        })
        message.readBy = read_by
        message.save()
        return Response({"status": "marked read"})

