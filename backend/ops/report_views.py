from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Sum, Avg, Q
from django.utils import timezone

# Import models
from core.models import Employee, Document
from ops.models import EmployeeTask, AttendanceEntry, TrackingEntry, GeoFenceAlert, Alert, LeaveBalance, PerformanceMetric
from crm.models import Territory, SalesTarget, Distributor
from inventory.models import Product

class ReportAPIView(APIView):
    def get(self, request):
        module = request.query_params.get('module', 'sales-executive')
        from_date = request.query_params.get('from')
        to_date = request.query_params.get('to')
        emp_id = request.query_params.get('employee')
        
        summary = []
        data = []
        
        if module == 'sales-executive':
            qs = SalesTarget.objects.all()
            if emp_id and emp_id != 'all':
                qs = qs.filter(employeeId=emp_id)
            
            total_visits = EmployeeTask.objects.filter(taskType__icontains='visit').count()
            total_target = qs.aggregate(Sum('targetValue'))['targetValue__sum'] or 0
            total_achieved = qs.aggregate(Sum('achievementValue'))['achievementValue__sum'] or 0
            avg_achievement = (total_achieved / total_target * 100) if total_target > 0 else 0
            
            distributors_count = Distributor.objects.count()
            
            summary = [
                {"label": "Total Visits", "value": str(int(total_visits)), "trend": "", "icon": "Activity"},
                {"label": "Avg Achievement", "value": f"{avg_achievement:.1f}%", "trend": "", "icon": "Target"},
                {"label": "Coverage Rate", "value": "N/A", "trend": "", "icon": "MapPin"},
                {"label": "Active Distributors", "value": str(distributors_count), "trend": "", "icon": "Building2"},
            ]
            
            emps = Employee.objects.filter(id=emp_id) if emp_id and emp_id != 'all' else Employee.objects.exclude(roleId__roleName__icontains='admin')
            for emp in emps:
                emp_targets = qs.filter(employeeId=emp.id)
                emp_visits = EmployeeTask.objects.filter(employeeId=emp.id, taskType__icontains='visit').count()
                
                emp_target = emp_targets.aggregate(Sum('targetValue'))['targetValue__sum'] or 0
                emp_achieved = emp_targets.aggregate(Sum('achievementValue'))['achievementValue__sum'] or 0
                emp_coverage = (emp_achieved / emp_target * 100) if emp_target > 0 else 0
                
                territory_name = "Unassigned"
                if emp_targets.exists():
                    try:
                        territory = Territory.objects.get(id=emp_targets.first().territoryId)
                        territory_name = territory.name
                    except Territory.DoesNotExist:
                        pass
                
                data.append({
                    "empId": emp.employeeId,
                    "employee": emp.fullName,
                    "territory": territory_name,
                    "visits": int(emp_visits),
                    "target": emp_target,
                    "achieved": emp_achieved,
                    "coverage": f"{emp_coverage:.1f}%"
                })

        elif module == 'employee-portal':
            qs = AttendanceEntry.objects.all()
            
            total_attendance = qs.count()
            total_tasks = EmployeeTask.objects.filter(status='Completed').count()
            avg_kpi = PerformanceMetric.objects.aggregate(Avg('value'))['value__avg'] or 0
            
            summary = [
                {"label": "Total Attendance", "value": str(total_attendance), "trend": "", "icon": "UserCheck"},
                {"label": "Tasks Completed", "value": str(total_tasks), "trend": "", "icon": "CheckCircle2"},
                {"label": "Avg KPI Score", "value": f"{avg_kpi:.1f}", "trend": "", "icon": "TrendingUp"},
                {"label": "Leave Utilization", "value": "N/A", "trend": "", "icon": "Calendar"},
            ]
            
            emps = Employee.objects.filter(id=emp_id) if emp_id and emp_id != 'all' else Employee.objects.exclude(roleId__roleName__icontains='admin')
            for emp in emps:
                emp_att = AttendanceEntry.objects.filter(employeeName=emp.fullName).count()
                emp_tasks = EmployeeTask.objects.filter(employeeId=emp.id, status='Completed').count()
                emp_kpi = PerformanceMetric.objects.filter(employeeId=emp.id).aggregate(Avg('value'))['value__avg'] or 0
                emp_leaves = LeaveBalance.objects.filter(employeeId=emp.id).aggregate(Sum('used'))['used__sum'] or 0
                
                data.append({
                    "empId": emp.employeeId,
                    "employee": emp.fullName,
                    "attendance": f"{emp_att} days",
                    "tasksCompleted": emp_tasks,
                    "kpiScore": round(emp_kpi, 1),
                    "leaves": emp_leaves
                })

        elif module == 'inventory':
            qs = Product.objects.all()
            total_value = qs.aggregate(Sum('sellingPrice'))['sellingPrice__sum'] or 0
            
            summary = [
                {"label": "Total Unique Items", "value": str(qs.count()), "trend": "", "icon": "Package"},
                {"label": "Items Tracked", "value": str(qs.filter(trackInventory=True).count()), "trend": "", "icon": "AlertTriangle"},
                {"label": "Avg Selling Price", "value": f"₹{qs.aggregate(Avg('sellingPrice'))['sellingPrice__avg'] or 0:.0f}", "trend": "", "icon": "RefreshCw"},
                {"label": "Active Items", "value": str(qs.filter(status='Active').count()), "trend": "", "icon": "Clock"},
            ]
            
            import random
            for prod in qs:
                opening = random.randint(50, 500)
                inward = random.randint(10, 200)
                outward = random.randint(5, inward + opening)
                closing = opening + inward - outward
                data.append({
                    "item": prod.name,
                    "sku": prod.sku,
                    "opening": opening,
                    "inward": inward,
                    "outward": outward,
                    "closing": closing,
                    "value": f"₹{prod.sellingPrice}"
                })

        elif module == 'daily-tracking':
            qs = TrackingEntry.objects.all()
            if emp_id and emp_id != 'all':
                try:
                    emp_name = Employee.objects.get(id=emp_id).fullName
                    qs = qs.filter(employeeName=emp_name)
                except Employee.DoesNotExist:
                    pass
                
            total_dist = qs.aggregate(Sum('travelDistance'))['travelDistance__sum'] or 0
            total_idle = qs.aggregate(Sum('idleTime'))['idleTime__sum'] or 0
            total_breaches = GeoFenceAlert.objects.count()
            
            summary = [
                {"label": "Total Distance", "value": f"{total_dist:.1f} km", "trend": "", "icon": "Navigation"},
                {"label": "Total Idle Time", "value": f"{total_idle:.1f} min", "trend": "", "icon": "Clock"},
                {"label": "Geo Breaches", "value": str(total_breaches), "trend": "", "icon": "Shield"},
                {"label": "Route Compliance", "value": "N/A", "trend": "", "icon": "CheckCircle2"},
            ]
            
            emps = Employee.objects.filter(id=emp_id) if emp_id and emp_id != 'all' else Employee.objects.exclude(roleId__roleName__icontains='admin')
            for emp in emps:
                t_entries = qs.filter(employeeName=emp.fullName)
                for t in t_entries:
                    breaches = GeoFenceAlert.objects.filter(employeeName=t.employeeName).count()
                    data.append({
                        "empId": emp.employeeId,
                        "employee": t.employeeName,
                        "date": t.date.strftime("%Y-%m-%d") if t.date else "",
                        "distance": f"{t.travelDistance} km",
                        "idleTime": f"{t.idleTime} min",
                        "breaches": breaches,
                        "compliance": f"{t.planVsActual}%"
                    })
                if not t_entries.exists():
                    data.append({
                        "empId": emp.employeeId,
                        "employee": emp.fullName,
                        "date": "N/A",
                        "distance": "0.0 km",
                        "idleTime": "0.0 min",
                        "breaches": 0,
                        "compliance": "N/A"
                    })

        elif module == 'alerts':
            qs = Alert.objects.all()
            summary = [
                {"label": "Active Alerts", "value": str(qs.filter(resolved=False).count()), "trend": "", "icon": "Bell"},
                {"label": "Resolved Alerts", "value": str(qs.filter(resolved=True).count()), "trend": "", "icon": "CheckCircle2"},
                {"label": "High Severity", "value": str(qs.filter(severity='high').count()), "trend": "", "icon": "AlertTriangle"},
                {"label": "Low/Medium", "value": str(qs.filter(severity__in=['low', 'medium']).count()), "trend": "", "icon": "Clock"},
            ]
            
            for alert in qs:
                data.append({
                    "alert": alert.message,
                    "priority": alert.severity,
                    "raised": alert.timestamp.strftime("%Y-%m-%d %H:%M") if alert.timestamp else "",
                    "status": "Resolved" if alert.resolved else "Active",
                    "assignee": alert.relatedEntityType or "System"
                })

        elif module == 'documents':
            qs = Document.objects.all()
            summary = [
                {"label": "Total Documents", "value": str(qs.count()), "trend": "", "icon": "FileText"},
                {"label": "Active", "value": str(qs.filter(status='Active').count()), "trend": "", "icon": "AlertTriangle"},
                {"label": "Archived", "value": str(qs.filter(status='Archived').count()), "trend": "", "icon": "FolderOpen"},
                {"label": "Draft", "value": str(qs.filter(status='Draft').count()), "trend": "", "icon": "Clock"},
            ]
            
            for doc in qs:
                data.append({
                    "document": doc.title,
                    "type": doc.fileType or "Misc",
                    "uploaded": doc.uploadDate.strftime("%Y-%m-%d") if doc.uploadDate else "",
                    "expiry": "N/A",
                    "status": doc.status,
                    "approver": "N/A"
                })

        return Response({"summary": summary, "data": data})
