# Generated by Django 1.11.4 on 2017-09-17 03:33

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [("recipeyak", "0006_auto_20170808_0017")]

    operations = [
        migrations.RenameField(model_name="recipe", old_name="title", new_name="name")
    ]
