# Generated by Django 2.0.2 on 2019-02-22 23:59

from django.contrib.postgres.operations import CreateExtension
from django.db import migrations


class PgStatStatements(CreateExtension):
    def __init__(self):
        self.name = "pg_stat_statements"


class Migration(migrations.Migration):

    dependencies = [("recipeyak", "0066_auto_20190105_1701")]

    operations = [PgStatStatements()]
