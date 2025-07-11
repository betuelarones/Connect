# Generated by Django 5.2.1 on 2025-06-30 01:52

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Publicacion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('contenido', models.TextField(blank=True)),
                ('tipo', models.CharField(choices=[('texto', 'Texto'), ('imagen', 'Imagen'), ('video', 'Video')], default='texto', max_length=10)),
                ('archivo', models.FileField(blank=True, null=True, upload_to='publicaciones/')),
                ('fecha_publicacion', models.DateTimeField(auto_now_add=True)),
                ('autor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='publicaciones', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-fecha_publicacion'],
            },
        ),
        migrations.CreateModel(
            name='Comentario',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('contenido', models.TextField()),
                ('fecha_creacion', models.DateTimeField(auto_now_add=True)),
                ('autor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='mis_comentarios', to=settings.AUTH_USER_MODEL)),
                ('publicacion', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='comentarios_db', to='publicaciones.publicacion')),
            ],
            options={
                'ordering': ['fecha_creacion'],
            },
        ),
        migrations.CreateModel(
            name='Reaccion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tipo', models.CharField(max_length=20)),
                ('fecha_creacion', models.DateTimeField(auto_now_add=True)),
                ('autor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='mis_reacciones', to=settings.AUTH_USER_MODEL)),
                ('publicacion', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reacciones_db', to='publicaciones.publicacion')),
            ],
            options={
                'ordering': ['-fecha_creacion'],
                'unique_together': {('publicacion', 'autor', 'tipo')},
            },
        ),
    ]
