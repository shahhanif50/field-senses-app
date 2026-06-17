from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
import json
from datetime import datetime
from .models import Meeting, TrackingEntry, EmployeeTask, Alert, AttendanceEntry, GeoFenceAlert, LeaveBalance, PerformanceMetric, EmployeeWallet, WithdrawalRequest, LeaveRequest, Message, TravelExpense
from core.models import Employee

def get_site_restricted_employee_codes(user_id, user_role):
    if not user_id or user_id == 'admin':
        return None
    try:
        emp = Employee.objects.get(id=user_id)
        
        if user_role and user_role.upper() in ['REGIONAL_MANAGER', 'REGIONAL_M'] and emp.region:
            from django.db.models import Q
            regional_emps = Employee.objects.filter(Q(region=emp.region) | Q(siteId__region=emp.region))
            return list(regional_emps.values_list("employeeId", flat=True))
            
        admin_site_ids = list(emp.accessibleSites.values_list("id", flat=True))
        if user_role and user_role.upper() == 'SITE_ADMIN' and emp.siteId:
            admin_site_ids.append(emp.siteId.id)
        if admin_site_ids:
            return list(Employee.objects.filter(siteId__in=admin_site_ids).values_list("employeeId", flat=True))
    except Employee.DoesNotExist:
        pass
    return None

from .serializers import (
    MeetingSerializer, TrackingEntrySerializer, EmployeeTaskSerializer, AlertSerializer,
    AttendanceEntrySerializer, GeoFenceAlertSerializer, LeaveBalanceSerializer, PerformanceMetricSerializer,
    EmployeeWalletSerializer, WithdrawalRequestSerializer, LeaveRequestSerializer, MessageSerializer, TravelExpenseSerializer
)

class MeetingViewSet(viewsets.ModelViewSet):
    queryset = Meeting.objects.all()
    serializer_class = MeetingSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user_id = self.request.headers.get('X-User-Id')
        user_role = self.request.headers.get('X-User-Role')
        org_id = self.request.headers.get('X-Organization-Id')

        if user_role:
            user_role = user_role.upper()

        # Resolve site restriction
        admin_site_ids = []
        if user_id and user_id != 'admin':
            try:
                emp = Employee.objects.get(id=user_id)
                admin_site_ids = list(emp.accessibleSites.values_list("id", flat=True))
                if user_role == 'SITE_ADMIN' and emp.siteId:
                    admin_site_ids.append(emp.siteId.id)
            except Employee.DoesNotExist:
                pass

        if user_role == 'ADMIN' or user_id == 'admin':
            if org_id and org_id != 'null':
                emp_ids = Employee.objects.filter(organization_id=org_id).values_list('employeeId', flat=True)
                queryset = queryset.filter(employeeId__in=emp_ids)
        elif user_role in ['SR_MGR', 'HEAD']:
            if org_id and org_id != 'null':
                org_emp_ids = Employee.objects.filter(organization_id=org_id)
                if admin_site_ids:
                    org_emp_ids = org_emp_ids.filter(siteId__in=admin_site_ids)
                org_emp_ids = org_emp_ids.values_list('id', flat=True)
                queryset = queryset.filter(attendees__id__in=org_emp_ids).distinct()
        elif user_role == 'MANAGER' and user_id:
            team = Employee.objects.filter(reportingManager=user_id)
            if admin_site_ids:
                team = team.filter(siteId__in=admin_site_ids)
            team_ids = team.values_list('id', flat=True)
            queryset = queryset.filter(Q(attendees__id=user_id) | Q(attendees__id__in=team_ids)).distinct()
        elif (user_role == 'SITE_ADMIN' or admin_site_ids) and user_id:
            if admin_site_ids:
                site_emp_ids = Employee.objects.filter(siteId__in=admin_site_ids).values_list("id", flat=True)
                queryset = queryset.filter(attendees__id__in=site_emp_ids).distinct()
            else:
                queryset = queryset.none()
        elif user_id:
            queryset = queryset.filter(attendees__id=user_id).distinct()
        return queryset

