from django.urls import path
from . import views


urlpatterns = [
    path('', views.home, name='home'),
    path('map/', views.map, name='map'),
    path('compute/', views.compute, name='compute')
    # TODO: Return all howitzer names to client
]