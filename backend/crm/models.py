from django.db import models
from core.models import generate_uuid, Employee

class Distributor(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    distributorId = models.CharField(max_length=50, unique=True)
    firmName = models.CharField(max_length=200)
    proprietorName = models.CharField(max_length=200)
    mobileNumber = models.CharField(max_length=20)
    emailAddress = models.EmailField()
    panProprietor = models.CharField(max_length=50)
    panFirm = models.CharField(max_length=50)
    gstNumber = models.CharField(max_length=50)
    dateOfBirth = models.DateField()
    marriageAnniversary = models.DateField(blank=True, null=True)
    officeAddress = models.TextField()
    currentAddress = models.TextField()
    permanentAddress = models.TextField()
    district = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=20)
    
    FIRM_TYPES = (
        ('Sole Proprietor', 'Sole Proprietor'), 
        ('Partnership', 'Partnership'), 
        ('Pvt Ltd', 'Pvt Ltd'), 
        ('Co-Op Society', 'Co-Op Society')
    )
    typeOfFirm = models.CharField(max_length=50, choices=FIRM_TYPES)
    distributorProfile = models.JSONField(default=dict) # { wholesalerPercent: 60, retailerPercent: 40 }
    yearsOfEstablishment = models.IntegerField()
    yearsOfExperience = models.IntegerField()
    topCompaniesAssociated = models.JSONField(default=list) # Array of objects
    
    pesticideLicenseNo = models.CharField(max_length=100, blank=True, null=True)
    seedLicenseNo = models.CharField(max_length=100, blank=True, null=True)
    fertiliserLicenseNo = models.CharField(max_length=100, blank=True, null=True)
    pesticideLicenseExpiry = models.DateField(blank=True, null=True)
    seedLicenseExpiry = models.DateField(blank=True, null=True)
    fertiliserLicenseExpiry = models.DateField(blank=True, null=True)
    
    godownSpace = models.IntegerField(default=0)
    shopSpace = models.IntegerField(default=0)
    housePropertyOwned = models.BooleanField(default=False)
    computerAvailable = models.BooleanField(default=False)
    internetAvailable = models.BooleanField(default=False)
    deliveryVehicles = models.IntegerField(default=0)
    salesmenAvailable = models.IntegerField(default=0)
    
    bankName = models.CharField(max_length=200)
    accountNumber = models.CharField(max_length=100)
    ACCOUNT_TYPES = (('Saving', 'Saving'), ('Current', 'Current'))
    accountType = models.CharField(max_length=50, choices=ACCOUNT_TYPES)
    bankLimitCC = models.FloatField(default=0)
    otherLoans = models.CharField(max_length=200, blank=True, null=True)
    totalFundsEmployed = models.FloatField(default=0)
    ownInvestment = models.FloatField(default=0)
    
    preferredTransporters = models.JSONField(default=list) # Array of strings
    depotLocation = models.CharField(max_length=200)
    attachedRetailersList = models.TextField(blank=True, null=True)
    numberOfRetailers = models.IntegerField(default=0)
    
    declarationAccepted = models.BooleanField(default=False)
    proprietorSignature = models.TextField(blank=True, null=True)
    witnessDetails = models.JSONField(default=dict) # { name, address, mobile }
    submittedBy = models.JSONField(default=dict)
    forwardedBy = models.JSONField(default=dict)
    approvedBy = models.JSONField(default=dict)
    
    governmentDocuments = models.JSONField(default=list)
    activeStatus = models.BooleanField(default=True)

    def __str__(self):
        return self.firmName

