# Generated by Django 2.0.2 on 2018-12-23 04:49

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("recipeyak", "0061_auto_20180630_0131")]

    operations = [
        migrations.AddField(
            model_name="user",
            name="dark_mode_enabled",
            field=models.BooleanField(
                default=False, help_text="frontend darkmode setting"
            ),
        ),
        migrations.AddField(
            model_name="user",
            name="selected_team",
            field=models.ForeignKey(
                blank=True,
                help_text="team currently focused on UI, null if personal items selected.",
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to="recipeyak.Team",
            ),
        ),
    ]
