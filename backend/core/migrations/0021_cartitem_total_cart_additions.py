# Generated by Django 2.0.1 on 2018-01-05 18:39

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0020_recipe_cart_additions'),
    ]

    operations = [
        migrations.AddField(
            model_name='cartitem',
            name='total_cart_additions',
            field=models.PositiveIntegerField(default=0),
        ),
    ]
