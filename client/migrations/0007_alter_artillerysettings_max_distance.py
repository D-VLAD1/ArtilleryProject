# Generated by Django 5.1.7 on 2025-04-14 11:09

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('client', '0006_alter_artillerysettings_max_distance'),
    ]

    operations = [
        migrations.AlterField(
            model_name='artillerysettings',
            name='max_distance',
            field=models.JSONField(default={}),
        ),
    ]
