# Generated by Django 3.2.9 on 2022-08-06 16:34

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("recipeyak", "0094_auto_20220806_0205"),
    ]

    operations = [
        migrations.AlterField(
            model_name="recipe",
            name="cloned_by",
            field=models.ForeignKey(
                help_text="If a clone, User who cloned the recipe.",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterField(
            model_name="recipe",
            name="cloned_from",
            field=models.ForeignKey(
                help_text="If a clone, the parent this Recipe was cloned from.",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="recipeyak.recipe",
            ),
        ),
    ]