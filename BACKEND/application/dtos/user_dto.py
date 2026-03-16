"""
User data-transfer objects used between the API, service, and infrastructure layers.
"""


class UserDTO:
    """Full representation of a user — used for read responses."""

    def __init__(
        self,
        id=None,
        username="",
        email="",
        first_name="",
        last_name="",
        phone="",
        bio="",
        avatar_url="",
        date_joined=None,
    ):
        self.id = id
        self.username = username
        self.email = email
        self.first_name = first_name
        self.last_name = last_name
        self.phone = phone
        self.bio = bio
        self.avatar_url = avatar_url
        self.date_joined = date_joined

    @staticmethod
    def from_entity(entity):
        return UserDTO(
            id=entity.id,
            username=entity.username,
            email=entity.email,
            first_name=entity.first_name,
            last_name=entity.last_name,
            phone=entity.phone,
            bio=entity.bio,
            avatar_url=entity.avatar_url,
            date_joined=entity.date_joined,
        )

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "phone": self.phone,
            "bio": self.bio,
            "avatar_url": self.avatar_url,
            "date_joined": str(self.date_joined) if self.date_joined else None,
        }


class CreateUserDTO:
    """Payload for registering a new user."""

    def __init__(
        self,
        first_name="",
        last_name="",
        username="",
        email="",
        password="",
    ):
        self.first_name = first_name
        self.last_name = last_name
        self.username = username
        self.email = email
        self.password = password


class UpdateUserDTO:
    """Payload for updating an existing user profile (all fields optional)."""

    def __init__(self, **kwargs):
        self.first_name = kwargs.get("first_name")
        self.last_name = kwargs.get("last_name")
        self.email = kwargs.get("email")
        self.phone = kwargs.get("phone")
        self.bio = kwargs.get("bio")
        self.avatar_url = kwargs.get("avatar_url")


class LoginDTO:
    """Payload for login credentials."""

    def __init__(self, username="", password=""):
        self.username = username
        self.password = password


class ChangePasswordDTO:
    """Payload for a password change request."""

    def __init__(self, current_password="", new_password=""):
        self.current_password = current_password
        self.new_password = new_password
