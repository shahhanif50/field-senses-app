from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid

# Helper to provide string UUIDs natively
def generate_uuid():
    return str(uuid.uuid4())

def generate_employee_id():
    """Generate a unique employee ID using a UUID-based approach."""
    import re
    # Find the maximum numeric suffix among EMP-XXXX style IDs
    max_num = 1000
    try:
        for emp in Employee.objects.all():
            eid = emp.employeeId or ''
            # Match patterns like EMP-1001, EMP001, EMP-3, etc.
            match = re.search(r'(\d+)$', eid)
            if match:
                num = int(match.group(1))
                if num > max_num:
                    max_num = num
    except Exception:
        pass
    # Ensure uniqueness by checking the generated ID doesn't already exist
    candidate = f'EMP-{max_num + 1}'
    while Employee.objects.filter(employeeId=candidate).exists():
        max_num += 1
        candidate = f'EMP-{max_num + 1}'
    return candidate

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

class Employee(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    employeeId = models.CharField(max_length=50, unique=True, default=generate_employee_id)
    fullName = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    mobileNumber = models.CharField(max_length=20)
    password = models.CharField(max_length=128)
    profilePhoto = models.TextField(blank=True, null=True)
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
    employeeId = models.CharField(max_length=50)
    employeeName = models.CharField(max_length=200)
    managerId = models.CharField(max_length=50)
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

class RegistrationRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    fullName = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    mobileNumber = models.CharField(max_length=20)
    password = models.CharField(max_length=128)
    status = models.CharField(max_length=50, default='pending') # pending, approved, rejected
    createdAt = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.fullName} ({self.email})"

class Project(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=50, default='Active') # Active, Completed, On Hold
    PROJECT_TYPES = (('Group', 'Group'), ('Individual', 'Individual'))
    projectType = models.CharField(max_length=50, choices=PROJECT_TYPES, default='Group')
    startDate = models.DateField(blank=True, null=True)
    endDate = models.DateField(blank=True, null=True)
    assignedEmployees = models.ManyToManyField(Employee, related_name='projects', blank=True)
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Task(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=50, default='Pending') # Pending, In Progress, Done
    dueDate = models.DateField(blank=True, null=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks', null=True, blank=True)
    assignedEmployees = models.ManyToManyField(Employee, related_name='tasks', blank=True)
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class Document(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    fileUrl = models.TextField() # Can store base64 or a URL
    uploadedBy = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='documents')
    uploadDate = models.DateTimeField(auto_now_add=True)
    fileType = models.CharField(max_length=50, blank=True, null=True) # e.g., pdf, image, doc
    status = models.CharField(max_length=50, default='Valid') # Valid, Expiring Soon, Expired

    def __str__(self):
        return self.title

class PermissionRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    requester = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='requests_made')
    approver = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='requests_to_approve')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=50, default='Pending') # Pending, Approved, Rejected
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.requester.fullName}"
