from rest_framework import viewsets
from .models import Category, UOM, Product, Location, Vendor, POSTerminal, POSAlert
from .serializers import (
    CategorySerializer, UOMSerializer, ProductSerializer,
    LocationSerializer, VendorSerializer, POSTerminalSerializer, POSAlertSerializer
)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class UOMViewSet(viewsets.ModelViewSet):
    queryset = UOM.objects.all()
    serializer_class = UOMSerializer

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer

class VendorViewSet(viewsets.ModelViewSet):
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer

class POSTerminalViewSet(viewsets.ModelViewSet):
    queryset = POSTerminal.objects.all()
    serializer_class = POSTerminalSerializer

class POSAlertViewSet(viewsets.ModelViewSet):
    queryset = POSAlert.objects.all()
    serializer_class = POSAlertSerializer
