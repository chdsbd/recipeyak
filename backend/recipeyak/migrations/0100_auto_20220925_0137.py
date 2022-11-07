# Generated by Django 3.2.9 on 2022-09-25 01:37

import itertools

from django.db import migrations, models
from recipeyak import ordering


def migration_positions_up(apps, schema_editor):
    recipe_model = apps.get_model("recipeyak", "Recipe")
    for recipe in recipe_model.objects.all():
        next_pos = ordering.FIRST_POSITION
        for ingredient_like in sorted(
            itertools.chain(recipe.ingredient_set.all(), recipe.section_set.all()),
            key=lambda x: x.position,  # type: ignore [no-any-return]
        ):
            ingredient_like.position_str = next_pos
            ingredient_like.save()
            next_pos = ordering.position_after(next_pos)

        next_pos = ordering.FIRST_POSITION
        for step in sorted(recipe.step_set.all(), key=lambda x: x.position):  # type: ignore [no-any-return]
            step.position_str = next_pos
            step.save()
            next_pos = ordering.position_after(next_pos)


class Migration(migrations.Migration):

    dependencies = [
        ("recipeyak", "0099_auto_20220830_0405"),
    ]

    operations = [
        migrations.AlterField(
            model_name="section",
            name="position",
            field=models.FloatField(),
        ),
        migrations.AddField(
            model_name="ingredient",
            name="position_str",
            field=models.TextField(null=True),
        ),
        migrations.AddField(
            model_name="section",
            name="position_str",
            field=models.TextField(null=True),
        ),
        migrations.AddField(
            model_name="step",
            name="position_str",
            field=models.TextField(null=True),
        ),
        migrations.RunPython(
            code=migration_positions_up, reverse_code=migrations.RunPython.noop
        ),
        # rename ingredient position columns
        migrations.RenameField(
            model_name="ingredient",
            old_name="position",
            new_name="_deprecated_position",
        ),
        migrations.AlterField(
            model_name="ingredient",
            name="_deprecated_position",
            field=models.FloatField(db_column="_deprecated_position", null=True),
        ),
        migrations.RenameField(
            model_name="ingredient", old_name="position_str", new_name="position"
        ),
        migrations.AlterField(
            model_name="ingredient",
            name="position",
            field=models.TextField(db_column="position"),
        ),
        # rename section position columns
        migrations.RenameField(
            model_name="section",
            old_name="position",
            new_name="_deprecated_position",
        ),
        migrations.AlterField(
            model_name="section",
            name="_deprecated_position",
            field=models.FloatField(db_column="_deprecated_position", null=True),
        ),
        migrations.RenameField(
            model_name="section", old_name="position_str", new_name="position"
        ),
        migrations.AlterField(
            model_name="section",
            name="position",
            field=models.TextField(db_column="position"),
        ),
        # rename step position columns
        migrations.RenameField(
            model_name="step",
            old_name="position",
            new_name="_deprecated_position",
        ),
        migrations.AlterField(
            model_name="step",
            name="_deprecated_position",
            field=models.FloatField(db_column="_deprecated_position", null=True),
        ),
        migrations.RenameField(
            model_name="step", old_name="position_str", new_name="position"
        ),
        migrations.AlterField(
            model_name="step",
            name="position",
            field=models.TextField(db_column="position"),
        ),
    ]
