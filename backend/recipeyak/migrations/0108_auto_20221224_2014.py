# Generated by Django 3.2.9 on 2022-12-24 20:14

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("recipeyak", "0107_timelineevent_upload"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="scheduledrecipe",
            name="count",
        ),
    ]
