# Generated by Django 3.2.9 on 2023-01-01 17:26

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("recipeyak", "0110_auto_20230101_1542"),
    ]

    operations = [
        migrations.AddField(
            model_name="recipe",
            name="team",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to="recipeyak.team",
            ),
        ),
    ]