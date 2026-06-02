from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from .models import Role, Department, StatusMaster, Project, Employee, RolePermission, ReportingManager, RegistrationRequest, Task, Document, PermissionRequest
from .serializers import (
    RoleSerializer, DepartmentSerializer, StatusMasterSerializer, 
    ProjectSerializer, EmployeeSerializer, RolePermissionSerializer,
    ReportingManagerSerializer, RegistrationRequestSerializer, TaskSerializer, DocumentSerializer, PermissionRequestSerializer
)

class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

class StatusMasterViewSet(viewsets.ModelViewSet):
    queryset = StatusMaster.objects.all()
    serializer_class = StatusMasterSerializer

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user_id = self.request.headers.get('X-User-Id')
        user_role = self.request.headers.get('X-User-Role')
        
        if user_role == 'ADMIN' or user_id == 'admin':
            return queryset
        elif user_role == 'MANAGER':
            return queryset.filter(Q(id=user_id) | Q(reportingManager=user_id))
        elif user_id:
            return queryset.filter(id=user_id)
            
        return queryset

class RolePermissionViewSet(viewsets.ModelViewSet):
    queryset = RolePermission.objects.all()
    serializer_class = RolePermissionSerializer

class ReportingManagerViewSet(viewsets.ModelViewSet):
    queryset = ReportingManager.objects.all()
    serializer_class = ReportingManagerSerializer

class LoginView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        employee = Employee.objects.filter(email=email, password=password).first()
        
        if not employee:
            if email == "admin@example.com" and password == "Admin@123":
                return Response({
                    "id": "admin",
                    "fullName": "System Admin",
                    "email": email,
                    "roleCode": "ADMIN",
                    "departmentId": "admin",
                    "employeeId": "admin",
                    "profilePhoto": None
                })
            return Response({"error": "Invalid username or password"}, status=status.HTTP_401_UNAUTHORIZED)
            
        if not employee.accountStatus:
            return Response({"error": "Account is disabled. Please contact administrator."}, status=status.HTTP_403_FORBIDDEN)
            
        roleCode = employee.roleId.roleCode if employee.roleId else "NONE"
        
        return Response({
            "id": employee.id,
            "employeeId": employee.employeeId,
            "fullName": employee.fullName,
            "email": employee.email,
            "roleCode": roleCode,
            "departmentId": employee.departmentId.id if employee.departmentId else None,
            "profilePhoto": employee.profilePhoto
        })

class RegistrationRequestViewSet(viewsets.ModelViewSet):
    queryset = RegistrationRequest.objects.all()
    serializer_class = RegistrationRequestSerializer

    def create(self, request, *args, **kwargs):
        email = request.data.get('email')
        if email:
            existing = RegistrationRequest.objects.filter(email=email).first()
            if existing and existing.status == 'rejected':
                existing.delete()
        return super().create(request, *args, **kwargs)

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user_id = self.request.headers.get('X-User-Id')
        user_role = self.request.headers.get('X-User-Role')
        
        if user_role == 'ADMIN' or user_id == 'admin':
            pass
        elif user_role == 'MANAGER':
            team_ids = Employee.objects.filter(reportingManager=user_id).values_list('id', flat=True)
            queryset = queryset.filter(Q(assignedEmployees__id=user_id) | Q(assignedEmployees__id__in=team_ids)).distinct()
        elif user_id:
            queryset = queryset.filter(assignedEmployees__id=user_id).distinct()

        employeeId = self.request.query_params.get('employeeId')
        if employeeId:
            queryset = queryset.filter(assignedEmployees__id=employeeId).distinct()
        return queryset

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user_id = self.request.headers.get('X-User-Id')
        user_role = self.request.headers.get('X-User-Role')

        if user_role == 'ADMIN' or user_id == 'admin':
            pass
        elif user_role == 'MANAGER':
            team_ids = Employee.objects.filter(reportingManager=user_id).values_list('id', flat=True)
            queryset = queryset.filter(Q(assignedEmployees__id=user_id) | Q(assignedEmployees__id__in=team_ids)).distinct()
        elif user_id:
            queryset = queryset.filter(assignedEmployees__id=user_id).distinct()

        employeeId = self.request.query_params.get('employeeId')
        if employeeId:
            queryset = queryset.filter(assignedEmployees__id=employeeId).distinct()
        
        projectId = self.request.query_params.get('projectId')
        if projectId:
            queryset = queryset.filter(project__id=projectId)
        
        return queryset

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user_id = self.request.headers.get('X-User-Id')
        user_role = self.request.headers.get('X-User-Role')

        if user_role == 'ADMIN' or user_id == 'admin':
            pass
        elif user_role == 'MANAGER':
            team_ids = Employee.objects.filter(reportingManager=user_id).values_list('id', flat=True)
            queryset = queryset.filter(Q(uploadedBy__id=user_id) | Q(uploadedBy__id__in=team_ids))
        elif user_id:
            queryset = queryset.filter(uploadedBy__id=user_id)

        employeeId = self.request.query_params.get('employeeId')
        if employeeId:
            queryset = queryset.filter(uploadedBy__id=employeeId)
        return queryset

class PermissionRequestViewSet(viewsets.ModelViewSet):
    queryset = PermissionRequest.objects.all()
    serializer_class = PermissionRequestSerializer

    def perform_create(self, serializer):
        requester_id = self.request.data.get('requester')
        if requester_id:
            try:
                emp = Employee.objects.get(id=requester_id)
                if emp.reportingManager:
                    # reportingManager is string ID of the manager employee
                    try:
                        manager = Employee.objects.get(id=emp.reportingManager)
                        serializer.save(approver=manager)
                        return
                    except Employee.DoesNotExist:
                        pass
            except Employee.DoesNotExist:
                pass
        serializer.save()

    def get_queryset(self):
        queryset = super().get_queryset()
        user_id = self.request.headers.get('X-User-Id')
        user_role = self.request.headers.get('X-User-Role')

        if user_role == 'ADMIN' or user_id == 'admin':
            pass
        elif user_role == 'MANAGER':
            # Manager sees requests they made and requests to them
            queryset = queryset.filter(Q(requester__id=user_id) | Q(approver__id=user_id))
        elif user_id:
            # Employee sees only their own requests
            queryset = queryset.filter(requester__id=user_id)

        return queryset
