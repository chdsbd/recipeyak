# Generated by Django 3.2.9 on 2022-08-30 04:05

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0098_scrape'),
    ]

    operations = [
        migrations.AddField(
            model_name='recipe',
            name='scrape',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='core.scrape'),
        ),
        migrations.AlterField(
            model_name='scrape',
            name='id',
            field=models.AutoField(primary_key=True, serialize=False),
        ),
    ]