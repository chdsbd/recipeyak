# Generated by Django 2.0.2 on 2018-05-02 15:54

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [("recipeyak", "0047_recipe_deleted_at")]

    operations = [
        migrations.CreateModel(
            name="ScheduledRecipe",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("created", models.DateTimeField(auto_now_add=True)),
                ("modified", models.DateTimeField(auto_now=True)),
                ("on", models.DateField(auto_now_add=True)),
                ("count", models.PositiveIntegerField()),
                (
                    "recipe",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="recipeyak.Recipe",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"db_table": "core_scheduledrecipe"},
        ),
        migrations.AlterUniqueTogether(
            name="scheduledrecipe", unique_together={("recipe", "on", "user")}
        ),
    ]