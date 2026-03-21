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

from api.schema_serializers import (
    AuthSuccessSchema,
    ChangePasswordRequestSchema,
    ErrorSchema,
    LoginRequestSchema as LoginRequestDoc,
    ProfileResponseSchema,
    RegisterRequestSchema as RegisterRequestDoc,
    UpdateProfileRequestSchema,
)
from application.dtos.user_dto import (
    ChangePasswordDTO,
    CreateUserDTO,
    LoginDTO,
    UpdateUserDTO,
)
from application.services.user_service import UserService
from infrastructure.repositories.user_repository import UserRepository


def _get_service():
    """Instantiate UserService with its concrete repository."""
    return UserService(UserRepository())


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
            return Response({"available": False, "error": "Username already used"})
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
