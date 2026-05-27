from rest_framework import viewsets
from .models import Distributor, Territory, SalesExecutive, SalesTarget, DistributorLink, Lead, Customer
from .serializers import (
    DistributorSerializer, TerritorySerializer, SalesExecutiveSerializer,
    SalesTargetSerializer, DistributorLinkSerializer, LeadSerializer, CustomerSerializer
)

class DistributorViewSet(viewsets.ModelViewSet):
    queryset = Distributor.objects.all()
    serializer_class = DistributorSerializer

class TerritoryViewSet(viewsets.ModelViewSet):
    queryset = Territory.objects.all()
    serializer_class = TerritorySerializer

class SalesExecutiveViewSet(viewsets.ModelViewSet):
    queryset = SalesExecutive.objects.all()
    serializer_class = SalesExecutiveSerializer

class SalesTargetViewSet(viewsets.ModelViewSet):
    queryset = SalesTarget.objects.all()
    serializer_class = SalesTargetSerializer

class DistributorLinkViewSet(viewsets.ModelViewSet):
    queryset = DistributorLink.objects.all()
    serializer_class = DistributorLinkSerializer

class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
