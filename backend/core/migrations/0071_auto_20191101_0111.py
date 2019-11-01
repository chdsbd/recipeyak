# Generated by Django 2.2 on 2019-11-01 01:11

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [("core", "0070_auto_20191022_0238")]

    operations = [
        migrations.AddField(
            model_name="recipe",
            name="cloned_at",
            field=models.DateTimeField(
                blank=True,
                default=None,
                help_text="If a clone, when the Recipe was cloned from a parent. Otherwise null.",
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="recipe",
            name="cloned_by",
            field=models.ForeignKey(
                blank=True,
                default=None,
                help_text="If a clone, User who cloned the recipe.",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="recipe",
            name="cloned_from",
            field=models.ForeignKey(
                blank=True,
                default=None,
                help_text="If a clone, the parent this Recipe was cloned from.",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="core.Recipe",
            ),
        ),
    ]
