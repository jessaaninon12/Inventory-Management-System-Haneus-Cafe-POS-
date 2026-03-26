"""
Django signals for audit trail and backup on record deletion.
Automatically backup deleted users and products to DeletedRecordsBackup table.
"""

from django.db.models.signals import pre_delete
from django.dispatch import receiver
from django.core import serializers
import json
from .models import User, Product, Sale, DeletedRecordsBackup


@receiver(pre_delete, sender=User)
def backup_deleted_user(sender, instance, **kwargs):
    """Backup user record before deletion."""
    
    # Serialize user data
    data = {
        'username': instance.username,
        'email': instance.email,
        'first_name': instance.first_name,
        'last_name': instance.last_name,
        'phone': instance.phone,
        'bio': instance.bio,
        'avatar_url': instance.avatar_url,
        'user_type': instance.user_type,
        'profile_picture_url': instance.profile_picture_url,
        'is_active': instance.is_active,
        'date_joined': instance.date_joined.isoformat() if instance.date_joined else None,
    }
    
    # Create backup record
    DeletedRecordsBackup.objects.create(
        record_type='user',
        original_id=instance.id,
        data=data,
        deleted_by=None,  # We don't have current user context in signals
    )


@receiver(pre_delete, sender=Product)
def backup_deleted_product(sender, instance, **kwargs):
    """Backup product record before deletion."""
    
    # Serialize product data
    data = {
        'name': instance.name,
        'category': instance.category,
        'price': str(instance.price),
        'cost': str(instance.cost),
        'stock': instance.stock,
        'unit': instance.unit,
        'description': instance.description,
        'low_stock_threshold': instance.low_stock_threshold,
        'image_url': instance.image_url,
        'supplier_name': instance.supplier_name,
        'supplier_contact': instance.supplier_contact,
        'is_orderable': instance.is_orderable,
        'created_at': instance.created_at.isoformat() if instance.created_at else None,
        'updated_at': instance.updated_at.isoformat() if instance.updated_at else None,
    }
    
    # Create backup record
    DeletedRecordsBackup.objects.create(
        record_type='product',
        original_id=instance.id,
        data=data,
        deleted_by=None,
    )


@receiver(pre_delete, sender=Sale)
def backup_deleted_sale(sender, instance, **kwargs):
    """Backup sale record before deletion."""
    
    # Serialize sale data
    data = {
        'order_id': instance.order_id,
        'customer_name': instance.customer_name,
        'date': instance.date.isoformat() if instance.date else None,
        'total': str(instance.total),
        'status': instance.status,
        'items_count': instance.items_count,
        'created_at': instance.created_at.isoformat() if instance.created_at else None,
        'updated_at': instance.updated_at.isoformat() if instance.updated_at else None,
    }
    
    # Create backup record
    DeletedRecordsBackup.objects.create(
        record_type='sale',
        original_id=instance.id,
        data=data,
        deleted_by=None,
    )
