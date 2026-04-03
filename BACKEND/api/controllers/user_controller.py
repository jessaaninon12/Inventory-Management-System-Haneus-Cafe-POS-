"""
User API controller — thin HTTP layer.
All business logic lives in UserService; this controller only handles
request parsing and response formatting.

Endpoints covered:
  POST   /api/auth/register/           — register a new user
  POST   /api/auth/login/              — authenticate and return user data
  GET    /api/profile/<pk>/            — retrieve full user profile
  PUT    /api/profile/<pk>/            — update profile fields
  PUT    /api/profile/<pk>/password/   — change password
"""

from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from api.throttles import AnonLoginThrottle, LoginThrottle
from api.schema_serializers import (
    AuthSuccessSchema,
    ChangePasswordRequestSchema,
    ErrorSchema,
    LoginRequestSchema as LoginRequestDoc,
    ProfileResponseSchema,
    RegisterRequestSchema as RegisterRequestDoc,
    UpdateProfileRequestSchema,
)
from application.services.admin_approval_service import AdminApprovalService
from infrastructure.repositories.admin_approval_repository import AdminApprovalRepository
from application.dtos.user_dto import (
    ChangePasswordDTO,
    CreateUserDTO,
    LoginDTO,
    UpdateUserDTO,
)
from application.services.user_service import UserService
from application.services.reset_risk_service import ResetRiskService
from infrastructure.repositories.user_repository import UserRepository
from infrastructure.repositories.reset_attempt_repository import ResetAttemptRepository


def _get_service():
    """Instantiate UserService with its concrete repository."""
    return UserService(UserRepository())


def _get_risk_service():
    """Instantiate ResetRiskService with its concrete repository."""
    return ResetRiskService(ResetAttemptRepository())


def _get_client_ip(request):
    """Extract client IP address from request headers."""
    x_forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded:
        return x_forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "")