class TravelExpenseViewSet(viewsets.ModelViewSet):
    queryset = TravelExpense.objects.all().order_by('-timestamp')
    serializer_class = TravelExpenseSerializer

    def perform_create(self, serializer):
        instance = serializer.save()
        Alert.objects.create(
            type='expense_approval',
            message=f"New expense submitted for approval by {instance.employeeName}.",
            severity='medium',
            relatedEntityId=instance.employeeId,
            relatedEntityType='employee'
        )

    def get_queryset(self):
        queryset = super().get_queryset()
        user_id = self.request.headers.get('X-User-Id')
        user_role = self.request.headers.get('X-User-Role')
        
        if user_role:
            user_role = user_role.upper()
            
        allowed_site_emp_codes = get_site_restricted_employee_codes(user_id, user_role)
        
        # Enforce RBAC
        if user_role == 'ADMIN' or user_id == 'admin':
            if org_id and org_id != 'null':
                emp_ids = Employee.objects.filter(organization_id=org_id).values_list('employeeId', flat=True)
                queryset = queryset.filter(employeeId__in=emp_ids)
        elif user_role in ['SR_MGR', 'HEAD']:
            if allowed_site_emp_codes is not None:
                queryset = queryset.filter(employeeId__in=allowed_site_emp_codes)
        elif user_role == 'MANAGER':
            team_codes = list(Employee.objects.filter(reportingManager=user_id).values_list('employeeId', flat=True))
            if allowed_site_emp_codes is not None:
                team_codes = [c for c in team_codes if c in allowed_site_emp_codes]
            try:
                emp = Employee.objects.get(id=user_id)
                allowed_ids = team_codes + [emp.employeeId]
                queryset = queryset.filter(employeeId__in=allowed_ids)
            except Employee.DoesNotExist:
                queryset = queryset.none()
        elif (user_role == 'SITE_ADMIN' or allowed_site_emp_codes is not None) and user_id:
            if allowed_site_emp_codes is not None:
                queryset = queryset.filter(employeeId__in=allowed_site_emp_codes)
            else:
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

