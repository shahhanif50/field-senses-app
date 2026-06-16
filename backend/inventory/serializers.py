from rest_framework import serializers
from .models import Category, UOM, Product, Location, Vendor, POSTerminal, POSAlert, ProductOrder

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class UOMSerializer(serializers.ModelSerializer):
    class Meta:
        model = UOM
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = '__all__'

class VendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = '__all__'

class POSTerminalSerializer(serializers.ModelSerializer):
    class Meta:
        model = POSTerminal
        fields = '__all__'

class POSAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = POSAlert
        fields = '__all__'

class ProductOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductOrder
        fields = '__all__'
