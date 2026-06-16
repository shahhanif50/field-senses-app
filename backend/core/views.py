from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
import datetime
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from .models import (
    Organization, Site, Role, Department, StatusMaster, Project, Employee, RolePermission, 
    ReportingManager, RegistrationRequest, Task, Document, PermissionRequest, RouteAnalytics, Territory
)
from .serializers import (
    OrganizationSerializer, SiteSerializer, RoleSerializer, DepartmentSerializer, 
    StatusMasterSerializer, ProjectSerializer, EmployeeSerializer, RolePermissionSerializer, 
    ReportingManagerSerializer, RegistrationRequestSerializer, TaskSerializer, DocumentSerializer, PermissionRequestSerializer, RouteAnalyticsSerializer, TerritorySerializer
)

from rest_framework.decorators import action
from django.contrib.auth.hashers import make_password

class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset

    @action(detail=True, methods=['post'])
    def create_admin(self, request, pk=None):
        org = self.get_object()
        name = request.data.get('name')
        email = request.data.get('email')
        password = request.data.get('password')
        site_ids = request.data.get('sites', [])

        if not all([name, email, password]):
            return Response({"error": "Name, email, and password are required"}, status=status.HTTP_400_BAD_REQUEST)

        if Employee.objects.filter(email=email).exists():
            return Response({"error": "Email already exists"}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Use the existing global ADMIN role
        role, created = Role.objects.get_or_create(
            roleCode='ADMIN',
            defaults={
                'roleName': 'Superadmin',
                'roleType': 'Management',
                'defaultDashboard': '/master-setup',
                'rolePriority': 1,
                'activeStatus': True
            }
        )

        # 2. Create the Employee
        emp = Employee.objects.create(
            fullName=name,
            email=email,
            mobileNumber='0000000000',
            password=password, # Note: using plaintext based on existing app logic
            roleId=role,
            organization=org,
            designation='Site Administrator' if site_ids else 'Organization Administrator',
            employmentType='Full-time',
            workMode='Office',
            joiningDate=timezone.now().date() if hasattr(timezone, 'now') else datetime.date.today(),
            accountStatus=True
        )

        if site_ids:
            try:
                emp.accessibleSites.set(site_ids)
            except Exception as e:
                print(f"Error setting accessibleSites: {e}")

        # 3. Send Email Notification
        subject = f"Welcome to {org.name} - Administrator Account"
        message = (
            f"Hello {name},\n\n"
            f"An administrator account has been created for you at {org.name}.\n\n"
            f"Here are your login credentials:\n"
            f"Role: Organization Administrator\n"
            f"Login ID (Email): {email}\n"
            f"Password: {password}\n\n"
            f"Please log in and change your password as soon as possible.\n\n"
            f"Best regards,\n"
            f"The Ops Hub Team"
        )
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
        except Exception as e:
            # We don't want to fail the whole request if email fails, but we can print it
            print(f"Failed to send email: {e}")

        return Response({
            "message": "Admin created successfully and email sent",
            "employeeId": emp.employeeId,
            "email": emp.email
        })

class BaseTenantViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        queryset = super().get_queryset().filter(is_deleted=False)
        user_id = self.request.headers.get('X-User-Id')
        org_id = self.request.headers.get('X-Organization-Id')
        user_role = self.request.headers.get('X-User-Role')
        
        requesting_employee = None
        # Robust fallback: if org_id is null or not provided, check the requesting user's organization
        if user_id and user_id != 'admin':
            try:
                from .models import Employee
                requesting_employee = Employee.objects.get(id=user_id)
                if not org_id or org_id == 'null':
                    if requesting_employee.organization:
                        org_id = requesting_employee.organization.id
            except Employee.DoesNotExist:
                pass

        if org_id and org_id != 'null':
            queryset = queryset.filter(organization_id=org_id)
            
        # Region Manager Filtering
        if user_role and user_role.upper() == 'REGION_MANAGER' and requesting_employee and requesting_employee.region:
            field_names = [f.name for f in queryset.model._meta.get_fields()]
            if 'region' in field_names:
                queryset = queryset.filter(region=requesting_employee.region)
            
        return queryset

    def perform_create(self, serializer):
        from rest_framework.exceptions import ValidationError
        org_id = self.request.headers.get('X-Organization-Id')
        
        # Robust fallback: if org_id is null or not provided, check the requesting user's organization
        if not org_id or org_id == 'null':
            user_id = self.request.headers.get('X-User-Id')
            if user_id and user_id != 'admin':
                try:
                    from .models import Employee
                    requesting_employee = Employee.objects.get(id=user_id)
                    if requesting_employee.organization:
                        org_id = requesting_employee.organization.id
                except Employee.DoesNotExist:
                    pass

        if org_id and org_id != 'null':
            try:
                org = Organization.objects.get(id=org_id)
                serializer.save(organization=org)
            except Organization.DoesNotExist:
                raise ValidationError("Invalid organization ID")
        else:
            raise ValidationError("Organization ID is required")

class SiteViewSet(BaseTenantViewSet):
    queryset = Site.objects.all()
    serializer_class = SiteSerializer

class TerritoryViewSet(BaseTenantViewSet):
    queryset = Territory.objects.all()
    serializer_class = TerritorySerializer

class RoleViewSet(BaseTenantViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer

    def get_queryset(self):
        from django.db.models import Q
        queryset = Role.objects.filter(is_deleted=False)
        org_id = self.request.headers.get('X-Organization-Id')
        
        if not org_id or org_id == 'null':
            user_id = self.request.headers.get('X-User-Id')
            if user_id and user_id != 'admin':
                try:
                    from .models import Employee
                    requesting_employee = Employee.objects.get(id=user_id)
                    if requesting_employee.organization:
                        org_id = requesting_employee.organization.id
                except Employee.DoesNotExist:
                    pass

        if org_id and org_id != 'null':
            queryset = queryset.filter(Q(organization_id=org_id) | Q(organization__isnull=True))
            
        return queryset

class DepartmentViewSet(BaseTenantViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

class StatusMasterViewSet(BaseTenantViewSet):
    queryset = StatusMaster.objects.all()
    serializer_class = StatusMasterSerializer

class EmployeeViewSet(BaseTenantViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer

    def perform_create(self, serializer):
        super().perform_create(serializer)
        emp = serializer.instance
        password = self.request.data.get('password')
        if password and emp.email:
            try:
                from django.core.mail import send_mail
                from django.conf import settings
                subject = "Welcome to Field Senses - Your Account Details"
                message = (
                    f"Hello {emp.fullName},\n\n"
                    f"Your account has been created.\n\n"
                    f"Here are your login credentials:\n"
                    f"Email: {emp.email}\n"
                    f"Temporary Password: {password}\n\n"
                    f"Please log in and change your password as soon as possible.\n\n"
                    f"Best regards,\n"
                    f"The Field Senses Team"
                )
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [emp.email],
                    fail_silently=False,
                )
            except Exception as e:
                print(f"Failed to send email to employee: {e}")

    def get_queryset(self):
        queryset = super().get_queryset()
        user_id = self.request.headers.get('X-User-Id')
        user_role = self.request.headers.get('X-User-Role')
        
        if user_role:
            user_role = user_role.upper()
        
        # Check if the user has site restriction configured in accessibleSites or siteId
        admin_site_ids = []
        if user_id and user_id != 'admin':
            try:
                emp = Employee.objects.get(id=user_id)
                admin_site_ids = list(emp.accessibleSites.values_list("id", flat=True))
                if user_role == 'SITE_ADMIN' and emp.siteId:
                    admin_site_ids.append(emp.siteId.id)
            except Employee.DoesNotExist:
                pass

        if user_role == 'ADMIN' or user_id == 'admin':
            return queryset
        elif user_role in ['MANAGER', 'SR_MGR', 'HEAD']:
            if admin_site_ids:
                return queryset.filter(siteId__in=admin_site_ids)
            return queryset
        elif user_role in ['REGIONAL_MANAGER', 'REGIONAL_M'] and user_id:
            try:
                emp = Employee.objects.get(id=user_id)
                if emp.region:
                    from django.db.models import Q
                    return queryset.filter(Q(region=emp.region) | Q(siteId__region=emp.region))
                return queryset
            except Employee.DoesNotExist:
                return queryset.none()
        elif (user_role == 'SITE_ADMIN' or admin_site_ids) and user_id:
            if admin_site_ids:
                return queryset.filter(siteId__in=admin_site_ids)
            else:
                return queryset.none()
        elif user_id:
            return queryset.filter(id=user_id)
            
        return queryset

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        
        if response.status_code == status.HTTP_201_CREATED:
            name = request.data.get('fullName')
            email = request.data.get('email')
            password = request.data.get('password')
            role_id = request.data.get('roleId')
            
            role_name = "Employee"
            if role_id:
                try:
                    role = Role.objects.get(id=role_id)
                    role_name = role.roleName
                except Role.DoesNotExist:
                    pass
            
            if name and email and password:
                subject = f"Welcome to Ops Hub - New Account Created"
                message = (
                    f"Dear {name},\n\n"
                    f"Welcome aboard! An account has been created for you on Ops Hub by the administrator.\n\n"
                    f"You have been assigned the role of: {role_name}\n\n"
                    f"Your login credentials are as follows:\n"
                    f"Login ID (Email): {email}\n"
                    f"Password: {password}\n\n"
                    f"Please log in at your earliest convenience and make sure to change your password for security purposes.\n\n"
                    f"We're excited to have you on the team!\n\n"
                    f"Best regards,\n"
                    f"Ops Hub Administration"
                )
                try:
                    send_mail(
                        subject,
                        message,
                        settings.DEFAULT_FROM_EMAIL,
                        [email],
                        fail_silently=False,
                    )
                except Exception as e:
                    print(f"Failed to send employee creation email: {e}")
                    
        return response

class RolePermissionViewSet(BaseTenantViewSet):
    queryset = RolePermission.objects.all()
    serializer_class = RolePermissionSerializer

    def get_queryset(self):
        from django.db.models import Q
        queryset = RolePermission.objects.filter(is_deleted=False)
        org_id = self.request.headers.get('X-Organization-Id')
        
        if not org_id or org_id == 'null':
            user_id = self.request.headers.get('X-User-Id')
            if user_id and user_id != 'admin':
                try:
                    from .models import Employee
                    requesting_employee = Employee.objects.get(id=user_id)
                    if requesting_employee.organization:
                        org_id = requesting_employee.organization.id
                except Employee.DoesNotExist:
                    pass

        if org_id and org_id != 'null':
            queryset = queryset.filter(Q(organization_id=org_id) | Q(organization__isnull=True))
            
        return queryset

    def perform_destroy(self, instance):
        # The model has a boolean field named 'delete' which shadows the instance.delete() method.
        # So we must use the queryset to delete the instance.
        RolePermission.objects.filter(id=instance.id).delete()

    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        role_id = request.data.get('roleId')
        role_name = request.data.get('roleName')
        permissions = request.data.get('permissions', [])
        
        if not role_id or not role_name:
            return Response({"error": "roleId and roleName are required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            role = Role.objects.get(id=role_id)
        except Role.DoesNotExist:
            return Response({"error": "Role not found"}, status=status.HTTP_404_NOT_FOUND)
            
        org_id = request.headers.get('X-Organization-Id')
        
        # Clear existing permissions for this role and tenant
        qs = RolePermission.objects.filter(roleId=role)
        if org_id and org_id != 'null':
            qs = qs.filter(organization_id=org_id)
        else:
            qs = qs.filter(organization__isnull=True)
            
        qs.delete()
        
        # Create new permissions
        org = None
        if org_id and org_id != 'null':
            try:
                org = Organization.objects.get(id=org_id)
            except Organization.DoesNotExist:
                pass
                
        new_perms = []
        for perm in permissions:
            new_perms.append(RolePermission(
                organization=org,
                roleId=role,
                roleName=role_name,
                module=perm.get('module'),
                view=perm.get('view', False),
                create=perm.get('create', False),
                edit=perm.get('edit', False),
                delete=perm.get('delete', False),
                approve=perm.get('approve', False),
                export=perm.get('export', False)
            ))
            
        RolePermission.objects.bulk_create(new_perms)
        
        return Response({"status": "success", "message": "Permissions updated"})

class ReportingManagerViewSet(BaseTenantViewSet):
    queryset = ReportingManager.objects.all()
    serializer_class = ReportingManagerSerializer

class LoginView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        employee = Employee.objects.filter(email=email, password=password, is_deleted=False).first()
        
        if not employee:
            if email == "admin@example.com" and password == "Admin@123":
                return Response({
                    "id": "admin",
                    "fullName": "System Admin",
                    "email": email,
                    "roleCode": "ADMIN",
                    "departmentId": "admin",
                    "employeeId": "admin",
                    "organizationId": None,
                    "isGlobalAdmin": True,
                    "modulesEnabled": ["All"],
                    "defaultDashboard": "organizations",
                    "profilePhoto": None
                })
            return Response({"error": "Invalid username or password"}, status=status.HTTP_401_UNAUTHORIZED)
            
        if not employee.accountStatus:
            return Response({"error": "Account is disabled. Please contact administrator."}, status=status.HTTP_403_FORBIDDEN)
            
        if employee.organization and employee.organization.is_deleted:
            return Response({"error": "Your organization is currently inactive. Please contact support."}, status=status.HTTP_403_FORBIDDEN)
            
        roleCode = employee.roleId.roleCode if employee.roleId else "NONE"
        modulesEnabled = employee.organization.modulesEnabled if employee.organization else []
        if employee.siteId and employee.siteId.modulesEnabled:
            if "All" in employee.siteId.modulesEnabled:
                pass
            else:
                modulesEnabled = [m for m in modulesEnabled if m in employee.siteId.modulesEnabled or m == "All"]
        isGlobalAdmin = (roleCode == "ADMIN" and employee.organization is None)
        
        return Response({
            "id": employee.id,
            "employeeId": employee.employeeId,
            "fullName": employee.fullName,
            "email": employee.email,
            "roleCode": roleCode,
            "departmentId": employee.departmentId.id if employee.departmentId else None,
            "organizationId": employee.organization.id if employee.organization else None,
            "isGlobalAdmin": isGlobalAdmin,
            "modulesEnabled": modulesEnabled,
            "defaultDashboard": employee.roleId.defaultDashboard if employee.roleId else "",
            "profilePhoto": employee.profilePhoto,
            "trackingEnabled": employee.trackingEnabled
        })

class MeView(APIView):
    def get(self, request):
        user_id = request.headers.get('X-User-Id')
        if not user_id:
            return Response({"error": "No user ID provided"}, status=status.HTTP_401_UNAUTHORIZED)
            
        if user_id == "admin":
            return Response({
                "id": "admin",
                "fullName": "System Admin",
                "email": "admin@example.com",
                "roleCode": "ADMIN",
                "departmentId": "admin",
                "employeeId": "admin",
                "organizationId": None,
                "isGlobalAdmin": True,
                "modulesEnabled": ["All"],
                "defaultDashboard": "organizations",
                "profilePhoto": None
            })
            
        employee = Employee.objects.filter(id=user_id, is_deleted=False).first()
        if not employee:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            
        if not employee.accountStatus:
            return Response({"error": "Account is disabled"}, status=status.HTTP_403_FORBIDDEN)
            
        roleCode = employee.roleId.roleCode if employee.roleId else "NONE"
        modulesEnabled = employee.organization.modulesEnabled if employee.organization else []
        if employee.siteId and employee.siteId.modulesEnabled:
            if "All" in employee.siteId.modulesEnabled:
                pass
            else:
                modulesEnabled = [m for m in modulesEnabled if m in employee.siteId.modulesEnabled or m == "All"]
        isGlobalAdmin = (roleCode == "ADMIN" and employee.organization is None)
        
        return Response({
            "id": employee.id,
            "employeeId": employee.employeeId,
            "fullName": employee.fullName,
            "email": employee.email,
            "roleCode": roleCode,
            "departmentId": employee.departmentId.id if employee.departmentId else None,
            "organizationId": employee.organization.id if employee.organization else None,
            "isGlobalAdmin": isGlobalAdmin,
            "modulesEnabled": modulesEnabled,
            "defaultDashboard": employee.roleId.defaultDashboard if employee.roleId else "",
            "profilePhoto": employee.profilePhoto,
            "trackingEnabled": employee.trackingEnabled
        })


class RegistrationRequestViewSet(BaseTenantViewSet):
    queryset = RegistrationRequest.objects.all()
    serializer_class = RegistrationRequestSerializer

    def get_queryset(self):
        from django.db.models import Q
        queryset = RegistrationRequest.objects.filter(is_deleted=False)
        user_id = self.request.headers.get('X-User-Id')
        org_id = self.request.headers.get('X-Organization-Id')
        
        if org_id and org_id != 'null':
            queryset = queryset.filter(Q(organization_id=org_id) | Q(organization__isnull=True))
            
        return queryset

    def create(self, request, *args, **kwargs):
        email = request.data.get('email')
        if email:
            existing = RegistrationRequest.objects.filter(email=email).first()
            if existing and existing.status == 'rejected':
                existing.delete()
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        org_id = self.request.headers.get('X-Organization-Id')
        if org_id and org_id != 'null':
            try:
                org = Organization.objects.get(id=org_id)
                serializer.save(organization=org)
            except Organization.DoesNotExist:
                serializer.save()
        else:
            serializer.save()

class ProjectViewSet(BaseTenantViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user_id = self.request.headers.get('X-User-Id')
        user_role = self.request.headers.get('X-User-Role')
        
        if user_role:
            user_role = user_role.upper()
            
        # Resolve site restriction
        admin_site_ids = []
        if user_id and user_id != 'admin':
            try:
                emp = Employee.objects.get(id=user_id)
                admin_site_ids = list(emp.accessibleSites.values_list("id", flat=True))
                if user_role == 'SITE_ADMIN' and emp.siteId:
                    admin_site_ids.append(emp.siteId.id)
            except Employee.DoesNotExist:
                pass

        if user_role == 'ADMIN' or user_id == 'admin':
            pass
        elif user_role in ['SR_MGR', 'HEAD']:
            if admin_site_ids:
                site_emp_ids = Employee.objects.filter(siteId__in=admin_site_ids).values_list("id", flat=True)
                queryset = queryset.filter(assignedEmployees__id__in=site_emp_ids).distinct()
        elif user_role == 'MANAGER':
            team_ids = Employee.objects.filter(reportingManager=user_id).values_list('id', flat=True)
            queryset = queryset.filter(Q(assignedEmployees__id=user_id) | Q(assignedEmployees__id__in=team_ids)).distinct()
            if admin_site_ids:
                site_emp_ids = Employee.objects.filter(siteId__in=admin_site_ids).values_list("id", flat=True)
                queryset = queryset.filter(assignedEmployees__id__in=site_emp_ids).distinct()
        elif (user_role == 'SITE_ADMIN' or admin_site_ids) and user_id:
            if admin_site_ids:
                site_emp_ids = Employee.objects.filter(siteId__in=admin_site_ids).values_list("id", flat=True)
                queryset = queryset.filter(assignedEmployees__id__in=site_emp_ids).distinct()
            else:
                queryset = queryset.none()
        elif user_id:
            queryset = queryset.filter(assignedEmployees__id=user_id).distinct()

        employeeId = self.request.query_params.get('employeeId')
        if employeeId:
            queryset = queryset.filter(assignedEmployees__id=employeeId).distinct()
        return queryset

class TaskViewSet(BaseTenantViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user_id = self.request.headers.get('X-User-Id')
        user_role = self.request.headers.get('X-User-Role')

        if user_role:
            user_role = user_role.upper()
            
        # Resolve site restriction
        admin_site_ids = []
        if user_id and user_id != 'admin':
            try:
                emp = Employee.objects.get(id=user_id)
                admin_site_ids = list(emp.accessibleSites.values_list("id", flat=True))
                if user_role == 'SITE_ADMIN' and emp.siteId:
                    admin_site_ids.append(emp.siteId.id)
            except Employee.DoesNotExist:
                pass

        if user_role == 'ADMIN' or user_id == 'admin':
            pass
        elif user_role in ['SR_MGR', 'HEAD']:
            if admin_site_ids:
                site_emp_ids = Employee.objects.filter(siteId__in=admin_site_ids).values_list("id", flat=True)
                queryset = queryset.filter(assignedEmployees__id__in=site_emp_ids).distinct()
        elif user_role == 'MANAGER':
            team_ids = Employee.objects.filter(reportingManager=user_id).values_list('id', flat=True)
            queryset = queryset.filter(Q(assignedEmployees__id=user_id) | Q(assignedEmployees__id__in=team_ids)).distinct()
            if admin_site_ids:
                site_emp_ids = Employee.objects.filter(siteId__in=admin_site_ids).values_list("id", flat=True)
                queryset = queryset.filter(assignedEmployees__id__in=site_emp_ids).distinct()
        elif (user_role == 'SITE_ADMIN' or admin_site_ids) and user_id:
            if admin_site_ids:
                site_emp_ids = Employee.objects.filter(siteId__in=admin_site_ids).values_list("id", flat=True)
                queryset = queryset.filter(assignedEmployees__id__in=site_emp_ids).distinct()
            else:
                queryset = queryset.none()
        elif user_id:
            queryset = queryset.filter(assignedEmployees__id=user_id).distinct()

        employeeId = self.request.query_params.get('employeeId')
        if employeeId:
            queryset = queryset.filter(assignedEmployees__id=employeeId).distinct()
        
        projectId = self.request.query_params.get('projectId')
        if projectId:
            queryset = queryset.filter(project__id=projectId)
        
        return queryset

class DocumentViewSet(BaseTenantViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user_id = self.request.headers.get('X-User-Id')
        user_role = self.request.headers.get('X-User-Role')

        if user_role:
            user_role = user_role.upper()
            
        # Resolve site restriction
        admin_site_ids = []
        if user_id and user_id != 'admin':
            try:
                emp = Employee.objects.get(id=user_id)
                admin_site_ids = list(emp.accessibleSites.values_list("id", flat=True))
                if user_role == 'SITE_ADMIN' and emp.siteId:
                    admin_site_ids.append(emp.siteId.id)
            except Employee.DoesNotExist:
                pass

        if user_role == 'ADMIN' or user_id == 'admin':
            pass
        elif user_role in ['SR_MGR', 'HEAD']:
            if admin_site_ids:
                site_emp_ids = Employee.objects.filter(siteId__in=admin_site_ids).values_list("id", flat=True)
                queryset = queryset.filter(uploadedBy__id__in=site_emp_ids)
        elif user_role == 'MANAGER':
            team_ids = Employee.objects.filter(reportingManager=user_id).values_list('id', flat=True)
            queryset = queryset.filter(Q(uploadedBy__id=user_id) | Q(uploadedBy__id__in=team_ids))
            if admin_site_ids:
                site_emp_ids = Employee.objects.filter(siteId__in=admin_site_ids).values_list("id", flat=True)
                queryset = queryset.filter(uploadedBy__id__in=site_emp_ids)
        elif (user_role == 'SITE_ADMIN' or admin_site_ids) and user_id:
            if admin_site_ids:
                site_emp_ids = Employee.objects.filter(siteId__in=admin_site_ids).values_list("id", flat=True)
                queryset = queryset.filter(uploadedBy__id__in=site_emp_ids)
            else:
                queryset = queryset.none()
        elif user_id:
            queryset = queryset.filter(uploadedBy__id=user_id)

        employeeId = self.request.query_params.get('employeeId')
        if employeeId:
            queryset = queryset.filter(uploadedBy__id=employeeId)
        return queryset

class PermissionRequestViewSet(BaseTenantViewSet):
    queryset = PermissionRequest.objects.all()
    serializer_class = PermissionRequestSerializer

    def perform_create(self, serializer):
        requester_id = self.request.data.get('requester')
        if requester_id:
            try:
                emp = Employee.objects.get(id=requester_id)
                if emp.reportingManager:
                    # reportingManager is string ID of the manager employee
                    try:
                        manager = Employee.objects.get(id=emp.reportingManager)
                        serializer.save(approver=manager)
                        return
                    except Employee.DoesNotExist:
                        pass
            except Employee.DoesNotExist:
                pass
        serializer.save()

    def get_queryset(self):
        queryset = super().get_queryset()
        user_id = self.request.headers.get('X-User-Id')
        user_role = self.request.headers.get('X-User-Role')

        if user_role:
            user_role = user_role.upper()
            
        # Resolve site restriction
        admin_site_ids = []
        if user_id and user_id != 'admin':
            try:
                emp = Employee.objects.get(id=user_id)
                admin_site_ids = list(emp.accessibleSites.values_list("id", flat=True))
                if user_role == 'SITE_ADMIN' and emp.siteId:
                    admin_site_ids.append(emp.siteId.id)
            except Employee.DoesNotExist:
                pass

        if user_role == 'ADMIN' or user_id == 'admin':
            pass
        elif user_role in ['SR_MGR', 'HEAD']:
            if admin_site_ids:
                site_emp_ids = Employee.objects.filter(siteId__in=admin_site_ids).values_list("id", flat=True)
                queryset = queryset.filter(requester__id__in=site_emp_ids)
        elif user_role == 'MANAGER':
            # Manager sees requests they made and requests to them
            queryset = queryset.filter(Q(requester__id=user_id) | Q(approver__id=user_id))
            if admin_site_ids:
                site_emp_ids = Employee.objects.filter(siteId__in=admin_site_ids).values_list("id", flat=True)
                queryset = queryset.filter(requester__id__in=site_emp_ids)
        elif (user_role == 'SITE_ADMIN' or admin_site_ids) and user_id:
            if admin_site_ids:
                site_emp_ids = Employee.objects.filter(siteId__in=admin_site_ids).values_list("id", flat=True)
                queryset = queryset.filter(requester__id__in=site_emp_ids)
            else:
                queryset = queryset.none()
        elif user_id:
            # Employee sees only their own requests
            queryset = queryset.filter(requester__id=user_id)

        return queryset

from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import RouteAnalytics
from .serializers import RouteAnalyticsSerializer
from django.db.models import Avg

class RouteAnalyticsViewSet(BaseTenantViewSet):
    queryset = RouteAnalytics.objects.all().order_by('-timestamp')
    serializer_class = RouteAnalyticsSerializer

@api_view(['GET'])
def predict_eta(request):
    start = request.query_params.get('start_location')
    end = request.query_params.get('end_location')
    try:
        distance_km = float(request.query_params.get('distance_km', 0.0))
    except ValueError:
        distance_km = 0.0

    if not start or not end:
        # Fallback to standard math immediately if missing
        if distance_km <= 0:
            return Response({'eta_mins': 5, 'source': 'fallback'})
        time_hours = distance_km / 30.0
        return Response({'eta_mins': round(time_hours * 60, 2), 'source': 'fallback_math'})
    
    # Try to find historical averages (Historical ML Ensemble approach)
    past_trips = RouteAnalytics.objects.filter(start_location=start, end_location=end).order_by('-timestamp')[:10]
    
    if past_trips.exists():
        avg_time = past_trips.aggregate(Avg('time_taken_mins'))['time_taken_mins__avg']
        return Response({
            'eta_mins': round(avg_time, 2),
            'source': 'historical_ml'
        })
    else:
        # Fallback to standard math (assume average speed of 30 km/h)
        # Avoid division by zero
        if distance_km <= 0:
            return Response({'eta_mins': 5, 'source': 'fallback'})
            
        time_hours = distance_km / 30.0
        time_mins = time_hours * 60
        return Response({
            'eta_mins': round(time_mins, 2),
            'source': 'fallback_math'
        })
