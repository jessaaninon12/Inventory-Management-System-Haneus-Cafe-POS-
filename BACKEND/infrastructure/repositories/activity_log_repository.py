"""
Activity Log repository — concrete Django ORM implementation.
"""
from django.utils import timezone
from datetime import timedelta

from infrastructure.data.models import ActivityLogModel


class ActivityLogRepository:

    def log(self, user_name, action, target_type, description,
            target_id="", ip_address=None):
        """Create a new activity log entry."""
        return ActivityLogModel.objects.create(
            user_name=user_name,
            action=action,
            target_type=target_type,
            target_id=str(target_id) if target_id else "",
            description=description,
            ip_address=ip_address,
        )

    def get_logs(self, action=None, target_type=None, search=None,
                 page=1, per_page=25):
        """Fetch paginated, filtered activity logs."""
        qs = ActivityLogModel.objects.all()

        if action:
            qs = qs.filter(action=action)
        if target_type:
            qs = qs.filter(target_type=target_type)
        if search:
            qs = qs.filter(description__icontains=search)

        total = qs.count()
        offset = (page - 1) * per_page
        logs = qs[offset:offset + per_page]

        return {
            "logs": [
                {
                    "id": log.id,
                    "user_name": log.user_name,
                    "action": log.action,
                    "target_type": log.target_type,
                    "target_id": log.target_id,
                    "description": log.description,
                    "ip_address": log.ip_address or "",
                    "timestamp": log.timestamp.isoformat(),
                }
                for log in logs
            ],
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": (total + per_page - 1) // per_page,
        }

    def get_recent(self, limit=10):
        """Return the N most recent log entries."""
        logs = ActivityLogModel.objects.all()[:limit]
        return [
            {
                "id": log.id,
                "user_name": log.user_name,
                "action": log.action,
                "target_type": log.target_type,
                "target_id": log.target_id,
                "description": log.description,
                "timestamp": log.timestamp.isoformat(),
            }
            for log in logs
        ]

    def get_stats(self):
        """Summary stats for the activity log page header."""
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=now.weekday())

        total = ActivityLogModel.objects.count()
        today = ActivityLogModel.objects.filter(timestamp__gte=today_start).count()
        this_week = ActivityLogModel.objects.filter(timestamp__gte=week_start).count()

        return {
            "total_logs": total,
            "today_count": today,
            "this_week_count": this_week,
        }
