# Generated by Django 5.2.1 on 2025-06-27 02:22

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='usuario',
            name='direccion',
        ),
    ]
