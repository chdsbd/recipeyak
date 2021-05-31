# Generated by Django 2.2.12 on 2020-11-26 22:26

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [("core", "0083_auto_20201126_2226")]

    operations = [
        migrations.RenameField(
            model_name="user", old_name="selected_team", new_name="recipe_team"
        ),
        migrations.AddField(
            model_name="user",
            name="schedule_team",
            field=models.ForeignKey(
                blank=True,
                help_text="default team selected for scheduled view.",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="+",
                to="core.Team",
            ),
        ),
    ]