class TrackingEntryViewSet(viewsets.ModelViewSet):
    queryset = TrackingEntry.objects.all()
    serializer_class = TrackingEntrySerializer

    def perform_create(self, serializer):
        instance = serializer.save()
        if instance.status == 'online':
            Alert.objects.create(
                type='travel_start',
                message=f"Employee {instance.employeeName} started tracking.",
                severity='low',
                relatedEntityId=instance.employeeId,
                relatedEntityType='employee'
            )

    def get_queryset(self):
        queryset = super().get_queryset()
        user_id = self.request.headers.get('X-User-Id')
        user_role = self.request.headers.get('X-User-Role')
        org_id = self.request.headers.get('X-Organization-Id')
        
        date = self.request.query_params.get('date')
        if date:
            queryset = queryset.filter(date=date)

        employee_id = self.request.query_params.get('employeeId')
        if employee_id:
            queryset = queryset.filter(employeeId=employee_id)

        ordering = self.request.query_params.get('ordering')
        if ordering:
            queryset = queryset.order_by(ordering)

        if user_role:
            user_role = user_role.upper()
            
        allowed_site_emp_codes = get_site_restricted_employee_codes(user_id, user_role)

        if user_role == 'ADMIN' or user_id == 'admin':
            if org_id and org_id != 'null':
                emp_ids = Employee.objects.filter(organization_id=org_id).values_list('employeeId', flat=True)
                queryset = queryset.filter(employeeId__in=emp_ids)
        elif user_role in ['SR_MGR', 'HEAD']:
            if org_id and org_id != 'null':
                emp_ids = Employee.objects.filter(organization_id=org_id)
                if allowed_site_emp_codes is not None:
                    emp_ids = emp_ids.filter(employeeId__in=allowed_site_emp_codes)
                emp_ids = emp_ids.values_list('employeeId', flat=True)
                queryset = queryset.filter(employeeId__in=emp_ids)
        elif user_role == 'MANAGER':
            team = Employee.objects.filter(reportingManager=user_id)
            if allowed_site_emp_codes is not None:
                team = team.filter(employeeId__in=allowed_site_emp_codes)
            team_codes = list(team.values_list('employeeId', flat=True)) + [user_id]
            queryset = queryset.filter(employeeId__in=team_codes)
        elif (user_role == 'SITE_ADMIN' or allowed_site_emp_codes is not None) and user_id:
            if allowed_site_emp_codes is not None:
                queryset = queryset.filter(employeeId__in=allowed_site_emp_codes)
            else:
                queryset = queryset.none()
        elif user_id:
            try:
                emp = Employee.objects.get(id=user_id)
                queryset = queryset.filter(employeeId=emp.employeeId)
            except Employee.DoesNotExist:
                queryset = queryset.none()
                
        limit = self.request.query_params.get('limit')
        if limit and limit.isdigit():
            queryset = queryset[:int(limit)]
            
        return queryset

    @action(detail=False, url_path='daily-tracking/(?P<employee_id>[^/.]+)')
    def daily_tracking(self, request, employee_id=None):
        date = request.query_params.get('date')
        if not date:
            return Response({"error": "Date is required"}, status=400)
            
        try:
            employee = Employee.objects.get(employeeId=employee_id)
            emp_name = employee.fullName
            emp_role = employee.designation
            emp_dept = employee.departmentId.departmentName if employee.departmentId else ""
        except Employee.DoesNotExist:
            employee = None
            emp_name = "Unknown Employee"
            emp_role = ""
            emp_dept = ""
            
        tasks = EmployeeTask.objects.filter(employeeId=employee_id, deadline=date)
        task_data = []
        
        total_distance = 0
        total_fuel = 0
        total_food = 0
        
        for t in tasks:
            total_distance += t.distance
            total_fuel += t.fuelExpense
            total_food += t.foodExpense
            task_data.append({
                "id": t.id,
                "taskName": t.taskTitle,
                "taskType": t.taskType,
                "startTime": t.startTime.strftime('%I:%M %p') if t.startTime else None,
                "endTime": t.endTime.strftime('%I:%M %p') if t.endTime else None,
                "status": t.status.title() if t.status else "Pending",
                "proofSubmitted": t.proofUploaded,
                "proofUrl": t.proofUrl,
                "notes": t.notes,
                "location": t.location,
                "coordinates": {"lat": t.latitude, "lng": t.longitude} if t.latitude and t.longitude else None,
                "distance": t.distance,
                "fuelExpense": t.fuelExpense,
                "foodExpense": t.foodExpense,
                "expenseStatus": t.expenseStatus,
            })
            
        fuel_receipts = []
        food_receipts = []
        
        # Pull receipts from tasks
        for t in tasks:
            if t.proofUrl and t.fuelExpense > 0:
                 fuel_receipts.append({"id": str(t.id) + "-fuel", "preview": t.proofUrl, "amount": t.fuelExpense, "vendor": t.taskTitle, "time": t.startTime.strftime('%I:%M %p') if t.startTime else ""})
            if t.proofUrl and t.foodExpense > 0:
                 food_receipts.append({"id": str(t.id) + "-food", "preview": t.proofUrl, "amount": t.foodExpense, "vendor": t.taskTitle, "time": t.startTime.strftime('%I:%M %p') if t.startTime else ""})
                 
        # Pull receipts from standalone TravelExpenses
        try:
            from datetime import datetime
            date_obj = datetime.strptime(date, '%Y-%m-%d').date()
            expenses = TravelExpense.objects.filter(employeeId=employee_id, timestamp__date=date_obj)
            for exp in expenses:
                if exp.type.lower() == 'fuel':
                    total_fuel += exp.amount
                    fuel_receipts.append({"id": str(exp.id), "preview": exp.photo, "amount": exp.amount, "vendor": "Direct Expense", "time": exp.timestamp.strftime('%I:%M %p')})
                elif exp.type.lower() == 'food':
                    total_food += exp.amount
                    food_receipts.append({"id": str(exp.id), "preview": exp.photo, "amount": exp.amount, "vendor": "Direct Expense", "time": exp.timestamp.strftime('%I:%M %p')})
        except Exception as e:
            pass
            
        tracking = None
        try:
            tracking = TrackingEntry.objects.filter(employeeId=employee_id, date=date).first()
            if tracking:
                check_in = tracking.checkInTime.strftime('%I:%M %p') if tracking.checkInTime else None
                check_out = tracking.checkOutTime.strftime('%I:%M %p') if tracking.checkOutTime else None
                curr_status = tracking.status.title() if tracking.status else "Offline"
                idle = tracking.idleTime
                pva = tracking.planVsActual
            else:
                check_in = None
                check_out = None
                curr_status = "Offline"
                idle = 0
                pva = 0
        except Exception:
            check_in = None
            check_out = None
            curr_status = "Offline"
            idle = 0
            pva = 0

        return Response({
            "employee": {
                "id": employee_id,
                "name": tracking.employeeName if tracking and tracking.employeeName else emp_name,
                "role": tracking.role if tracking and tracking.role else emp_role,
                "department": emp_dept,
                "checkInTime": check_in,
                "checkOutTime": check_out,
                "workMode": "Field",
                "currentStatus": curr_status,
                "currentLocation": {"lat": 22.7196, "lng": 75.8577, "address": "Current Location"} 
            },
            "tasks": task_data,
            "fuelReceipts": fuel_receipts,
            "foodReceipts": food_receipts,
            "metrics": {
                "totalDistance": total_distance,
                "idleTime": idle,
                "planVsActual": pva,
                "tasksCompleted": sum(1 for t in tasks if t.status == 'completed'),
                "totalTasks": len(tasks),
                "avgTaskDuration": 0,
                "punctualityScore": 100
            },
            "dailyExpenses": {
                "foodAllowance": 300,
                "totalFuelExpense": total_fuel,
                "totalFoodExpense": total_food,
                "miscExpense": 0,
                "totalExpense": total_fuel + total_food
            }
        })

