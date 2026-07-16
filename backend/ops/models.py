from django.db import models
from core.models import generate_uuid, Employee

class Meeting(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    title = models.CharField(max_length=200)
    TYPE_CHOICES = (('internal', 'internal'), ('client', 'client'), ('sales', 'sales'), ('follow-up', 'follow-up'))
    type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    date = models.DateField()
    startTime = models.TimeField()
    endTime = models.TimeField()
    organizer = models.CharField(max_length=200)
    organizerId = models.CharField(max_length=50) # Link to Employee ID
    attendees = models.JSONField(default=list) # Array of {id, name, type}
    externalGuests = models.JSONField(default=list) # Array of strings
    location = models.CharField(max_length=200)
    MODE_CHOICES = (('in-person', 'in-person'), ('online', 'online'), ('hybrid', 'hybrid'))
    mode = models.CharField(max_length=50, choices=MODE_CHOICES)
    meetingLink = models.URLField(blank=True, null=True)
    agenda = models.TextField()
    notes = models.TextField(blank=True, null=True)
    attachments = models.JSONField(default=list)
    REMINDER_CHOICES = (('15min', '15min'), ('30min', '30min'), ('1hour', '1hour'), ('none', 'none'))
    reminder = models.CharField(max_length=50, choices=REMINDER_CHOICES)
    RECURRING_CHOICES = (('none', 'none'), ('daily', 'daily'), ('weekly', 'weekly'), ('monthly', 'monthly'))
    recurring = models.CharField(max_length=50, choices=RECURRING_CHOICES)
    PRIORITY_CHOICES = (('low', 'low'), ('medium', 'medium'), ('high', 'high'))
    priority = models.CharField(max_length=50, choices=PRIORITY_CHOICES)
    approvalRequired = models.BooleanField(default=False)
    STATUS_CHOICES = (('scheduled', 'scheduled'), ('in-progress', 'in-progress'), ('completed', 'completed'), ('cancelled', 'cancelled'), ('rescheduled', 'rescheduled'))
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='scheduled')
    isActive = models.BooleanField(default=True)
    
    actualStartTime = models.DateTimeField(blank=True, null=True)
    actualEndTime = models.DateTimeField(blank=True, null=True)
    startLocationLat = models.FloatField(blank=True, null=True)
    startLocationLng = models.FloatField(blank=True, null=True)
    endLocationLat = models.FloatField(blank=True, null=True)
    endLocationLng = models.FloatField(blank=True, null=True)
    startPhoto = models.TextField(blank=True, null=True)
    endPhoto = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.title

class TrackingEntry(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    employeeId = models.CharField(max_length=50) # Link to Employee ID
    employeeName = models.CharField(max_length=200)
    role = models.CharField(max_length=100)
    currentLocation = models.CharField(max_length=200)
    checkInTime = models.DateTimeField()
    checkOutTime = models.DateTimeField(blank=True, null=True)
    travelDistance = models.FloatField(default=0)
    idleTime = models.FloatField(default=0)
    planVsActual = models.FloatField(default=0)
    purpose = models.TextField(blank=True)
    clientVisits = models.JSONField(default=list, blank=True)
    plannedRouteSummary = models.JSONField(default=list, blank=True)
    routePath = models.JSONField(default=list, blank=True)
    vehicleType = models.CharField(max_length=50, blank=True, null=True)
    reimbursementAmount = models.FloatField(default=0)
    timeSpentOnSite = models.FloatField(default=0)
    STATUS_CHOICES = (('online', 'online'), ('offline', 'offline'), ('idle', 'idle'), ('completed', 'completed'))
    status = models.CharField(max_length=50, choices=STATUS_CHOICES)
    date = models.DateField()
    
    # New Fields for Camera
    checkInPhoto = models.TextField(blank=True, null=True)
    checkOutPhoto = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.employeeName} - {self.date}"

class EmployeeTask(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    employeeId = models.CharField(max_length=50) # Link to Employee ID
    taskTitle = models.CharField(max_length=200)
    description = models.TextField()
    assignedDate = models.DateField()
    deadline = models.DateField()
    STATUS_CHOICES = (('pending', 'pending'), ('in-progress', 'in-progress'), ('completed', 'completed'), ('overdue', 'overdue'))
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending')
    completionPercent = models.IntegerField(default=0)
    proofUploaded = models.BooleanField(default=False)
    proofUrl = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    assignedBy = models.CharField(max_length=50) # Link to Employee ID
    
    # New Fields for tracking
    distance = models.FloatField(default=0)
    fuelExpense = models.FloatField(default=0)
    foodExpense = models.FloatField(default=0)
    EXPENSE_STATUS_CHOICES = (('pending', 'pending'), ('approved', 'approved'), ('rejected', 'rejected'))
    expenseStatus = models.CharField(max_length=50, choices=EXPENSE_STATUS_CHOICES, default='pending')
    location = models.CharField(max_length=200, blank=True, null=True)
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)
    startTime = models.TimeField(blank=True, null=True)
    endTime = models.TimeField(blank=True, null=True)
    taskType = models.CharField(max_length=50, default='Visit')

    def __str__(self):
        return self.taskTitle

