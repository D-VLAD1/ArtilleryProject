from django.db import models

# Create your models here.
class ArtillerySettings(models.Model):
    name = models.CharField(max_length=100)
    max_distance = models.JSONField(default="{}")
    bullet_speed = models.IntegerField(default=0)
    min_angle = models.DecimalField(max_digits=3, decimal_places=1, default=0)
    max_angle = models.DecimalField(max_digits=3, decimal_places=1, default=90)

    class Meta:
        verbose_name_plural = 'Settings'
