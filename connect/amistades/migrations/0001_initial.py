# Generated by Django 5.2.1 on 2025-06-26 01:03

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Amistad',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('aceptada', models.BooleanField(default=False)),
                ('fecha_solicitud', models.DateTimeField(auto_now_add=True)),
                ('fecha_aceptacion', models.DateTimeField(blank=True, null=True)),
            ],
        ),
    ]
