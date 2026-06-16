from rest_framework import serializers
from .models import Meeting, TrackingEntry, EmployeeTask, Alert, AttendanceEntry, GeoFenceAlert, LeaveBalance, PerformanceMetric, EmployeeWallet, WithdrawalRequest, LeaveRequest, Message, TravelExpense

class MeetingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Meeting
        fields = '__all__'

class TrackingEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = TrackingEntry
        fields = '__all__'

class EmployeeTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeTask
        fields = '__all__'

class AlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alert
        fields = '__all__'

class AttendanceEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceEntry
        fields = '__all__'

class GeoFenceAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = GeoFenceAlert
        fields = '__all__'

class LeaveBalanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveBalance
        fields = '__all__'

class PerformanceMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerformanceMetric
        fields = '__all__'

class EmployeeWalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeWallet
        fields = '__all__'

class WithdrawalRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = WithdrawalRequest
        fields = '__all__'

class LeaveRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveRequest
        fields = '__all__'

class MessageSerializer(serializers.ModelSerializer):
    readBy = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = '__all__'

    def get_readBy(self, obj):
        val = obj.readBy
        if isinstance(val, list):
            return val
        return []

class TravelExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = TravelExpense
        fields = '__all__'