class Territory(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    name = models.CharField(max_length=200)
    REGION_CHOICES = (('North', 'North'), ('South', 'South'), ('East', 'East'), ('West', 'West'))
    region = models.CharField(max_length=50, choices=REGION_CHOICES)
    district = models.CharField(max_length=100)
    assignedSalesExecutiveId = models.CharField(max_length=50, blank=True, null=True) # Linking to Employee ID string
    linkedDistributorIds = models.JSONField(default=list) # Array of strings
    coverageArea = models.CharField(max_length=100)
    geoFencing = models.BooleanField(default=False)
    geoFencingRadius = models.IntegerField(default=500)
    STATUS_CHOICES = (('Active', 'Active'), ('Inactive', 'Inactive'))
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Active')

    def __str__(self):
        return self.name

class SalesExecutive(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    employeeId = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='sales_profile')
    fullName = models.CharField(max_length=200)
    ROLE_CHOICES = (('Sales Executive', 'Sales Executive'), ('Territory Manager', 'Territory Manager'), ('Regional Manager', 'Regional Manager'))
    role = models.CharField(max_length=100, choices=ROLE_CHOICES)
    DEPT_CHOICES = (('Sales', 'Sales'), ('Marketing', 'Marketing'), ('Logistics', 'Logistics'))
    department = models.CharField(max_length=100, choices=DEPT_CHOICES)
    reportingManagerId = models.CharField(max_length=50, blank=True, null=True)
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    gpsTracking = models.BooleanField(default=False)
    WORK_MODES = (('Field', 'Field'), ('Hybrid', 'Hybrid'), ('Office', 'Office'))
    workMode = models.CharField(max_length=50, choices=WORK_MODES)
    STATUS_CHOICES = (('Active', 'Active'), ('Inactive', 'Inactive'), ('On Leave', 'On Leave'))
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Active')
    assignedTerritoryIds = models.JSONField(default=list)

    def __str__(self):
        return self.fullName

class SalesTarget(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    employeeId = models.CharField(max_length=50) # Link to Employee ID
    territoryId = models.CharField(max_length=50) # Link to Territory ID
    PRODUCT_CATS = (('Fertiliser', 'Fertiliser'), ('Seed', 'Seed'), ('Chemical', 'Chemical'))
    productCategory = models.CharField(max_length=50, choices=PRODUCT_CATS)
    targetValue = models.FloatField()
    achievementValue = models.FloatField(default=0)
    siteVisits = models.IntegerField(default=0)
    feedbackScore = models.FloatField(default=0)
    pendingApprovals = models.IntegerField(default=0)
    remarks = models.TextField(blank=True, null=True)
    period = models.CharField(max_length=50) # e.g. 2024-Q1

    def __str__(self):
        return f"{self.period} - {self.productCategory}"

class DistributorLink(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    distributorId = models.ForeignKey(Distributor, on_delete=models.CASCADE)
    firmName = models.CharField(max_length=200)
    assignedTerritoryId = models.CharField(max_length=50)
    assignedSalesExecutiveIds = models.JSONField(default=list)
    seedLicense = models.BooleanField(default=False)
    seedLicenseNumber = models.CharField(max_length=100, blank=True, null=True)
    seedLicenseExpiry = models.DateField(blank=True, null=True)
    fertiliserLicense = models.BooleanField(default=False)
    fertiliserLicenseNumber = models.CharField(max_length=100, blank=True, null=True)
    fertiliserLicenseExpiry = models.DateField(blank=True, null=True)
    pesticideLicense = models.BooleanField(default=False)
    pesticideLicenseNumber = models.CharField(max_length=100, blank=True, null=True)
    pesticideLicenseExpiry = models.DateField(blank=True, null=True)
    retailerNetworkCount = models.IntegerField(default=0)
    retailers = models.JSONField(default=list)
    godownSpace = models.IntegerField(default=0)
    shopSpace = models.IntegerField(default=0)
    vehicleCount = models.IntegerField(default=0)
    hasComputer = models.BooleanField(default=False)
    hasInternet = models.BooleanField(default=False)
    STATUS_CHOICES = (
        ('Submitted', 'Submitted'), ('Forwarded', 'Forwarded'), 
        ('Approved', 'Approved'), ('Rejected', 'Rejected'), 
        ('Active', 'Active'), ('Inactive', 'Inactive')
    )
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Submitted')
    statusHistory = models.JSONField(default=list)
    contactPerson = models.CharField(max_length=200, blank=True, null=True)
    contactPhone = models.CharField(max_length=20, blank=True, null=True)
    contactEmail = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    supportingDocuments = models.JSONField(default=list)

    def __str__(self):
        return f"{self.firmName} Link"

class Lead(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    name = models.CharField(max_length=200)
    company = models.CharField(max_length=200)
    value = models.FloatField(default=0)
    STATUS_CHOICES = (
        ('new', 'new'), ('contacted', 'contacted'), ('qualified', 'qualified'), 
        ('proposal', 'proposal'), ('closed-won', 'closed-won'), ('closed-lost', 'closed-lost')
    )
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='new')
    source = models.CharField(max_length=100)
    createdAt = models.DateField(auto_now_add=True)

    def __str__(self):
        return self.name

class Customer(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    name = models.CharField(max_length=200)
    company = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    territory = models.CharField(max_length=100)
    lastContact = models.DateField(blank=True, null=True)
    STATUS_CHOICES = (('active', 'active'), ('inactive', 'inactive'))
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='active')

    def __str__(self):
        return self.name
