# Generated by Django 2.2.12 on 2020-05-18 02:57

from typing import Any

from django.db import migrations, models

import recipeyak.models


def forwards_func(apps: Any, schema_editor: Any) -> None:
    """
    Want each team to get their own secret ical id
    """
    Team = apps.get_model("recipeyak", "Team")
    db_alias = schema_editor.connection.alias
    for team in Team.objects.using(db_alias):
        team.ical_id = recipeyak.models.get_random_ical_id()
        team.save()


class Migration(migrations.Migration):
    dependencies = [("recipeyak", "0075_auto_20200227_0349")]

    operations = [
        migrations.AddField(
            model_name="team",
            name="ical_id",
            field=models.TextField(
                default=recipeyak.models.get_random_ical_id,
                help_text="Secret key used to prevent unauthorized access to schedule calendar.",
            ),
        ),
        migrations.RunPython(forwards_func, migrations.RunPython.noop),
    ]
