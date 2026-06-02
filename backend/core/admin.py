from django.contrib import admin
from .models import Role, Department, StatusMaster, Project, Employee, RolePermission, Task, Document

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('roleName', 'roleCode', 'roleType', 'activeStatus')

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('departmentName', 'departmentCode', 'activeStatus')

@admin.register(StatusMaster)
class StatusMasterAdmin(admin.ModelAdmin):
    list_display = ('statusName', 'tracking', 'visibility', 'activeStatus')

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'status', 'endDate')

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'status', 'project', 'dueDate')

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('title', 'uploadedBy', 'uploadDate', 'status')

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('employeeId', 'fullName', 'email', 'roleId', 'departmentId', 'accountStatus')
    search_fields = ('fullName', 'employeeId', 'email')
    list_filter = ('roleId', 'departmentId', 'accountStatus')

@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    list_display = ('roleName', 'module', 'view', 'create', 'edit', 'delete')
