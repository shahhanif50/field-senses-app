from django.db import models
from core.models import generate_uuid

class Category(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=200)
    parentCategory = models.CharField(max_length=50, blank=True, null=True)
    TYPE_CHOICES = (('Physical', 'Physical'), ('Service', 'Service'))
    type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    description = models.TextField(blank=True, null=True)
    STATUS_CHOICES = (('Active', 'Active'), ('Inactive', 'Inactive'))
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Active')
    linkedProducts = models.IntegerField(default=0)
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class UOM(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=100)
    shortCode = models.CharField(max_length=20)
    conversionFactor = models.FloatField(default=1.0)
    baseUnit = models.CharField(max_length=50, blank=True, null=True)
    isBaseUnit = models.BooleanField(default=True)
    inUse = models.BooleanField(default=False)
    STATUS_CHOICES = (('Active', 'Active'), ('Inactive', 'Inactive'))
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Active')
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Product(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE, null=True, blank=True)
    productId = models.CharField(max_length=50, unique=True)
    sku = models.CharField(max_length=100)
    barcode = models.CharField(max_length=100, blank=True, null=True)
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=50) # Link to Category ID
    brand = models.CharField(max_length=100)
    uom = models.CharField(max_length=50) # Link to UOM ID
    sellingPrice = models.FloatField()
    taxCategory = models.CharField(max_length=50, blank=True, null=True)
    trackInventory = models.BooleanField(default=True)
    allowDiscount = models.BooleanField(default=False)
    serialBatchTracking = models.BooleanField(default=False)
    expiryTracking = models.BooleanField(default=False)
    productImage = models.TextField(blank=True, null=True)
    STATUS_CHOICES = (('Active', 'Active'), ('Inactive', 'Inactive'))
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Active')
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Location(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=200)
    TYPE_CHOICES = (('Warehouse', 'Warehouse'), ('Branch', 'Branch'), ('Van', 'Van'), ('Store', 'Store'))
    type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    address = models.TextField()
    geoCoordinates = models.CharField(max_length=100, blank=True, null=True)
    gpsEnabled = models.BooleanField(default=False)
    geoFenceEnabled = models.BooleanField(default=False)
    gpsRequired = models.BooleanField(default=False)
    maxCapacity = models.FloatField(default=0)
    currentUtilization = models.FloatField(default=0)
    STATUS_CHOICES = (('Active', 'Active'), ('Inactive', 'Inactive'))
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Active')
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Vendor(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=200)
    TYPE_CHOICES = (('Distributor', 'Distributor'), ('Dealer', 'Dealer'), ('Reseller', 'Reseller'))
    type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    contactPerson = models.CharField(max_length=200)
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    address = models.TextField()
    gstId = models.CharField(max_length=50)
    creditLimit = models.FloatField(default=0)
    paymentTerms = models.IntegerField(default=0) # Days
    linkedWarehouse = models.CharField(max_length=50) # Link to Location ID
    STATUS_CHOICES = (('Active', 'Active'), ('Inactive', 'Inactive'))
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Active')
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class POSTerminal(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=200)
    location = models.CharField(max_length=200)
    TYPE_CHOICES = (('Web', 'Web'), ('Mobile', 'Mobile'), ('Hardware', 'Hardware'))
    type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    STATUS_CHOICES = (('online', 'online'), ('offline', 'offline'), ('syncing', 'syncing'), ('error', 'error'))
    status = models.CharField(max_length=50, choices=STATUS_CHOICES)
    lastSync = models.CharField(max_length=50)
    todayTransactions = models.IntegerField(default=0)
    todaySales = models.FloatField(default=0)
    errorCount = models.IntegerField(default=0)
    ipAddress = models.CharField(max_length=50)
    version = models.CharField(max_length=50)
    operator = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class POSAlert(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE, null=True, blank=True)
    terminalId = models.CharField(max_length=50)
    terminalName = models.CharField(max_length=200)
    TYPE_CHOICES = (('error', 'error'), ('warning', 'warning'), ('info', 'info'))
    type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    message = models.TextField()
    timestamp = models.CharField(max_length=50)
    resolved = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.type} - {self.terminalName}"

class ProductOrder(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=generate_uuid, editable=False)
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE, null=True, blank=True)
    employeeId = models.CharField(max_length=50)
    productId = models.CharField(max_length=50)
    quantity = models.IntegerField(default=1)
    totalPrice = models.FloatField()
    STATUS_CHOICES = (('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected'))
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    requestDate = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Order {self.id} by {self.employeeId}'
