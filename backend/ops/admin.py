from django.contrib import admin
from .models import Meeting, TrackingEntry, EmployeeTask, Alert

@admin.register(Meeting)
class MeetingAdmin(admin.ModelAdmin):
    list_display = ('title', 'type', 'date', 'organizer', 'status')
    list_filter = ('type', 'status', 'date')
    search_fields = ('title', 'organizer')

@admin.register(TrackingEntry)
class TrackingEntryAdmin(admin.ModelAdmin):
    list_display = ('employeeName', 'date', 'status', 'checkInTime')
    list_filter = ('status', 'date')

@admin.register(EmployeeTask)
class EmployeeTaskAdmin(admin.ModelAdmin):
    list_display = ('taskTitle', 'assignedBy', 'deadline', 'status')
    list_filter = ('status', 'deadline')

@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ('type', 'severity', 'resolved', 'timestamp')
    list_filter = ('severity', 'resolved', 'type')