class Alert(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    TYPE_CHOICES = (
        ('low_achievement', 'low_achievement'), ('inactive_gps', 'inactive_gps'), 
        ('pending_approval', 'pending_approval'), ('compliance', 'compliance'), 
        ('license_expiry', 'license_expiry'), ('stock_low', 'stock_low'),
        ('tracking_update', 'tracking_update'),
        ('new_order', 'new_order'), ('travel_start', 'travel_start'),
        ('expense_approval', 'expense_approval'), ('new_employee', 'new_employee')
    )
    type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    SEVERITY_CHOICES = (('high', 'high'), ('medium', 'medium'), ('low', 'low'))
    severity = models.CharField(max_length=50, choices=SEVERITY_CHOICES)
    resolved = models.BooleanField(default=False)
    relatedEntityId = models.CharField(max_length=50, blank=True, null=True)
    ENTITY_TYPES = (
        ('employee', 'employee'), ('distributor', 'distributor'), 
        ('product', 'product'), ('territory', 'territory'), ('meeting', 'meeting')
    )
    relatedEntityType = models.CharField(max_length=50, choices=ENTITY_TYPES, blank=True, null=True)

    def __str__(self):
        return f"{self.type} - {self.severity}"

class AttendanceEntry(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    employeeName = models.CharField(max_length=200)
    employeeCode = models.CharField(max_length=50)
    designation = models.CharField(max_length=100)
    date = models.DateField()
    scheduledShift = models.CharField(max_length=100)
    actualCheckIn = models.CharField(max_length=50, blank=True, null=True) # string format time
    actualCheckOut = models.CharField(max_length=50, blank=True, null=True)
    lateArrival = models.IntegerField(default=0) # minutes
    earlyExit = models.IntegerField(default=0) # minutes
    totalHoursWorked = models.FloatField(default=0)
    STATUS_CHOICES = (('present', 'present'), ('absent', 'absent'), ('on-leave', 'on-leave'), ('half-day', 'half-day'))
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='present')
    
    # New Fields for Camera and Location
    checkInPhoto = models.TextField(blank=True, null=True)
    checkOutPhoto = models.TextField(blank=True, null=True)
    checkInLocationLat = models.FloatField(blank=True, null=True)
    checkInLocationLng = models.FloatField(blank=True, null=True)
    checkOutLocationLat = models.FloatField(blank=True, null=True)
    checkOutLocationLng = models.FloatField(blank=True, null=True)

    def __str__(self):
        return f"{self.employeeName} - {self.date}"

class GeoFenceAlert(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    employeeName = models.CharField(max_length=200)
    employeeCode = models.CharField(max_length=50)
    designation = models.CharField(max_length=100)
    currentLocation = models.CharField(max_length=200)
    assignedZone = models.CharField(max_length=200)
    TYPE_CHOICES = (
        ('zone-exit', 'zone-exit'), ('idle-breach', 'idle-breach'), 
        ('restricted-entry', 'restricted-entry'), ('boundary-violation', 'boundary-violation')
    )
    alertType = models.CharField(max_length=50, choices=TYPE_CHOICES)
    alertTime = models.CharField(max_length=50, blank=True, null=True)
    idleDuration = models.IntegerField(default=0)
    planVsActual = models.FloatField(default=0)
    STATUS_CHOICES = (('online', 'online'), ('idle', 'idle'), ('offline', 'offline'))
    status = models.CharField(max_length=50, choices=STATUS_CHOICES)
    PRIORITY_CHOICES = (('low', 'low'), ('medium', 'medium'), ('high', 'high'))
    priority = models.CharField(max_length=50, choices=PRIORITY_CHOICES)
    resolved = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.employeeName} - {self.alertType}"

class LeaveBalance(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    employeeId = models.CharField(max_length=50)
    type = models.CharField(max_length=100) # "Annual Leave", "Sick Leave"
    total = models.IntegerField(default=0)
    used = models.IntegerField(default=0)
    available = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.type} - {self.employeeId}"

class PerformanceMetric(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    employeeId = models.CharField(max_length=50)
    metricName = models.CharField(max_length=100)
    value = models.FloatField(default=0)
    target = models.FloatField(default=0)
    period = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.metricName} - {self.employeeId}"

class EmployeeWallet(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    employeeId = models.CharField(max_length=50, unique=True)
    balance = models.FloatField(default=0)
    totalEarned = models.FloatField(default=0)
    totalWithdrawn = models.FloatField(default=0)

    def __str__(self):
        return f"Wallet for {self.employeeId} - Balance: {self.balance}"

class WithdrawalRequest(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    employeeId = models.CharField(max_length=50)
    amount = models.FloatField(default=0)
    STATUS_CHOICES = (('pending', 'pending'), ('approved', 'approved'), ('rejected', 'rejected'))
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending')
    requestDate = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Withdrawal {self.amount} for {self.employeeId} - {self.status}"

class LeaveRequest(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    employeeId = models.CharField(max_length=50)
    leaveType = models.CharField(max_length=100) # 'Sick Leave', 'Paid Leave', 'Unpaid Leave'
    startDate = models.DateField()
    endDate = models.DateField()
    reason = models.TextField()
    STATUS_CHOICES = (('pending', 'pending'), ('approved', 'approved'), ('rejected', 'rejected'))
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending')
    requestDate = models.DateTimeField(auto_now_add=True)
    managerId = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f"{self.leaveType} for {self.employeeId} - {self.status}"

class Message(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    senderId = models.CharField(max_length=50)
    receiverId = models.CharField(max_length=50, blank=True, null=True) # null if group message
    groupName = models.CharField(max_length=100, blank=True, null=True) # e.g., 'all', 'managers'
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    readBy = models.JSONField(default=list, blank=True) # List of objects: [{userId: "...", readAt: "..."}]
    
    def __str__(self):
        return f"From {self.senderId} at {self.timestamp}"

class TravelExpense(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    employeeId = models.CharField(max_length=50)
    employeeName = models.CharField(max_length=200)
    type = models.CharField(max_length=100)
    amount = models.FloatField(default=0)
    photo = models.TextField(blank=True, null=True) # Will hold base64 string
    STATUS_CHOICES = (('pending', 'pending'), ('approved', 'approved'), ('rejected', 'rejected'))
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending')
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Expense: {self.employeeName} - {self.amount}"
