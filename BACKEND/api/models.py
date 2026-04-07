from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user model — stored in the 'users' table."""

    USER_TYPE_CHOICES = [
        ("Admin", "Admin"),
        ("Staff", "Staff"),
    ]

    phone = models.CharField(max_length=30, blank=True, default="")
    bio = models.TextField(blank=True, default="")
    avatar_url = models.CharField(max_length=500, blank=True, default="")
    user_type = models.CharField(
        max_length=10,
        choices=USER_TYPE_CHOICES,
        default="Staff",
    )
    # Security fields for password reset flow
    require_password_change = models.BooleanField(default=False)  # Force password change on next login
    temporary_password_hash = models.CharField(max_length=128, blank=True, default="")  # Store hashed temp password
    profile_picture_url = models.CharField(max_length=500, blank=True, default="")  # Profile picture (persistent)

    class Meta:
        db_table = "users"

    def __str__(self):
        return self.username
    
    def get_account_type_label(self):
        """Return full account type label for display (e.g. 'Admin • Haneus Cafe Owner')."""
        if self.user_type == "Admin":
            return "Admin • Haneus Cafe Owner"
        elif self.user_type == "Staff":
            return "Staff • Haneus Cafe Employee"
        return self.user_type


class Product(models.Model):
    """Inventory product — mirrors the frontend Product type."""

    CATEGORY_CHOICES = [
        ("Beverages", "Beverages"),
        ("Desserts", "Desserts"),
        ("Pastries", "Pastries"),
        ("Ingredients", "Ingredients / Supplies"),
        ("Merchandise", "Merchandise"),
    ]

    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100, choices=CATEGORY_CHOICES)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    stock = models.IntegerField(default=0)
    unit = models.CharField(max_length=50, default="piece")
    description = models.TextField(blank=True, default="")
    low_stock_threshold = models.IntegerField(default=10)
    image_url = models.URLField(blank=True, null=True)
    supplier_name = models.CharField(max_length=200, blank=True, default="")  # Supplier reference
    supplier_contact = models.CharField(max_length=200, blank=True, default="")  # Supplier contact info
    is_orderable = models.BooleanField(default=True)  # Explicit orderability flag (sync'd with stock check)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name

    def sync_orderability(self):
        """Update is_orderable flag based on stock level. Call after stock changes."""
        self.is_orderable = self.stock > 0
        self.save()
    
    @property
    def stock_status(self):
        if self.stock <= 0:
            return "Out of Stock"
        if self.stock <= self.low_stock_threshold:
            return "Low Stock"
        return "In Stock"
    
    @property
    def can_order(self):
        """Derived property for API responses: product is orderable if stock > 0."""
        return self.stock > 0


class PasswordResetToken(models.Model):
    """Secure password reset tokens for forgot password flow."""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="password_reset_tokens")
    token = models.CharField(max_length=255, unique=True)  # Hashed token (not plain text)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()  # Token expiration time (30-60 minutes)
    is_used = models.BooleanField(default=False)  # Prevent token reuse
    
    class Meta:
        ordering = ["-created_at"]
        indexes = [
            # Speeds up verify_reset_token lookup: WHERE token=? AND is_used=FALSE
            models.Index(fields=["token", "is_used"], name="idx_pw_reset_token_used"),
            # Speeds up expired token cleanup: WHERE expires_at < now()
            models.Index(fields=["expires_at"], name="idx_pw_reset_expires_at"),
        ]
    
    def __str__(self):
        return f"Reset token for {self.user.username}"
    
    @property
    def is_expired(self):
        """Check if token has expired."""
        from django.utils import timezone
        return timezone.now() > self.expires_at


class AdminApprovalRequest(models.Model):
    """Track pending admin registration approval requests."""
    
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]
    
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="approval_request")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    decided_at = models.DateTimeField(null=True, blank=True)  # When approved/rejected
    decided_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="approvals_decided")  # Which admin approved it
    
    class Meta:
        ordering = ["-created_at"]
        indexes = [
            # Speeds up listing pending requests: WHERE status='pending'
            models.Index(fields=["status"], name="idx_approval_status"),
            # Speeds up ordering by creation time for notification list
            models.Index(fields=["status", "created_at"], name="idx_approval_status_created"),
        ]
    
    def __str__(self):
        return f"Approval for {self.user.username} ({self.status})"


class DeletedRecordsBackup(models.Model):
    """Backup/audit table for deleted records (users, products, etc.)."""
    
    RECORD_TYPE_CHOICES = [
        ("user", "User"),
        ("product", "Product"),
        ("sale", "Sale"),
    ]
    
    record_type = models.CharField(max_length=50, choices=RECORD_TYPE_CHOICES)
    original_id = models.IntegerField()  # Original PK from deleted record
    data = models.JSONField()  # Full record data as JSON
    deleted_at = models.DateTimeField(auto_now_add=True)
    deleted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="deleted_records")  # Who deleted it
    
    class Meta:
        ordering = ["-deleted_at"]
        verbose_name_plural = "Deleted Records Backups"
        indexes = [
            # Speeds up --type=user filter in show_deleted_records command
            models.Index(fields=["record_type"], name="idx_deleted_record_type"),
            # Speeds up time-based audit queries
            models.Index(fields=["record_type", "deleted_at"], name="idx_deleted_type_time"),
        ]
    
    def __str__(self):
        return f"{self.record_type} #{self.original_id} (deleted {self.deleted_at.date()})"


class Sale(models.Model):
    """Sales / order record — mirrors the frontend Sale type."""

    STATUS_CHOICES = [
        ("Completed", "Completed"),
        ("Pending", "Pending"),
        ("Cancelled", "Cancelled"),
    ]

    order_id = models.CharField(max_length=50, unique=True)
    customer_name = models.CharField(max_length=200)
    date = models.DateTimeField()
    total = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Pending")
    items_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return f"{self.order_id} — {self.customer_name}"


class ResetAttempt(models.Model):
    """Track password reset attempts for risk-based scoring.
    Lightweight alternative to ML-based anomaly detection.
    """

    ATTEMPT_TYPE_CHOICES = [
        ("code_verify", "Code Verification"),
        ("email_reset", "Email Reset"),
        ("password_change", "Password Change"),
    ]

    user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="reset_attempts",
    )
    attempt_type = models.CharField(
        max_length=20, choices=ATTEMPT_TYPE_CHOICES, default="code_verify",
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    was_successful = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            # Speeds up risk scoring: count attempts per user in time range
            models.Index(fields=["user", "created_at"], name="idx_reset_attempt_user_t"),
            # Speeds up filtering by attempt type
            models.Index(fields=["attempt_type"], name="idx_reset_attempt_type"),
        ]

    def __str__(self):
        return f"ResetAttempt({self.user}, {self.attempt_type}, success={self.was_successful})"
