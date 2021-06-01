# -*- coding: utf-8 -*-
# Generated by Django 1.11.4 on 2017-08-06 13:25
from __future__ import unicode_literals

from typing import List, Tuple

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies: List[Tuple[str, str]] = []

    operations = [
        migrations.CreateModel(
            name="User",
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
                ("password", models.CharField(max_length=128, verbose_name="password")),
                (
                    "last_login",
                    models.DateTimeField(
                        blank=True, null=True, verbose_name="last login"
                    ),
                ),
                ("email", models.EmailField(max_length=254, unique=True)),
                ("is_active", models.BooleanField(default=True)),
                ("is_admin", models.BooleanField(default=False)),
                ("is_superuser", models.BooleanField(default=False)),
                ("created", models.DateField(auto_now_add=True)),
                ("last_updated", models.DateField(auto_now=True)),
            ],
            options={"abstract": False, "db_table": "core_myuser"},
        )
    ]
