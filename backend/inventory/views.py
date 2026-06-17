from rest_framework import viewsets
from core.views import BaseTenantViewSet
from ops.models import Alert
from .models import Category, UOM, Product, Location, Vendor, POSTerminal, POSAlert, ProductOrder
from .serializers import (
    CategorySerializer, UOMSerializer, ProductSerializer,
    LocationSerializer, VendorSerializer, POSTerminalSerializer, POSAlertSerializer, ProductOrderSerializer
)

class CategoryViewSet(BaseTenantViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class UOMViewSet(BaseTenantViewSet):
    queryset = UOM.objects.all()
    serializer_class = UOMSerializer

class ProductViewSet(BaseTenantViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

class LocationViewSet(BaseTenantViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer

class VendorViewSet(BaseTenantViewSet):
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer

class POSTerminalViewSet(BaseTenantViewSet):
    queryset = POSTerminal.objects.all()
    serializer_class = POSTerminalSerializer

class POSAlertViewSet(BaseTenantViewSet):
    queryset = POSAlert.objects.all()
    serializer_class = POSAlertSerializer

class ProductOrderViewSet(BaseTenantViewSet):
    queryset = ProductOrder.objects.all()
    serializer_class = ProductOrderSerializer

    def perform_create(self, serializer):
        instance = serializer.save()
        Alert.objects.create(
            type='new_order',
            message=f"New product order placed by Employee {instance.employeeId}.",
            severity='medium',
            relatedEntityId=instance.employeeId,
            relatedEntityType='employee'
        )
