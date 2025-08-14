# Generated manually
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0005_usermemo'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='user',
            name='login_method',
        ),
    ]