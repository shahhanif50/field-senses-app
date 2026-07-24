from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
import json
from datetime import datetime
from .models import (
    Meeting, TrackingEntry, EmployeeTask, Alert, AttendanceEntry,
    GeoFenceAlert, LeaveBalance, PerformanceMetric, EmployeeWallet,
    WithdrawalRequest, LeaveRequest, Message, TravelExpense, RegularizationRequest, VehicleConfig
)
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
    EmployeeWalletSerializer, WithdrawalRequestSerializer, LeaveRequestSerializer, MessageSerializer, TravelExpenseSerializer, RegularizationRequestSerializer, VehicleConfigSerializer
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
        actual_user_id = user_id
        if user_id and user_id != 'admin':
            try:
                emp = Employee.objects.get(id=user_id)
                actual_user_id = emp.employeeId
                admin_site_ids = list(emp.accessibleSites.values_list("id", flat=True))
                if user_role == 'SITE_ADMIN' and emp.siteId:
                    admin_site_ids.append(emp.siteId.id)
            except Employee.DoesNotExist:
                pass

        if user_role == 'ADMIN' or user_id == 'admin':
            if org_id and org_id != 'null':
                emp_ids = Employee.objects.filter(organization_id=org_id).values_list('employeeId', flat=True)
                from django.db.models import Q
                q_obj = Q()
                for eid in emp_ids:
                    q_obj |= Q(organizerId=eid) | Q(attendees__icontains=eid)
                queryset = queryset.filter(q_obj).distinct()
        elif user_role in ['SR_MGR', 'HEAD']:
            if org_id and org_id != 'null':
                org_emp_ids = Employee.objects.filter(organization_id=org_id)
                if admin_site_ids:
                    org_emp_ids = org_emp_ids.filter(siteId__in=admin_site_ids)
                org_emp_ids = org_emp_ids.values_list('employeeId', flat=True)
                from django.db.models import Q
                q_obj = Q(organizerId=actual_user_id) | Q(attendees__icontains=actual_user_id)
                for oid in org_emp_ids:
                    q_obj |= Q(organizerId=oid) | Q(attendees__icontains=oid)
                queryset = queryset.filter(q_obj).distinct()
        elif user_role == 'MANAGER' and user_id:
            team = Employee.objects.filter(reportingManager=user_id)
            if admin_site_ids:
                team = team.filter(siteId__in=admin_site_ids)
            team_ids = team.values_list('employeeId', flat=True)
            from django.db.models import Q
            q_obj = Q(organizerId=actual_user_id) | Q(attendees__icontains=actual_user_id)
            for tid in team_ids:
                q_obj |= Q(organizerId=tid) | Q(attendees__icontains=tid)
            queryset = queryset.filter(q_obj).distinct()
        elif (user_role == 'SITE_ADMIN' or admin_site_ids) and user_id:
            if admin_site_ids:
                site_emp_ids = Employee.objects.filter(siteId__in=admin_site_ids).values_list("employeeId", flat=True)
                from django.db.models import Q
                q_obj = Q(organizerId=actual_user_id) | Q(attendees__icontains=actual_user_id)
                for sid in site_emp_ids:
                    q_obj |= Q(organizerId=sid) | Q(attendees__icontains=sid)
                queryset = queryset.filter(q_obj).distinct()
            else:
                queryset = queryset.none()
        elif user_id:
            from django.db.models import Q
            queryset = queryset.filter(Q(organizerId=actual_user_id) | Q(attendees__icontains=actual_user_id)).distinct()
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
        org_id = self.request.headers.get('X-Organization-Id')
        
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

    @action(detail=True, methods=['patch'], url_path='sync-route')
    def sync_route(self, request, pk=None):
        try:
            tracking = self.get_object()
            new_route = request.data.get('routePath', [])
            if new_route:
                if not isinstance(tracking.routePath, list):
                    tracking.routePath = []
                # Validate the incoming route coordinates
                valid_coords = []
                for pt in new_route:
                    if isinstance(pt, list) and len(pt) == 2:
                        valid_coords.append(pt)
                tracking.routePath.extend(valid_coords)
                tracking.save()
            return Response({'status': 'success'})
        except Exception as e:
            return Response({'error': str(e)}, status=400)

    @action(detail=False, url_path='daily-tracking/(?P<employee_id>[^/.]+)')
    def daily_tracking(self, request, employee_id=None):
        date = request.query_params.get('date')
        if not date:
            return Response({"error": "Date is required"}, status=400)
            
        # Try to find employee by employeeId code first, then by UUID
        employee = None
        emp_uuid = employee_id
        emp_code = employee_id
        try:
            employee = Employee.objects.filter(employeeId=employee_id).first()
            emp_uuid = str(employee.id)
            emp_code = employee.employeeId
            emp_name = employee.fullName
            emp_role = employee.designation
            emp_dept = employee.departmentId.departmentName if employee.departmentId else ""
        except Employee.DoesNotExist:
            try:
                employee = Employee.objects.get(id=employee_id)
                emp_uuid = str(employee.id)
                emp_code = employee.employeeId
                emp_name = employee.fullName
                emp_role = employee.designation
                emp_dept = employee.departmentId.departmentName if employee.departmentId else ""
            except Employee.DoesNotExist:
                employee = None
                emp_name = "Unknown Employee"
                emp_role = ""
                emp_dept = ""

        from django.db.models import Q
        # Search tasks by both code AND uuid, for the specific date
        tasks = EmployeeTask.objects.filter(
            Q(employeeId=emp_code) | Q(employeeId=emp_uuid),
            deadline=date
        )
        
        # If no tasks found for exact date, fetch the most recent tasks (up to 20)
        if not tasks.exists():
            tasks = EmployeeTask.objects.filter(
                Q(employeeId=emp_code) | Q(employeeId=emp_uuid)
            ).order_by('-deadline', '-assignedDate')[:20]

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
            expenses = TravelExpense.objects.filter(
                Q(employeeId=emp_code) | Q(employeeId=emp_uuid),
                timestamp__date=date_obj
            )
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
            tracking = TrackingEntry.objects.filter(
                Q(employeeId=emp_code) | Q(employeeId=emp_uuid)
            ).filter(date=date).first()
            if not tracking:
                tracking = TrackingEntry.objects.filter(
                    Q(employeeId=emp_code) | Q(employeeId=emp_uuid)
                ).order_by('-date').first()
                
            attendance = AttendanceEntry.objects.filter(
                Q(employeeCode=emp_code) | Q(employeeCode=emp_uuid)
            ).filter(date=date).first()
            
            check_in_loc = None
            check_out_loc = None
            check_in_photo = None
            check_out_photo = None
            
            if attendance:
                check_in = attendance.actualCheckIn or (tracking.checkInTime.strftime('%I:%M %p') if tracking and tracking.checkInTime else None)
                check_out = attendance.actualCheckOut or (tracking.checkOutTime.strftime('%I:%M %p') if tracking and tracking.checkOutTime else None)
                check_in_photo = attendance.checkInPhoto or (tracking.checkInPhoto if tracking else None)
                check_out_photo = attendance.checkOutPhoto or (tracking.checkOutPhoto if tracking else None)
                curr_status = "Completed" if check_out else tracking.status.title() if tracking and tracking.status else "Offline"
                
                check_in_loc = None
                if attendance.checkInLocationLat and attendance.checkInLocationLng:
                    check_in_loc = f"{attendance.checkInLocationLat},{attendance.checkInLocationLng}"
                
                check_out_loc = None
                if attendance.checkOutLocationLat and attendance.checkOutLocationLng:
                    check_out_loc = f"{attendance.checkOutLocationLat},{attendance.checkOutLocationLng}"
            elif tracking:
                check_in = tracking.checkInTime.strftime('%I:%M %p') if tracking.checkInTime else None
                check_out = tracking.checkOutTime.strftime('%I:%M %p') if tracking.checkOutTime else None
                check_in_photo = tracking.checkInPhoto
                check_out_photo = tracking.checkOutPhoto
                curr_status = tracking.status.title() if tracking.status else "Offline"
            else:
                check_in = None
                check_out = None
                curr_status = "Offline"
                
            idle = tracking.idleTime if tracking else 0
            pva = tracking.planVsActual if tracking else 0
            
        except Exception:
            check_in = None
            check_out = None
            check_in_loc = None
            check_out_loc = None
            check_in_photo = None
            check_out_photo = None
            curr_status = "Offline"
            idle = 0
            pva = 0

        tasks_list = list(tasks)
        return Response({
            "employee": {
                "id": employee_id,
                "name": tracking.employeeName if tracking and tracking.employeeName else emp_name,
                "role": tracking.role if tracking and tracking.role else emp_role,
                "department": emp_dept,
                "checkInTime": check_in,
                "checkOutTime": check_out,
                "checkInLocation": check_in_loc,
                "checkOutLocation": check_out_loc,
                "checkInPhoto": check_in_photo,
                "checkOutPhoto": check_out_photo,
                "workMode": "Field",
                "currentStatus": curr_status,
                "currentLocation": {"lat": 22.7196, "lng": 75.8577, "address": "Current Location"} 
            },
            "tasks": task_data,
            "fuelReceipts": fuel_receipts,
            "foodReceipts": food_receipts,
            "routePath": tracking.routePath if tracking else [],
            "metrics": {
                "totalDistance": total_distance,
                "idleTime": idle,
                "planVsActual": pva,
                "tasksCompleted": sum(1 for t in tasks_list if t.status == 'completed'),
                "totalTasks": len(tasks_list),
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
    queryset = Alert.objects.all().order_by('-timestamp')
    serializer_class = AlertSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        org_id = self.request.headers.get('X-Organization-Id')
        user_id = self.request.headers.get('X-User-Id')
        user_role = self.request.headers.get('X-User-Role')
        org_id = self.request.headers.get('X-Organization-Id')
        
        if user_role:
            user_role = user_role.upper()
            
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
            
        if user_role == 'ADMIN' or user_id == 'admin':
            pass
        else:
            allowed_site_emp_codes = get_site_restricted_employee_codes(user_id, user_role)
            allowed_ids = []
            
            if user_role in ['SR_MGR', 'HEAD']:
                if allowed_site_emp_codes is not None:
                    allowed_ids = allowed_site_emp_codes
            elif user_role == 'MANAGER':
                team_codes = list(Employee.objects.filter(reportingManager=user_id).values_list('employeeId', flat=True))
                if allowed_site_emp_codes is not None:
                    team_codes = [c for c in team_codes if c in allowed_site_emp_codes]
                try:
                    emp = Employee.objects.get(id=user_id)
                    allowed_ids = team_codes + [emp.employeeId]
                except Employee.DoesNotExist:
                    pass
            elif (user_role == 'SITE_ADMIN' or allowed_site_emp_codes is not None) and user_id:
                if allowed_site_emp_codes is not None:
                    allowed_ids = allowed_site_emp_codes
            elif user_id:
                try:
                    emp = Employee.objects.get(id=user_id)
                    allowed_ids = [emp.employeeId]
                except Employee.DoesNotExist:
                    pass
                    
            if allowed_ids:
                queryset = queryset.filter(Q(relatedEntityId__in=allowed_ids) | Q(relatedEntityId__isnull=True) | Q(relatedEntityId=""))
            else:
                queryset = queryset.filter(Q(relatedEntityId__isnull=True) | Q(relatedEntityId=""))
                
        return queryset

class AttendanceEntryViewSet(viewsets.ModelViewSet):
    queryset = AttendanceEntry.objects.all().order_by('-date')
    serializer_class = AttendanceEntrySerializer

    def perform_create(self, serializer):
        instance = serializer.save()
        from .models import Alert
        Alert.objects.create(
            type='tracking_update',
            message=f"Employee {instance.employeeName} checked in.",
            severity='medium',
            relatedEntityId=instance.employeeCode,
            relatedEntityType='employee'
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        from .models import Alert
        Alert.objects.create(
            type='tracking_update',
            message=f"Employee {instance.employeeName} checked out.",
            severity='low',
            relatedEntityId=instance.employeeCode,
            relatedEntityType='employee'
        )

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
                queryset = queryset.filter(employeeCode__in=emp_ids)
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
        org_id = self.request.headers.get('X-Organization-Id')
        
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
        org_id = self.request.headers.get('X-Organization-Id')
        
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
        org_id = self.request.headers.get('X-Organization-Id')
        
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

    def perform_create(self, serializer):
        instance = serializer.save()
        from .models import Alert
        Alert.objects.create(
            type='pending_approval',
            message=f"Leave request submitted by {instance.employeeName}.",
            severity='medium',
            relatedEntityId=instance.employeeId,
            relatedEntityType='employee'
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        from .models import Alert
        Alert.objects.create(
            type='tracking_update',
            message=f"Leave request for {instance.employeeName} was {instance.status}.",
            severity='low',
            relatedEntityId=instance.employeeId,
            relatedEntityType='employee'
        )

    def get_queryset(self):
        queryset = super().get_queryset()
        user_id = self.request.headers.get('X-User-Id')
        user_role = self.request.headers.get('X-User-Role')
        org_id = self.request.headers.get('X-Organization-Id')
        
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
        user_role = self.request.headers.get('X-User-Role')
        org_id = self.request.headers.get('X-Organization-Id')
        
        if user_role:
            user_role = user_role.upper()
        
        from django.db.models import Q
        
        if user_id and user_id != 'admin':
            role_groups = ['all']
            if user_role:
                role_groups.append(user_role.lower())
                
            queryset = queryset.filter(
                Q(senderId=user_id) | 
                Q(receiverId=user_id) | 
                Q(groupName__in=role_groups)
            )
            
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


class RegularizationRequestViewSet(viewsets.ModelViewSet):
    queryset = RegularizationRequest.objects.all().order_by('-timestamp')
    serializer_class = RegularizationRequestSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        employeeId = self.request.query_params.get('employeeId')
        status = self.request.query_params.get('status')
        if employeeId:
            queryset = queryset.filter(employeeId=employeeId)
        if status:
            queryset = queryset.filter(status=status)
        return queryset

    def perform_update(self, serializer):
        instance = serializer.save()
        if instance.status == 'Approved':
            try:
                from .models import Employee, AttendanceEntry
                from datetime import datetime
                emp = Employee.objects.get(employeeId=instance.employeeId)
                att = AttendanceEntry.objects.filter(employeeName=emp.fullName, date=instance.date).first()
                if att:
                    if instance.type == 'Check In':
                        att.actualCheckIn = instance.requestedTime
                    elif instance.type == 'Check Out':
                        att.actualCheckOut = instance.requestedTime
                    elif instance.type == 'Both':
                        times = instance.requestedTime.split(' - ')
                        if len(times) == 2:
                            att.actualCheckIn = times[0].strip()
                            att.actualCheckOut = times[1].strip()
                    
                    if att.actualCheckIn and att.actualCheckOut:
                        try:
                            fmt = "%I:%M %p"
                            in_time = datetime.strptime(att.actualCheckIn, fmt)
                            out_time = datetime.strptime(att.actualCheckOut, fmt)
                            diff = (out_time - in_time).total_seconds() / 3600.0
                            if diff < 0:
                                diff += 24.0
                            att.totalHoursWorked = round(diff, 2)
                        except Exception:
                            pass
                    att.save()
            except Exception as e:
                print(f"Error updating attendance entry on regularization: {e}")

class VehicleConfigViewSet(viewsets.ModelViewSet):
    queryset = VehicleConfig.objects.all()
    serializer_class = VehicleConfigSerializer

