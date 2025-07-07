from django.contrib import admin
from .models import Historia

@admin.register(Historia)
class HistoriaAdmin(admin.ModelAdmin):
    list_display = ('autor', 'fecha_creacion', 'activa')
    list_filter = ('activa',)
    search_fields = ('autor__correo',)
