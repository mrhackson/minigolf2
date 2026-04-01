from django.db import models
from django.contrib.auth.models import User

class UserPreferences(models.Model):
    THEME_CHOICES = [
        ('default', 'Default'),
        ('dark', 'Dark Mode'),
        ('midnight', 'Midnight Blue'),
        ('sunset', 'Sunset'),
        ('ocean', 'Ocean'),
        ('rose', 'Rose'),
        ('retro', 'Retro'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='preferences')
    theme = models.CharField(max_length=20, choices=THEME_CHOICES, default='default')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.get_theme_display()}"

# Create your models here.
