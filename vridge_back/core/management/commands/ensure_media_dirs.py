from django.core.management.base import BaseCommand
from django.conf import settings
import os


class Command(BaseCommand):
    help = 'Ensures media directories exist'

    def handle(self, *args, **options):
        media_dirs = [
            settings.MEDIA_ROOT,
            os.path.join(settings.MEDIA_ROOT, 'feedback_file'),
            os.path.join(settings.MEDIA_ROOT, 'project_file'),
        ]
        
        for directory in media_dirs:
            os.makedirs(directory, exist_ok=True)
            self.stdout.write(
                self.style.SUCCESS(f'Ensured directory exists: {directory}')
            )