class CheckUsernameController(APIView):
    """
    GET /api/auth/check-username/?username=<value>
    Returns {"available": true} or {"available": false, "error": "Username already used"}
    Used by the registration form for real-time uniqueness feedback.
    """

    @extend_schema(tags=["Auth"], responses={200: None})
    def get(self, request):
        username = request.query_params.get("username", "").strip()
        if not username:
            return Response(
                {"available": False, "error": "Username is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        service = _get_service()
        if service.check_username_exists(username):
            # Also return user_id for CODE-based password reset flow
            user_entity = service.repository.get_by_username(username)
            user_id = user_entity.id if user_entity else None
            return Response({"available": False, "error": "Username already used", "user_id": user_id})
        return Response({"available": True})


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

class RegisterController(APIView):
    """
    POST /api/auth/register/
    Register a new user account.
    Request:  { first_name, last_name, username, email, password }
    Response: { success: true, user: UserDTO }
    """

    @extend_schema(
        tags=["Auth"],
        request=RegisterRequestDoc,
        responses={201: AuthSuccessSchema, 400: ErrorSchema},
    )
    def post(self, request):
        service = _get_service()
        try:
            dto = CreateUserDTO(
                first_name=request.data.get("first_name", ""),
                last_name=request.data.get("last_name", ""),
                username=request.data.get("username", ""),
                email=request.data.get("email", ""),
                password=request.data.get("password", ""),
                confirm_password=request.data.get("confirm_password", ""),
                user_type=request.data.get("user_type", "Staff"),
            )
            user_dto = service.register(dto)
            
            # If user_type is Admin, create an approval request via service
            if dto.user_type == "Admin":
                approval_service = AdminApprovalService(AdminApprovalRepository())
                approval_service.create_approval_request(user_dto.id)
            
            return Response(
                {"success": True, "user": user_dto.to_dict()},
                status=status.HTTP_201_CREATED,
            )
        except ValueError as e:
            errors = e.args[0]
            if isinstance(errors, list):
                return Response({"errors": errors}, status=status.HTTP_400_BAD_REQUEST)
            return Response({"error": str(errors)}, status=status.HTTP_400_BAD_REQUEST)


class LoginController(APIView):
    """
    POST /api/auth/login/
    Authenticate and return user data stored in localStorage on the frontend.
    Request:  { username, password }
    Response: { success: true, user: UserDTO }
    """
    throttle_classes = [AnonLoginThrottle, LoginThrottle]

    @extend_schema(
        tags=["Auth"],
        request=LoginRequestDoc,
        responses={200: AuthSuccessSchema, 401: ErrorSchema},
    )
    def post(self, request):
        service = _get_service()
        dto = LoginDTO(
            username=request.data.get("username", ""),
            password=request.data.get("password", ""),
            user_type=request.data.get("user_type", ""),
        )
        user_dto = service.login(dto)
        if user_dto is None:
            return Response(
                {"error": "Invalid username or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        return Response({"success": True, "user": user_dto.to_dict()})


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------

class ProfileDetailController(APIView):
    """
    GET /api/profile/<pk>/
        Returns full user profile: id, username, email, first_name, last_name,
        phone, bio, avatar_url, date_joined.
        Used by profile.html on page load to populate form fields and avatar.

    PUT /api/profile/<pk>/
        Partially updates profile fields. All fields optional.
        Request: { first_name, last_name, email, phone, bio, avatar_url }
        Also updates localStorage user object on the frontend after save.
    """

    @extend_schema(
        tags=["Profile"],
        responses={200: ProfileResponseSchema, 404: ErrorSchema},
    )
    def get(self, request, pk):
        service = _get_service()
        user_dto = service.get_profile(pk)
        if user_dto is None:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(user_dto.to_dict())

    @extend_schema(
        tags=["Profile"],
        request=UpdateProfileRequestSchema,
        responses={200: ProfileResponseSchema, 404: ErrorSchema},
    )
    def put(self, request, pk):
        service = _get_service()
        dto = UpdateUserDTO(
            first_name=request.data.get("first_name"),
            last_name=request.data.get("last_name"),
            email=request.data.get("email"),
            phone=request.data.get("phone"),
            bio=request.data.get("bio"),
            avatar_url=request.data.get("avatar_url"),
        )
        user_dto = service.update_profile(pk, dto)
        if user_dto is None:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(user_dto.to_dict())


class ChangePasswordController(APIView):
    """
    PUT /api/profile/<pk>/password/
    Verifies current password then sets the new one.
    Request:  { current_password, new_password }
    Response: { success: true, message: "Password updated successfully." }
    """

    @extend_schema(
        tags=["Profile"],
        request=ChangePasswordRequestSchema,
        responses={
            200: None,
            400: ErrorSchema,
            404: ErrorSchema,
        },
    )
    def put(self, request, pk):
        service = _get_service()
        dto = ChangePasswordDTO(
            current_password=request.data.get("current_password", ""),
            new_password=request.data.get("new_password", ""),
        )
        try:
            success = service.change_password(pk, dto)
            if not success:
                return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
            return Response({"success": True, "message": "Password updated successfully."})
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class AdminResetPasswordController(APIView):
    """
    POST /api/users/<pk>/reset-password/
    Admin initiates CODE-based password reset for a user.
    Returns: { success: true, reset_code: "123456" }
    """

    @extend_schema(
        tags=["Profile"],
        responses={200: None, 404: ErrorSchema},
    )
    def post(self, request, pk):
        service = _get_service()
        risk_service = _get_risk_service()
        ip = _get_client_ip(request)
        try:
            plain_code, _hashed = service.reset_user_password(pk)
            # Log successful admin reset attempt
            risk_service.record_attempt(pk, "email_reset", ip, was_successful=True)
            return Response(
                {"success": True, "reset_code": plain_code},
                status=status.HTTP_200_OK,
            )
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)


class VerifyResetCodeController(APIView):
    """
    POST /api/auth/verify-reset-code/
    Verify a reset CODE for a user (Phase 1 of forced reset wizard).
    Request:  { user_id, code }
    Response: { success: true } or { error: "..." }
    """

    @extend_schema(
        tags=["Auth"],
        responses={200: None, 400: ErrorSchema},
    )
    def post(self, request):
        service = _get_service()
        risk_service = _get_risk_service()
        ip = _get_client_ip(request)
        user_id = request.data.get("user_id")
        code = request.data.get("code", "").strip()

        if not user_id:
            return Response(
                {"error": "User ID is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not code:
            return Response(
                {"error": "Reset CODE is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Risk assessment before allowing verification
        risk = risk_service.assess_risk(user_id, ip)
        if not risk.is_allowed:
            risk_service.record_attempt(user_id, "code_verify", ip, was_successful=False)
            return Response(
                {"error": "Too many reset attempts. Please try again later.",
                 "risk_level": risk.level},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        try:
            valid = service.verify_reset_code(user_id, code)
            # Record attempt outcome
            risk_service.record_attempt(user_id, "code_verify", ip, was_successful=valid)
            if valid:
                return Response({"success": True, "message": "CODE verified successfully."})
            else:
                return Response(
                    {"error": "Invalid reset CODE."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except ValueError as e:
            risk_service.record_attempt(user_id, "code_verify", ip, was_successful=False)
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ChangeTemporaryPasswordController(APIView):
    """
    POST /api/auth/change-temporary-password/
    User changes their password after verifying reset CODE (Phase 2 of forced reset wizard).
    Request:  { user_id, code, new_password }
    Response: { success: true, message: "Password updated successfully." }
    """

    @extend_schema(
        tags=["Auth"],
        responses={200: None, 400: ErrorSchema, 404: ErrorSchema},
    )
    def post(self, request):
        service = _get_service()
        risk_service = _get_risk_service()
        ip = _get_client_ip(request)
        user_id = request.data.get("user_id")
        code = request.data.get("code", "").strip()
        new_password = request.data.get("new_password", "")

        if not user_id:
            return Response(
                {"error": "User ID is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not code:
            return Response(
                {"error": "Reset CODE is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not new_password:
            return Response(
                {"error": "New password is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            success = service.change_password_from_temporary(user_id, new_password, code=code)
            if not success:
                return Response(
                    {"error": "User not found."}, status=status.HTTP_404_NOT_FOUND
                )
            # Record successful password change
            risk_service.record_attempt(user_id, "password_change", ip, was_successful=True)
            return Response(
                {"success": True, "message": "Password updated successfully."}
            )
        except ValueError as e:
            risk_service.record_attempt(user_id, "password_change", ip, was_successful=False)
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# Admin user management  — /api/users/admin/*
# ---------------------------------------------------------------------------

class AdminUserListController(APIView):
    """
    GET /api/users/admin/view/  → list all Admin users
    """

    @extend_schema(tags=["Users – Admin"], responses=ProfileResponseSchema(many=True))
    def get(self, request):
        service = _get_service()
        users = service.get_all_users_by_type("Admin")
        return Response([u.to_dict() for u in users])


class AdminUserDetailController(APIView):
    """
    GET /api/users/admin/view/<pk>/  → retrieve a single Admin user
    """

    @extend_schema(tags=["Users – Admin"], responses={200: ProfileResponseSchema, 404: ErrorSchema})
    def get(self, request, pk):
        service = _get_service()
        user = service.get_profile(pk)
        if user is None or user.user_type != "Admin":
            return Response({"error": "Admin user not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(user.to_dict())


class AdminUserCreateController(APIView):
    """
    POST /api/users/admin/create/  → register a new Admin user
    """

    @extend_schema(
        tags=["Users – Admin"],
        request=RegisterRequestDoc,
        responses={201: AuthSuccessSchema, 400: ErrorSchema},
    )
    def post(self, request):
        service = _get_service()
        try:
            dto = CreateUserDTO(
                first_name=request.data.get("first_name", ""),
                last_name=request.data.get("last_name", ""),
                username=request.data.get("username", ""),
                email=request.data.get("email", ""),
                password=request.data.get("password", ""),
                confirm_password=request.data.get("confirm_password", ""),
                user_type="Admin",
            )
            user_dto = service.register(dto)
            return Response({"success": True, "user": user_dto.to_dict()}, status=status.HTTP_201_CREATED)
        except ValueError as e:
            errors = e.args[0]
            if isinstance(errors, list):
                return Response({"errors": errors}, status=status.HTTP_400_BAD_REQUEST)
            return Response({"error": str(errors)}, status=status.HTTP_400_BAD_REQUEST)


class AdminUserEditController(APIView):
    """
    PUT /api/users/admin/edit/<pk>/  → full profile update for an Admin user
    """

    @extend_schema(
        tags=["Users – Admin"],
        request=UpdateProfileRequestSchema,
        responses={200: ProfileResponseSchema, 404: ErrorSchema},
    )
    def put(self, request, pk):
        service = _get_service()
        # Verify the target user is an Admin
        existing = service.get_profile(pk)
        if existing is None or existing.user_type != "Admin":
            return Response({"error": "Admin user not found."}, status=status.HTTP_404_NOT_FOUND)
        dto = UpdateUserDTO(
            first_name=request.data.get("first_name"),
            last_name=request.data.get("last_name"),
            email=request.data.get("email"),
            phone=request.data.get("phone"),
            bio=request.data.get("bio"),
            avatar_url=request.data.get("avatar_url"),
        )
        user_dto = service.update_profile(pk, dto)
        if user_dto is None:
            return Response({"error": "Admin user not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(user_dto.to_dict())


class AdminUserDeleteController(APIView):
    """
    DELETE /api/users/admin/delete/<pk>/  → remove an Admin user
    """

    @extend_schema(tags=["Users – Admin"], responses={204: None, 404: ErrorSchema})
    def delete(self, request, pk):
        service = _get_service()
        existing = service.get_profile(pk)
        if existing is None or existing.user_type != "Admin":
            return Response({"error": "Admin user not found."}, status=status.HTTP_404_NOT_FOUND)
        service.delete_user(pk)
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminUserPartialEditController(APIView):
    """
    PATCH /api/users/admin/partialedit/<pk>/  → partial update (only supplied fields)
    """

    @extend_schema(
        tags=["Users – Admin"],
        request=UpdateProfileRequestSchema,
        responses={200: ProfileResponseSchema, 404: ErrorSchema},
    )
    def patch(self, request, pk):
        service = _get_service()
        existing = service.get_profile(pk)
        if existing is None or existing.user_type != "Admin":
            return Response({"error": "Admin user not found."}, status=status.HTTP_404_NOT_FOUND)
        dto = UpdateUserDTO(
            first_name=request.data.get("first_name"),
            last_name=request.data.get("last_name"),
            email=request.data.get("email"),
            phone=request.data.get("phone"),
            bio=request.data.get("bio"),
            avatar_url=request.data.get("avatar_url"),
        )
        user_dto = service.update_profile(pk, dto)
        if user_dto is None:
            return Response({"error": "Admin user not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(user_dto.to_dict())


# ---------------------------------------------------------------------------
# Staff user management  — /api/users/staff/*
# ---------------------------------------------------------------------------

class StaffUserListController(APIView):
    """
    GET /api/users/staff/view/  → list all Staff users
    """

    @extend_schema(tags=["Users – Staff"], responses=ProfileResponseSchema(many=True))
    def get(self, request):
        service = _get_service()
        users = service.get_all_users_by_type("Staff")
        return Response([u.to_dict() for u in users])


class StaffUserDetailController(APIView):
    """
    GET /api/users/staff/view/<pk>/  → retrieve a single Staff user
    """

    @extend_schema(tags=["Users – Staff"], responses={200: ProfileResponseSchema, 404: ErrorSchema})
    def get(self, request, pk):
        service = _get_service()
        user = service.get_profile(pk)
        if user is None or user.user_type != "Staff":
            return Response({"error": "Staff user not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(user.to_dict())


class StaffUserCreateController(APIView):
    """
    POST /api/users/staff/create/  → register a new Staff user
    """

    @extend_schema(
        tags=["Users – Staff"],
        request=RegisterRequestDoc,
        responses={201: AuthSuccessSchema, 400: ErrorSchema},
    )
    def post(self, request):
        service = _get_service()
        try:
            dto = CreateUserDTO(
                first_name=request.data.get("first_name", ""),
                last_name=request.data.get("last_name", ""),
                username=request.data.get("username", ""),
                email=request.data.get("email", ""),
                password=request.data.get("password", ""),
                confirm_password=request.data.get("confirm_password", ""),
                user_type="Staff",
            )
            user_dto = service.register(dto)
            return Response({"success": True, "user": user_dto.to_dict()}, status=status.HTTP_201_CREATED)
        except ValueError as e:
            errors = e.args[0]
            if isinstance(errors, list):
                return Response({"errors": errors}, status=status.HTTP_400_BAD_REQUEST)
            return Response({"error": str(errors)}, status=status.HTTP_400_BAD_REQUEST)


class StaffUserEditController(APIView):
    """
    PUT /api/users/staff/edit/<pk>/  → full profile update for a Staff user
    """

    @extend_schema(
        tags=["Users – Staff"],
        request=UpdateProfileRequestSchema,
        responses={200: ProfileResponseSchema, 404: ErrorSchema},
    )
    def put(self, request, pk):
        service = _get_service()
        existing = service.get_profile(pk)
        if existing is None or existing.user_type != "Staff":
            return Response({"error": "Staff user not found."}, status=status.HTTP_404_NOT_FOUND)
        dto = UpdateUserDTO(
            first_name=request.data.get("first_name"),
            last_name=request.data.get("last_name"),
            email=request.data.get("email"),
            phone=request.data.get("phone"),
            bio=request.data.get("bio"),
            avatar_url=request.data.get("avatar_url"),
        )
        user_dto = service.update_profile(pk, dto)
        if user_dto is None:
            return Response({"error": "Staff user not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(user_dto.to_dict())


class StaffUserDeleteController(APIView):
    """
    DELETE /api/users/staff/delete/<pk>/  → remove a Staff user
    """

    @extend_schema(tags=["Users – Staff"], responses={204: None, 404: ErrorSchema})
    def delete(self, request, pk):
        service = _get_service()
        existing = service.get_profile(pk)
        if existing is None or existing.user_type != "Staff":
            return Response({"error": "Staff user not found."}, status=status.HTTP_404_NOT_FOUND)
        service.delete_user(pk)
        return Response(status=status.HTTP_204_NO_CONTENT)


class StaffUserPartialEditController(APIView):
    """
    PATCH /api/users/staff/partialedit/<pk>/  → partial update (only supplied fields)
    """

    @extend_schema(
        tags=["Users – Staff"],
        request=UpdateProfileRequestSchema,
        responses={200: ProfileResponseSchema, 404: ErrorSchema},
    )
    def patch(self, request, pk):
        service = _get_service()
        existing = service.get_profile(pk)
        if existing is None or existing.user_type != "Staff":
            return Response({"error": "Staff user not found."}, status=status.HTTP_404_NOT_FOUND)
        dto = UpdateUserDTO(
            first_name=request.data.get("first_name"),
            last_name=request.data.get("last_name"),
            email=request.data.get("email"),
            phone=request.data.get("phone"),
            bio=request.data.get("bio"),
            avatar_url=request.data.get("avatar_url"),
        )
        user_dto = service.update_profile(pk, dto)
        if user_dto is None:
            return Response({"error": "Staff user not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(user_dto.to_dict())
