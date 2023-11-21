# Generated by Django 2.0.2 on 2018-05-05 01:04

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("recipeyak", "0048_auto_20180502_1554")]

    operations = [
        migrations.AlterField(
            model_name="scheduledrecipe",
            name="count",
            field=models.PositiveIntegerField(
                validators=[django.core.validators.MinValueValidator(1)]
            ),
        ),
        migrations.AlterField(
            model_name="scheduledrecipe", name="on", field=models.DateField()
        ),
    ]
