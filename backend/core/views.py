from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Role, Department, StatusMaster, Project, Employee, RolePermission, ReportingManager
from .serializers import (
    RoleSerializer, DepartmentSerializer, StatusMasterSerializer, 
    ProjectSerializer, EmployeeSerializer, RolePermissionSerializer,
    ReportingManagerSerializer
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

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer

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
        
        # In a production app, we would hash passwords, but currently they are stored in plaintext
        employee = Employee.objects.filter(email=email, password=password).first()
        
        if not employee:
            # Fallback for hardcoded admin login
            if email == "admin@example.com" and password == "Admin@123":
                return Response({
                    "id": "admin",
                    "fullName": "System Admin",
                    "email": email,
                    "roleCode": "ADMIN",
                    "departmentId": "admin"
                })
            return Response({"error": "Invalid username or password"}, status=status.HTTP_401_UNAUTHORIZED)
            
        if not employee.accountStatus:
            return Response({"error": "Account is disabled. Please contact administrator."}, status=status.HTTP_403_FORBIDDEN)
            
        roleCode = employee.roleId.roleCode if employee.roleId else "NONE"
        
        return Response({
            "id": employee.id,
            "fullName": employee.fullName,
            "email": employee.email,
            "roleCode": roleCode,
            "departmentId": employee.departmentId.id if employee.departmentId else None
        })
