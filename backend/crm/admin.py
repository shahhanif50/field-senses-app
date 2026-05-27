from django.contrib import admin
from .models import Distributor, Territory, SalesExecutive, SalesTarget, DistributorLink

@admin.register(Distributor)
class DistributorAdmin(admin.ModelAdmin):
    list_display = ('firmName', 'distributorId', 'proprietorName', 'mobileNumber', 'typeOfFirm', 'activeStatus')
    search_fields = ('firmName', 'distributorId', 'proprietorName')

@admin.register(Territory)
class TerritoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'region', 'district', 'status')
    list_filter = ('region', 'status')

@admin.register(SalesExecutive)
class SalesExecutiveAdmin(admin.ModelAdmin):
    list_display = ('fullName', 'role', 'department', 'status')
    list_filter = ('role', 'department', 'status')

@admin.register(SalesTarget)
class SalesTargetAdmin(admin.ModelAdmin):
    list_display = ('period', 'productCategory', 'targetValue', 'achievementValue')
    list_filter = ('period', 'productCategory')

@admin.register(DistributorLink)
class DistributorLinkAdmin(admin.ModelAdmin):
    list_display = ('firmName', 'assignedTerritoryId', 'status')
    list_filter = ('status',)
