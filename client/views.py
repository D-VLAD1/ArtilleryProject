from django.shortcuts import render
from django.http import JsonResponse
import json
from math import sqrt, cos, sin, degrees, atan2, atan
from .models import ArtillerySettings

# Create your views here.
def home(requests):
    return render(requests, 'client/index.html')

def map(requests):
    return render(requests, 'client/map.html')

def howitzer(request):
    data = {}
    if request.method == "GET":
        for i, item in enumerate(ArtillerySettings.objects.all()):
            data[i + 1] = item.name

    return JsonResponse(data)


def compute(requests):
    if requests.method == 'POST':
        post_data = json.loads(requests.body)
        location, target, weapon = post_data.get('location'), post_data.get('target'), post_data.get('weapon')

        data = _calculate(location, target, weapon)
        if isinstance(data, str):
            return JsonResponse({'Error': data})

        brng, angle, flight_time = data
        return JsonResponse({
            'brng': brng,
            'angle': angle,
            'flight_time': flight_time
        })

    return JsonResponse({
            'Error': 'POST method allowed'
        })

def _calculate(pos: dict, target: dict, weapon_name: str, bullet: str=None) -> tuple[float, float, float] | str:
    """Calculate azimuth, incline and time of flight for shooting"""

    # Calculating azimuth
    lat1, lon1, alt1 = pos.get('lat'), pos.get('lon'), pos.get('elevation')
    lat2, lon2, alt2 = target.get('lat'), target.get('lon'), target.get('elevation')

    d_lon = lon2 - lon1

    y = sin(d_lon) * cos(lat2)
    x = cos(lat1) * sin(lat2) - sin(lat1) * cos(lat2) * cos(d_lon)

    brng = atan2(y, x)
    brng = degrees(brng)
    brng = (brng + 360) % 360

    # Calculating distance
    earth_radius = 6371
    d_lat = degrees(lat2 - lat1)
    d_lon = degrees(lon2 - lon1)
    a = (sin(d_lat / 2) * sin(d_lat / 2) + cos(degrees(lat1))
         * cos(degrees(lat2)) * sin(d_lon / 2) * sin(d_lon / 2))
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    dist = earth_radius * c

    weapon_data = ArtillerySettings.objects.get(name=weapon_name)
    max_dist = weapon_data.max_distance[list(weapon_data.max_distance.keys())[0]] \
        if bullet is None else weapon_data.max_distance[bullet]
    vel = weapon_data.bullet_speed
    min_angle = weapon_data.min_angle
    max_angle = weapon_data.max_angle

    if dist > max_dist * 1000:
        return "Howitzer can't fire this far"

    g = 9.80665
    y = alt2 - alt1

    angle = atan((vel**2 - sqrt(vel**4 - g * (g * dist ** 2 + 2 * y * vel ** 2))) / (g * x))
    if not min_angle <= degrees(angle) <= max_angle:
        return 'Howitzer can do an angle like this'

    flight_time = dist / (vel * cos(angle))

    return brng, angle, flight_time
