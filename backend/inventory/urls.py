from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, UOMViewSet, ProductViewSet,
    LocationViewSet, VendorViewSet, POSTerminalViewSet, POSAlertViewSet, ProductOrderViewSet
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'uoms', UOMViewSet)
router.register(r'products', ProductViewSet)
router.register(r'locations', LocationViewSet)
router.register(r'vendors', VendorViewSet)
router.register(r'pos-terminals', POSTerminalViewSet)
router.register(r'pos-alerts', POSAlertViewSet)
router.register(r'orders', ProductOrderViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
