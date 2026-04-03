"""
Custom createsuperuser command for Haneus Cafe POS.
Interactive menu with default account creation and custom input flow.
"""
import getpass

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

DEFAULT_USERNAME = 'superadmin'
DEFAULT_EMAIL = 'superadminhaneus@gmail.com'
DEFAULT_PASSWORD = 'superadmin123'
DEFAULT_FIRST_NAME = 'Super'
DEFAULT_LAST_NAME = 'Admin'


class Command(BaseCommand):
    help = 'Create a superuser for Haneus Cafe POS with interactive menu'

    def handle(self, *args, **options):
        self.stdout.write('\n' + '=' * 50)
        self.stdout.write('  Haneus Cafe POS — Super Admin Setup')
        self.stdout.write('=' * 50)
        self.stdout.write('\nSelect an option:')
        self.stdout.write('  [1] Create default superadmin account (recommended for testing)')
        self.stdout.write('  [2] Enter custom superuser details')
        self.stdout.write('  [0] Cancel\n')

        choice = input('Select option (1/2/0): ').strip()

        if choice == '0':
            self.stdout.write(self.style.WARNING('Cancelled.'))
            return

        if choice == '1':
            self._create_default()
        elif choice == '2':
            self._create_custom()
        else:
            self.stdout.write(self.style.ERROR('Invalid option.'))

    def _create_default(self):
        """Create a default superadmin account with preset credentials."""
        if User.objects.filter(username=DEFAULT_USERNAME).exists():
            self.stdout.write(self.style.WARNING(
                f'User "{DEFAULT_USERNAME}" already exists. Skipping.'
            ))
            return

        user = User.objects.create_superuser(
            username=DEFAULT_USERNAME,
            email=DEFAULT_EMAIL,
            password=DEFAULT_PASSWORD,
            first_name=DEFAULT_FIRST_NAME,
            last_name=DEFAULT_LAST_NAME,
        )
        user.user_type = 'Admin'
        user.is_superuser = True
        user.is_staff = True
        user.save()

        self.stdout.write(self.style.SUCCESS(
            f'\n✅ Default superadmin "{DEFAULT_USERNAME}" created successfully!'
        ))
        self.stdout.write(f'   Username: {DEFAULT_USERNAME}')
        self.stdout.write(f'   Email:    {DEFAULT_EMAIL}')
        self.stdout.write(f'   Password: {DEFAULT_PASSWORD}')
        self.stdout.write(f'   Type:     SuperAdmin')
        self.stdout.write(f'   Account:  Admin\n')

    def _create_custom(self):
        """Create a custom superuser account with user-provided fields."""
        username = input('Username: ').strip()
        if not username:
            self.stdout.write(self.style.ERROR('Username is required.'))
            return

        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.ERROR(f'User "{username}" already exists.'))
            return

        email = input('Email: ').strip()
        first_name = input('First Name: ').strip()
        last_name = input('Last Name: ').strip()

        password = getpass.getpass('Password (min 8 chars): ')
        if not password or len(password) < 8:
            self.stdout.write(self.style.ERROR('Password must be at least 8 characters.'))
            return

        confirm = getpass.getpass('Confirm Password: ')
        if password != confirm:
            self.stdout.write(self.style.ERROR('Passwords do not match.'))
            return

        user = User.objects.create_superuser(
            username=username,
            email=email or '',
            password=password,
            first_name=first_name or '',
            last_name=last_name or '',
        )
        user.user_type = 'Admin'
        user.is_superuser = True
        user.is_staff = True
        user.save()

        self.stdout.write(self.style.SUCCESS(
            f'\n✅ Custom superuser "{username}" created successfully!'
        ))
        self.stdout.write(f'   Type:    SuperAdmin')
        self.stdout.write(f'   Account: Admin\n')
