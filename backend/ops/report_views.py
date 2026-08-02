from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Sum, Avg, Q
from django.utils import timezone
import math

def haversine(lat1, lon1, lat2, lon2):
    if None in [lat1, lon1, lat2, lon2]: return 0.0
    try:
        lat1, lon1, lat2, lon2 = float(lat1), float(lon1), float(lat2), float(lon2)
        R = 6371  # Earth radius in kilometers
        dLat = math.radians(lat2 - lat1)
        dLon = math.radians(lon2 - lon1)
        a = math.sin(dLat/2) * math.sin(dLat/2) + math.cos(math.radians(lat1)) \
            * math.cos(math.radians(lat2)) * math.sin(dLon/2) * math.sin(dLon/2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        return round(R * c, 2)
    except:
        return 0.0

from core.models import Employee, Document
from ops.models import EmployeeTask, AttendanceEntry, TrackingEntry, GeoFenceAlert, Alert, LeaveBalance, PerformanceMetric, Meeting
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
        elif module == 'meeting-travel':
            from datetime import datetime
            
            emps = Employee.objects.filter(id=emp_id) if emp_id and emp_id != 'all' else Employee.objects.exclude(roleId__roleName__icontains='admin')
            
            total_kms_all = 0.0
            total_destinations_all = 0
            total_expense_all = 0.0
            
            def safe_float(v):
                try:
                    return float(v) if v else 0.0
                except (ValueError, TypeError):
                    return 0.0
            
            for emp in emps:
                meetings = Meeting.objects.filter(organizerId=emp.employeeId, status='completed')
                if from_date:
                    meetings = meetings.filter(date__gte=from_date)
                if to_date:
                    meetings = meetings.filter(date__lte=to_date)
                
                daily_allow = safe_float(emp.dailyAllowance)
                rate = safe_float(emp.perKmRate)
                date_daily_applied = set()
                
                for m in meetings:
                    date_str = m.date.strftime("%d/%m/%Y") if hasattr(m.date, 'strftime') else str(m.date)
                    
                    t_start = m.actualStartTime.strftime("%H:%M") if m.actualStartTime else ""
                    t_end = m.actualEndTime.strftime("%H:%M") if m.actualEndTime else ""
                    m_time = f"{t_start} - {t_end}" if t_start and t_end else (t_start or t_end or "N/A")
                    
                    meeting_name = m.title or "N/A"
                    station = m.endLocationName or m.location or "Unknown"
                    mode = m.vehicleType if m.vehicleType else (emp.vehicleType if emp.vehicleType != 'None' else "-")
                    
                    dist = safe_float(m.calculatedDistanceKms)
                    fuel = round(dist * rate, 2)
                    
                    m_local = 0.0
                    m_hotel = 0.0
                    m_other = 0.0
                    m_proofs = []
                    
                    if m.momData and isinstance(m.momData, dict) and 'expenses' in m.momData:
                        exp = m.momData['expenses']
                        m_local = safe_float(exp.get('local'))
                        m_hotel = safe_float(exp.get('hotel'))
                        m_other = safe_float(exp.get('other'))
                        if exp.get('localBill'): m_proofs.append({'type': 'Local Conveyance', 'url': exp.get('localBill')})
                        if exp.get('hotelBill'): m_proofs.append({'type': 'Hotel Expense', 'url': exp.get('hotelBill')})
                        if exp.get('otherBill'): m_proofs.append({'type': 'Other Expense', 'url': exp.get('otherBill')})
                            
                    m_daily = 0.0
                    if date_str not in date_daily_applied:
                        m_daily = daily_allow
                        date_daily_applied.add(date_str)
                        
                    total_rs = round(fuel + m_daily + m_local + m_hotel + m_other, 2)
                    
                    total_kms_all += dist
                    total_destinations_all += 1
                    total_expense_all += total_rs
                    
                    data.append({
                        "date": date_str,
                        "time": m_time,
                        "employee": emp.fullName,
                        "meetingName": meeting_name,
                        "station": station,
                        "mode": mode,
                        "rate": rate,
                        "kms": round(dist, 2),
                        "fuel": round(fuel, 2),
                        "daily": m_daily,
                        "local": m_local,
                        "hotel": m_hotel,
                        "other": m_other,
                        "total": total_rs,
                        "proofs": m_proofs
                    })
            
            summary = [
                {"label": "Total KMs", "value": f"{total_kms_all:.1f}", "trend": "", "icon": "Navigation"},
                {"label": "Destinations", "value": str(total_destinations_all), "trend": "", "icon": "MapPin"},
                {"label": "Total Expenses", "value": f"₹{total_expense_all:.2f}", "trend": "", "icon": "Activity"},
                {"label": "Employees Active", "value": str(emps.count()), "trend": "", "icon": "UserCheck"},
            ]

        return Response({"summary": summary, "data": data})
