from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid

# Helper to provide string UUIDs natively
def generate_uuid():
    return str(uuid.uuid4())

def generate_employee_id():
    return "PENDING"

class Organization(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    name = models.CharField(max_length=200)
    domain = models.CharField(max_length=100, blank=True, null=True)
    companyName = models.CharField(max_length=200, blank=True, null=True)
    entityName = models.CharField(max_length=200, blank=True, null=True)
    site = models.CharField(max_length=200, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    region = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    zone = models.CharField(max_length=100, blank=True, null=True)
    whiteLabel = models.BooleanField(default=False)
    subDomain = models.CharField(max_length=100, blank=True, null=True)
    solutionType = models.CharField(max_length=50, blank=True, null=True)
    solutionFor = models.CharField(max_length=50, blank=True, null=True)
    billingTerm = models.CharField(max_length=50, blank=True, null=True)
    modulesEnabled = models.JSONField(default=list, blank=True)
    is_deleted = models.BooleanField(default=False)
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Site(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, null=True, blank=True, related_name="sites")
    name = models.CharField(max_length=200)
    siteCode = models.CharField(max_length=100, blank=True, null=True)
    productType = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    activateDate = models.DateField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    region = models.CharField(max_length=100, blank=True, null=True)
    contactName = models.CharField(max_length=200, blank=True, null=True)
    contactEmail = models.EmailField(blank=True, null=True)
    contactPhone = models.CharField(max_length=20, blank=True, null=True)
    modulesEnabled = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=50, default='Active')
    is_deleted = models.BooleanField(default=False)
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Territory(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=200)
    region = models.CharField(max_length=100) # North, South, East, West
    district = models.CharField(max_length=100, blank=True, null=True)
    assignedSalesExecutiveId = models.CharField(max_length=50, blank=True, null=True) # Could be FK to Employee
    coverageArea = models.CharField(max_length=200, blank=True, null=True)
    geoFencing = models.BooleanField(default=False)
    geoFencingRadius = models.IntegerField(default=500)
    status = models.CharField(max_length=50, default='Active')
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Role(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    roleName = models.CharField(max_length=100)
    roleCode = models.CharField(max_length=50)
    ROLE_TYPES = (('Management', 'Management'), ('Execution', 'Execution'))
    roleType = models.CharField(max_length=50, choices=ROLE_TYPES)
    defaultDashboard = models.CharField(max_length=100, blank=True, default='')
    rolePriority = models.IntegerField()
    activeStatus = models.BooleanField(default=True)
    visibleKpis = models.JSONField(default=list, blank=True)

    class Meta:
        unique_together = ('roleCode', 'organization')

    def __str__(self):
        return self.roleName

class Department(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    departmentName = models.CharField(max_length=100)
    departmentCode = models.CharField(max_length=50, blank=True, default="")
    parentDepartmentId = models.CharField(max_length=50, blank=True, null=True)
    departmentHeadId = models.CharField(max_length=50, blank=True, null=True)
    trackingEnabled = models.BooleanField(default=False)
    kpiCategory = models.JSONField(default=list, blank=True)
    activeStatus = models.BooleanField(default=True)

    class Meta:
        unique_together = ('departmentCode', 'organization')

    def save(self, *args, **kwargs):
        if not self.departmentCode:
            if not self.departmentName:
                prefix = "DEPT"
            else:
                words = self.departmentName.strip().upper().split()
                if len(words) == 1:
                    prefix = self.departmentName.strip().upper()[:3]
                else:
                    prefix = "".join(word[0] for word in words)[:3]
            
            existing_codes = Department.objects.filter(
                organization=self.organization, 
                departmentCode__startswith=prefix
            ).values_list('departmentCode', flat=True)
            
            max_num = 0
            for code in existing_codes:
                suffix = code[len(prefix):]
                if suffix.isdigit():
                    max_num = max(max_num, int(suffix))
            
            self.departmentCode = f"{prefix}{str(max_num + 1).zfill(3)}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.departmentName

class StatusMaster(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    statusName = models.CharField(max_length=100)
    tracking = models.BooleanField(default=False)
    VISIBILITY_CHOICES = (('All', 'All'), ('Manager Only', 'Manager Only'), ('Admin Only', 'Admin Only'))
    visibility = models.CharField(max_length=50, choices=VISIBILITY_CHOICES)
    activeStatus = models.BooleanField(default=True)

    def __str__(self):
        return self.statusName

class Employee(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    employeeId = models.CharField(max_length=50, blank=True, default="")
    fullName = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    mobileNumber = models.CharField(max_length=20)
    password = models.CharField(max_length=128)
    profilePhoto = models.TextField(blank=True, null=True)
    roleId = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True)
    departmentId = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True)
    siteId = models.ForeignKey(Site, on_delete=models.SET_NULL, null=True, blank=True, related_name='primary_employees')
    accessibleSites = models.ManyToManyField(Site, related_name='site_admins', blank=True)
    designation = models.CharField(max_length=100)
    reportingManager = models.CharField(max_length=50, blank=True, null=True)
    region = models.CharField(max_length=100, blank=True, null=True)
    EMPLOYMENT_TYPES = (('Full-time', 'Full-time'), ('Contract', 'Contract'), ('Intern', 'Intern'))
    employmentType = models.CharField(max_length=50, choices=EMPLOYMENT_TYPES)
    WORK_MODES = (('Field', 'Field'), ('Office', 'Office'), ('Hybrid', 'Hybrid'))
    workMode = models.CharField(max_length=50, choices=WORK_MODES)
    joiningDate = models.DateField()
    trackingEnabled = models.BooleanField(default=False)
    attendanceRequired = models.BooleanField(default=True)
    taskAssignmentAllowed = models.BooleanField(default=True)
    statusId = models.ForeignKey(StatusMaster, on_delete=models.SET_NULL, null=True)
    accountStatus = models.BooleanField(default=True)

    class Meta:
        unique_together = ('employeeId', 'organization')

    def save(self, *args, **kwargs):
        if not self.employeeId or self.employeeId == "PENDING" or self.employeeId.startswith('EMP-'):
            existing_ids = Employee.objects.filter(
                organization=self.organization, 
                employeeId__startswith='EMP'
            ).values_list('employeeId', flat=True)
            
            max_num = 0
            for eid in existing_ids:
                # e.g., EMP0001 -> suffix is 0001
                suffix = eid[3:]
                if suffix.isdigit():
                    max_num = max(max_num, int(suffix))
            
            self.employeeId = f"EMP{str(max_num + 1).zfill(4)}"
            
        super().save(*args, **kwargs)

    def __str__(self):
        return self.fullName

class RolePermission(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
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
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
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
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
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
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
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
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
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
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    title = models.CharField(max_length=200)
    fileUrl = models.TextField() # Can store base64 or a URL
    uploadedBy = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='documents')
    uploadDate = models.DateTimeField(auto_now_add=True)
    fileType = models.CharField(max_length=50, blank=True, null=True) # e.g., pdf, image, doc
    status = models.CharField(max_length=50, default='Pending') # Pending, Valid, Expired, Rejected
    relatedDistributorId = models.CharField(max_length=50, blank=True, null=True) # ID from crm.Distributor

    def __str__(self):
        return self.title

class PermissionRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    requester = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='requests_made')
    approver = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='requests_to_approve')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=50, default='Pending') # Pending, Approved, Rejected
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.requester.fullName}"

class RouteAnalytics(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    start_location = models.CharField(max_length=255)
    end_location = models.CharField(max_length=255)
    distance_km = models.FloatField()
    time_taken_mins = models.FloatField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.start_location} to {self.end_location} ({self.time_taken_mins} mins)"
