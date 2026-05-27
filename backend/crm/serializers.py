from rest_framework import serializers
from .models import Distributor, Territory, SalesExecutive, SalesTarget, DistributorLink, Lead, Customer

class DistributorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Distributor
        fields = '__all__'

class TerritorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Territory
        fields = '__all__'

class SalesExecutiveSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalesExecutive
        fields = '__all__'

class SalesTargetSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalesTarget
        fields = '__all__'

class DistributorLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = DistributorLink
        fields = '__all__'

class LeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = '__all__'

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'
