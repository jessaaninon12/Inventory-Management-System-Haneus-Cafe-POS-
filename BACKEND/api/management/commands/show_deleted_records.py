"""
Management command to display deleted records from the backup table.
Backend-only access (not exposed in UI).

Usage:
    python manage.py show_deleted_records                     # Show all deleted records
    python manage.py show_deleted_records --type=user        # Show only deleted users
    python manage.py show_deleted_records --type=product     # Show only deleted products
    python manage.py show_deleted_records --limit=50         # Show last 50 records
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import DeletedRecordsBackup
import json


class Command(BaseCommand):
    help = 'Display deleted records from backup table (backend access only)'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--type',
            type=str,
            default=None,
            help='Filter by record type (user, product, sale)',
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=20,
            help='Number of records to display (default: 20)',
        )
        parser.add_argument(
            '--json',
            action='store_true',
            help='Output as JSON',
        )
    
    def handle(self, *args, **options):
        record_type = options.get('type')
        limit = options.get('limit')
        as_json = options.get('json')
        
        # Build query
        queryset = DeletedRecordsBackup.objects.all()
        
        if record_type:
            queryset = queryset.filter(record_type=record_type)
        
        # Order and limit
        queryset = queryset.order_by('-deleted_at')[:limit]
        
        if not queryset.exists():
            self.stdout.write(self.style.WARNING('No deleted records found.'))
            return
        
        if as_json:
            # Output as JSON
            records = []
            for record in queryset:
                records.append({
                    'id': record.id,
                    'record_type': record.record_type,
                    'original_id': record.original_id,
                    'data': record.data,
                    'deleted_at': record.deleted_at.isoformat(),
                    'deleted_by': record.deleted_by.username if record.deleted_by else None,
                })
            self.stdout.write(json.dumps(records, indent=2, default=str))
        else:
            # Human-readable output
            self.stdout.write(self.style.SUCCESS(f'\n=== Deleted Records Backup ({queryset.count()} records) ===\n'))
            
            for record in queryset:
                self.stdout.write(self.style.SUCCESS(f'ID: {record.id}'))
                self.stdout.write(f'  Type: {record.record_type}')
                self.stdout.write(f'  Original ID: {record.original_id}')
                self.stdout.write(f'  Deleted At: {record.deleted_at}')
                self.stdout.write(f'  Deleted By: {record.deleted_by.username if record.deleted_by else Unknown}')
                self.stdout.write(f'  Data:')
                
                # Pretty-print JSON data
                try:
                    for key, value in record.data.items():
                        self.stdout.write(f'    {key}: {value}')
                except:
                    self.stdout.write(f'    {record.data}')
                
                self.stdout.write('')
