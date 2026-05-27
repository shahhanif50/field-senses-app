from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DistributorViewSet, TerritoryViewSet, SalesExecutiveViewSet,
    SalesTargetViewSet, DistributorLinkViewSet, LeadViewSet, CustomerViewSet
)

router = DefaultRouter()
router.register(r'distributors', DistributorViewSet)
router.register(r'territories', TerritoryViewSet)
router.register(r'sales-executives', SalesExecutiveViewSet)
router.register(r'sales-targets', SalesTargetViewSet)
router.register(r'distributor-links', DistributorLinkViewSet)
router.register(r'leads', LeadViewSet)
router.register(r'customers', CustomerViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