class EmployeeTaskViewSet(viewsets.ModelViewSet):
    queryset = EmployeeTask.objects.all().order_by('-deadline')
    serializer_class = EmployeeTaskSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user_id = self.request.headers.get('X-User-Id')
        user_role = self.request.headers.get('X-User-Role')
        org_id = self.request.headers.get('X-Organization-Id')

        if user_role:
            user_role = user_role.upper()

        if user_role:
            user_role = user_role.upper()
            
        allowed_site_emp_codes = get_site_restricted_employee_codes(user_id, user_role)

        if user_role == 'ADMIN' or user_id == 'admin':
            if org_id and org_id != 'null':
                emp_ids = Employee.objects.filter(organization_id=org_id).values_list('employeeId', flat=True)
                queryset = queryset.filter(employeeId__in=emp_ids)
        elif user_role in ['SR_MGR', 'HEAD']:
            if allowed_site_emp_codes is not None:
                queryset = queryset.filter(employeeId__in=allowed_site_emp_codes)
        elif user_role == 'MANAGER' and user_id:
            try:
                mgr = Employee.objects.get(id=user_id)
                team_codes = list(Employee.objects.filter(reportingManager=user_id).values_list('employeeId', flat=True))
                if allowed_site_emp_codes is not None:
                    team_codes = [c for c in team_codes if c in allowed_site_emp_codes]
                team_codes.append(mgr.employeeId)
                queryset = queryset.filter(employeeId__in=team_codes)
            except Employee.DoesNotExist:
                queryset = queryset.none()
        elif (user_role == 'SITE_ADMIN' or allowed_site_emp_codes is not None) and user_id:
            if allowed_site_emp_codes is not None:
                queryset = queryset.filter(employeeId__in=allowed_site_emp_codes)
            else:
                queryset = queryset.none()
        elif user_id:
            try:
                emp = Employee.objects.get(id=user_id)
                queryset = queryset.filter(employeeId=emp.employeeId)
            except Employee.DoesNotExist:
                queryset = queryset.none()

        emp_id = self.request.query_params.get('employeeId')
        if emp_id:
            queryset = queryset.filter(employeeId=emp_id)
        return queryset

    @action(detail=True, methods=['post'])
    def approve_expense(self, request, pk=None):
        task = self.get_object()
        task.expenseStatus = 'approved'
        task.save()
        return Response({"status": "expense approved"})

    @action(detail=True, methods=['post'])
    def reject_expense(self, request, pk=None):
        task = self.get_object()
        task.expenseStatus = 'rejected'
        task.save()
        return Response({"status": "expense rejected"})

class AlertViewSet(viewsets.ModelViewSet):
    queryset = Alert.objects.all()
    serializer_class = AlertSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        org_id = self.request.headers.get('X-Organization-Id')
        from django.db.models import Q
        
        if org_id and org_id != 'null':
            emp_ids = Employee.objects.filter(organization_id=org_id).values_list('employeeId', flat=True)
            try:
                from inventory.models import ProductOrder
                order_ids = ProductOrder.objects.filter(organization_id=org_id).values_list('id', flat=True)
                queryset = queryset.filter(Q(relatedEntityId__in=emp_ids) | Q(relatedEntityId__in=order_ids) | Q(relatedEntityId__isnull=True) | Q(relatedEntityId=""))
            except Exception:
                queryset = queryset.filter(Q(relatedEntityId__in=emp_ids) | Q(relatedEntityId__isnull=True) | Q(relatedEntityId=""))
        else:
            queryset = queryset.filter(Q(relatedEntityId__isnull=True) | Q(relatedEntityId=""))
            
        return queryset

