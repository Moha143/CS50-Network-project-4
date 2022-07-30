from django.contrib import admin
from .models import User, Post


class UserAdmin(admin.ModelAdmin):
    filter_horizontal = ("following",)


# Register your models here.
admin.site.register(User, UserAdmin)
admin.site.register(Post)