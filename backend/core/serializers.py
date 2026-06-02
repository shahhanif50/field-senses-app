from rest_framework import serializers
from .models import Role, Department, StatusMaster, Project, Employee, RolePermission, ReportingManager, RegistrationRequest, Task, Document, PermissionRequest

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = '__all__'

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'

class StatusMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = StatusMaster
        fields = '__all__'

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = '__all__'

class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = '__all__'

class RolePermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RolePermission
        fields = '__all__'

class ReportingManagerSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportingManager
        fields = '__all__'

class RegistrationRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegistrationRequest
        fields = '__all__'

class ProjectSerializer(serializers.ModelSerializer):
    assignedEmployeeNames = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = '__all__'

    def get_assignedEmployeeNames(self, obj):
        return ", ".join(emp.fullName for emp in obj.assignedEmployees.all())

class TaskSerializer(serializers.ModelSerializer):
    projectName = serializers.CharField(source='project.name', read_only=True)
    assignedEmployeeNames = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = '__all__'

    def get_assignedEmployeeNames(self, obj):
        return ", ".join(emp.fullName for emp in obj.assignedEmployees.all())

class DocumentSerializer(serializers.ModelSerializer):
    uploadedByName = serializers.CharField(source='uploadedBy.fullName', read_only=True)

    class Meta:
        model = Document
        fields = '__all__'

class PermissionRequestSerializer(serializers.ModelSerializer):
    requesterName = serializers.CharField(source='requester.fullName', read_only=True)
    approverName = serializers.CharField(source='approver.fullName', read_only=True)

    class Meta:
        model = PermissionRequest
        fields = '__all__'