class AttendanceEntryViewSet(viewsets.ModelViewSet):
    queryset = AttendanceEntry.objects.all().order_by('-date')
    serializer_class = AttendanceEntrySerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user_id = self.request.headers.get('X-User-Id')
        user_role = self.request.headers.get('X-User-Role')
        org_id = self.request.headers.get('X-Organization-Id')

        if user_role:
            user_role = user_role.upper()

        if user_role:
            user_role = user_role.upper()
            
        allowed_site_emp_codes = get_site_restricted_employee_codes(user_id, user_role)

        if user_role == 'ADMIN' or user_id == 'admin':
            if org_id and org_id != 'null':
                emp_ids = Employee.objects.filter(organization_id=org_id).values_list('employeeId', flat=True)
                queryset = queryset.filter(employeeId__in=emp_ids)
        elif user_role in ['SR_MGR', 'HEAD']:
            if org_id and org_id != 'null':
                emp_codes = Employee.objects.filter(organization_id=org_id)
                if allowed_site_emp_codes is not None:
                    emp_codes = emp_codes.filter(employeeId__in=allowed_site_emp_codes)
                emp_codes = emp_codes.values_list('employeeId', flat=True)
                queryset = queryset.filter(employeeCode__in=emp_codes)
        elif user_role == 'MANAGER' and user_id:
            try:
                mgr = Employee.objects.get(id=user_id)
                team_codes = list(Employee.objects.filter(reportingManager=user_id).values_list('employeeId', flat=True))
                if allowed_site_emp_codes is not None:
                    team_codes = [c for c in team_codes if c in allowed_site_emp_codes]
                team_codes.append(mgr.employeeId)
                queryset = queryset.filter(employeeCode__in=team_codes)
            except Employee.DoesNotExist:
                queryset = queryset.none()
        elif (user_role == 'SITE_ADMIN' or allowed_site_emp_codes is not None) and user_id:
            if allowed_site_emp_codes is not None:
                queryset = queryset.filter(employeeCode__in=allowed_site_emp_codes)
            else:
                queryset = queryset.none()
        elif user_id:
            try:
                emp = Employee.objects.get(id=user_id)
                queryset = queryset.filter(employeeCode=emp.employeeId)
            except Employee.DoesNotExist:
                queryset = queryset.none()

        employee_id = self.request.query_params.get('employeeId')
        date = self.request.query_params.get('date')
        if employee_id:
            queryset = queryset.filter(employeeCode=employee_id)
        if date:
            queryset = queryset.filter(date=date)
        return queryset

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
        
        if user_role:
            user_role = user_role.upper()
            
        allowed_site_emp_codes = get_site_restricted_employee_codes(user_id, user_role)
        
        # Enforce RBAC
        if user_role == 'ADMIN' or user_id == 'admin':
            if org_id and org_id != 'null':
                emp_ids = Employee.objects.filter(organization_id=org_id).values_list('employeeId', flat=True)
                queryset = queryset.filter(employeeId__in=emp_ids)
        elif user_role in ['SR_MGR', 'HEAD']:
            if allowed_site_emp_codes is not None:
                queryset = queryset.filter(employeeId__in=allowed_site_emp_codes)
        elif user_role == 'MANAGER':
            team_codes = list(Employee.objects.filter(reportingManager=user_id).values_list('employeeId', flat=True))
            if allowed_site_emp_codes is not None:
                team_codes = [c for c in team_codes if c in allowed_site_emp_codes]
            try:
                emp = Employee.objects.get(id=user_id)
                allowed_ids = team_codes + [emp.employeeId]
                queryset = queryset.filter(employeeId__in=allowed_ids)
            except Employee.DoesNotExist:
                queryset = queryset.none()
        elif (user_role == 'SITE_ADMIN' or allowed_site_emp_codes is not None) and user_id:
            if allowed_site_emp_codes is not None:
                queryset = queryset.filter(employeeId__in=allowed_site_emp_codes)
            else:
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
        
        if user_role:
            user_role = user_role.upper()
            
        allowed_site_emp_codes = get_site_restricted_employee_codes(user_id, user_role)
        
        # Enforce RBAC
        if user_role == 'ADMIN' or user_id == 'admin':
            if org_id and org_id != 'null':
                emp_ids = Employee.objects.filter(organization_id=org_id).values_list('employeeId', flat=True)
                queryset = queryset.filter(employeeId__in=emp_ids)
        elif user_role in ['SR_MGR', 'HEAD']:
            if allowed_site_emp_codes is not None:
                queryset = queryset.filter(employeeId__in=allowed_site_emp_codes)
        elif user_role == 'MANAGER':
            team_codes = list(Employee.objects.filter(reportingManager=user_id).values_list('employeeId', flat=True))
            if allowed_site_emp_codes is not None:
                team_codes = [c for c in team_codes if c in allowed_site_emp_codes]
            try:
                emp = Employee.objects.get(id=user_id)
                allowed_ids = team_codes + [emp.employeeId]
                queryset = queryset.filter(employeeId__in=allowed_ids)
            except Employee.DoesNotExist:
                queryset = queryset.none()
        elif (user_role == 'SITE_ADMIN' or allowed_site_emp_codes is not None) and user_id:
            if allowed_site_emp_codes is not None:
                queryset = queryset.filter(employeeId__in=allowed_site_emp_codes)
            else:
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
        
        if user_role:
            user_role = user_role.upper()
            
        allowed_site_emp_codes = get_site_restricted_employee_codes(user_id, user_role)
        
        # Enforce RBAC
        if user_role == 'ADMIN' or user_id == 'admin':
            if org_id and org_id != 'null':
                emp_ids = Employee.objects.filter(organization_id=org_id).values_list('employeeId', flat=True)
                queryset = queryset.filter(employeeId__in=emp_ids)
        elif user_role in ['SR_MGR', 'HEAD']:
            if allowed_site_emp_codes is not None:
                queryset = queryset.filter(employeeId__in=allowed_site_emp_codes)
        elif user_role == 'MANAGER':
            team_codes = list(Employee.objects.filter(reportingManager=user_id).values_list('employeeId', flat=True))
            if allowed_site_emp_codes is not None:
                team_codes = [c for c in team_codes if c in allowed_site_emp_codes]
            try:
                emp = Employee.objects.get(id=user_id)
                allowed_ids = team_codes + [emp.employeeId]
                queryset = queryset.filter(employeeId__in=allowed_ids)
            except Employee.DoesNotExist:
                queryset = queryset.none()
        elif (user_role == 'SITE_ADMIN' or allowed_site_emp_codes is not None) and user_id:
            if allowed_site_emp_codes is not None:
                queryset = queryset.filter(employeeId__in=allowed_site_emp_codes)
            else:
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
        
        if user_role:
            user_role = user_role.upper()
            
        allowed_site_emp_codes = get_site_restricted_employee_codes(user_id, user_role)
        
        # Enforce RBAC
        if user_role == 'ADMIN' or user_id == 'admin':
            if org_id and org_id != 'null':
                emp_ids = Employee.objects.filter(organization_id=org_id).values_list('employeeId', flat=True)
                queryset = queryset.filter(employeeId__in=emp_ids)
        elif user_role in ['SR_MGR', 'HEAD']:
            if allowed_site_emp_codes is not None:
                queryset = queryset.filter(employeeId__in=allowed_site_emp_codes)
        elif user_role == 'MANAGER':
            team_codes = list(Employee.objects.filter(reportingManager=user_id).values_list('employeeId', flat=True))
            if allowed_site_emp_codes is not None:
                team_codes = [c for c in team_codes if c in allowed_site_emp_codes]
            try:
                emp = Employee.objects.get(id=user_id)
                allowed_ids = team_codes + [emp.employeeId]
                queryset = queryset.filter(employeeId__in=allowed_ids)
            except Employee.DoesNotExist:
                queryset = queryset.none()
        elif (user_role == 'SITE_ADMIN' or allowed_site_emp_codes is not None) and user_id:
            if allowed_site_emp_codes is not None:
                queryset = queryset.filter(employeeId__in=allowed_site_emp_codes)
            else:
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

