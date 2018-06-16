# Generated by Django 2.0.2 on 2018-06-16 16:12

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0055_ingredient_optional'),
    ]

    operations = [
        # https://stackoverflow.com/a/35745221/3555105
        migrations.RunSQL(('''
            DROP TABLE IF EXISTS knox_authtoken;
            DROP TABLE IF EXISTS authtoken_token;
            DELETE FROM auth_permission WHERE content_type_id IN (SELECT id FROM django_content_type WHERE app_label = '{app_label}');
            DELETE FROM django_admin_log WHERE content_type_id IN (SELECT id FROM django_content_type WHERE app_label = '{app_label}');
            DELETE FROM django_content_type WHERE app_label = '{app_label}';
            DELETE FROM django_migrations WHERE APP='{app_label}';
        ''').format(app_label='knox')),
    ]
