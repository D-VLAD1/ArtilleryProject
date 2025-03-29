from django.db import models

# Create your models here.
class ArtillerySettings(models.Model):
    name = models.CharField(max_length=100)
    max_distance = models.IntegerField()

    class Meta:
        verbose_name_plural = 'Settings'
