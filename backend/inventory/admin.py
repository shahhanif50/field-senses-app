from django.contrib import admin
from .models import Category, UOM, Product, Location, Vendor

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'status')
    list_filter = ('type', 'status')

@admin.register(UOM)
class UOMAdmin(admin.ModelAdmin):
    list_display = ('name', 'shortCode', 'conversionFactor', 'status')

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'productId', 'sku', 'sellingPrice', 'status')
    search_fields = ('name', 'productId', 'sku')
    list_filter = ('status', 'trackInventory')

@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'status')
    list_filter = ('type', 'status')

@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'contactPerson', 'status')
    list_filter = ('type', 'status')
