# Generated by Django 2.0.2 on 2018-03-03 09:55

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [("core", "0034_auto_20180303_0818")]

    operations = [
        migrations.AddField(
            model_name="team",
            name="is_public",
            field=models.BooleanField(default=False),
        )
    ]
