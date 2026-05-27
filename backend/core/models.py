from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid

# Helper to provide string UUIDs natively
def generate_uuid():
    return str(uuid.uuid4())

class Role(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    roleName = models.CharField(max_length=100)
    roleCode = models.CharField(max_length=50, unique=True)
    ROLE_TYPES = (('Management', 'Management'), ('Execution', 'Execution'))
    roleType = models.CharField(max_length=50, choices=ROLE_TYPES)
    defaultDashboard = models.CharField(max_length=100)
    rolePriority = models.IntegerField()
    activeStatus = models.BooleanField(default=True)

    def __str__(self):
        return self.roleName

class Department(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    departmentName = models.CharField(max_length=100)
    departmentCode = models.CharField(max_length=50, unique=True)
    parentDepartmentId = models.CharField(max_length=50, blank=True, null=True)
    departmentHeadId = models.CharField(max_length=50, blank=True, null=True)
    trackingEnabled = models.BooleanField(default=False)
    # Storing array of strings as comma-separated or JSON could work; using JSONField for simplicity
    kpiCategory = models.JSONField(default=list, blank=True)
    activeStatus = models.BooleanField(default=True)

    def __str__(self):
        return self.departmentName

class StatusMaster(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    statusName = models.CharField(max_length=100)
    tracking = models.BooleanField(default=False)
    VISIBILITY_CHOICES = (('All', 'All'), ('Manager Only', 'Manager Only'), ('Admin Only', 'Admin Only'))
    visibility = models.CharField(max_length=50, choices=VISIBILITY_CHOICES)
    activeStatus = models.BooleanField(default=True)

    def __str__(self):
        return self.statusName

class Project(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    name = models.CharField(max_length=200)
    opsManager = models.CharField(max_length=50) # Assuming ID mapping
    STATUS_CHOICES = (('active', 'active'), ('pending', 'pending'), ('completed', 'completed'), ('delayed', 'delayed'))
    status = models.CharField(max_length=50, choices=STATUS_CHOICES)
    progress = models.IntegerField(default=0)
    tasksCompleted = models.IntegerField(default=0)
    totalTasks = models.IntegerField(default=0)
    nextMilestone = models.CharField(max_length=200)
    dueDate = models.DateField()

    def __str__(self):
        return self.name

class Employee(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    employeeId = models.CharField(max_length=50, unique=True)
    fullName = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    mobileNumber = models.CharField(max_length=20)
    password = models.CharField(max_length=128)
    profilePhoto = models.URLField(blank=True, null=True)
    roleId = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True)
    departmentId = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True)
    designation = models.CharField(max_length=100)
    reportingManager = models.CharField(max_length=50, blank=True, null=True)
    EMPLOYMENT_TYPES = (('Full-time', 'Full-time'), ('Contract', 'Contract'))
    employmentType = models.CharField(max_length=50, choices=EMPLOYMENT_TYPES)
    WORK_MODES = (('Field', 'Field'), ('Office', 'Office'), ('Hybrid', 'Hybrid'))
    workMode = models.CharField(max_length=50, choices=WORK_MODES)
    joiningDate = models.DateField()
    trackingEnabled = models.BooleanField(default=False)
    attendanceRequired = models.BooleanField(default=True)
    taskAssignmentAllowed = models.BooleanField(default=True)
    statusId = models.ForeignKey(StatusMaster, on_delete=models.SET_NULL, null=True)
    accountStatus = models.BooleanField(default=True)

    def __str__(self):
        return self.fullName

class RolePermission(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    roleId = models.ForeignKey(Role, on_delete=models.CASCADE)
    roleName = models.CharField(max_length=100)
    module = models.CharField(max_length=100)
    view = models.BooleanField(default=False)
    create = models.BooleanField(default=False)
    edit = models.BooleanField(default=False)
    delete = models.BooleanField(default=False)
    approve = models.BooleanField(default=False)
    export = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.roleName} - {self.module}"


class ReportingManager(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    employeeId = models.CharField(max_length=50) # Links to Employee ID string (employee being mapped)
    employeeName = models.CharField(max_length=200)
    managerId = models.CharField(max_length=50) # Links to Employee ID string (manager)
    managerName = models.CharField(max_length=200)
    REPORTING_TYPES = (('Direct', 'Direct'), ('Dotted', 'Dotted'))
    reportingType = models.CharField(max_length=50, choices=REPORTING_TYPES)
    effectiveFrom = models.CharField(max_length=50)
    effectiveTo = models.CharField(max_length=50, blank=True, null=True)
    VISIBILITY_CHOICES = (('Team', 'Team'), ('Department', 'Department'))
    visibilityScope = models.CharField(max_length=50, choices=VISIBILITY_CHOICES)
    overrideAccess = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.employeeName} -> {self.managerName}"

