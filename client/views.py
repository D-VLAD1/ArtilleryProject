from django.shortcuts import render
from django.middleware.csrf import get_token
from django.http import JsonResponse
import json
from math import sqrt, cos, sin, degrees, atan2, atan, radians
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
            return JsonResponse({'csrfToken': get_token(requests), 'error': data}, status=400)

        brng, angle, flight_time = data
        return JsonResponse({
            'csrfToken': get_token(requests),
            'brng': brng,
            'angle': angle,
            'flight_time': flight_time
        })

    return JsonResponse({
            'error': 'POST method allowed', 'csrfToken': get_token(requests)
        }, status=403)

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
    brng = 360 - brng

    # Calculating distance
    earth_radius = 6371.0088
    d_lat = radians(lat2 - lat1)
    d_lon = radians(lon2 - lon1)
    a = (sin(d_lat / 2) * sin(d_lat / 2) + cos(radians(lat1))
         * cos(radians(lat2)) * sin(d_lon / 2) * sin(d_lon / 2))
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    # Distance in meters
    dist = earth_radius * c * 1000

    weapon_data = ArtillerySettings.objects.get(name=weapon_name)
    max_dist = weapon_data.max_distance[list(weapon_data.max_distance.keys())[0]] * 1000 \
        if bullet is None else weapon_data.max_distance[bullet] * 1000
    vel = weapon_data.bullet_speed
    min_angle = weapon_data.min_angle
    max_angle = weapon_data.max_angle


    if dist > max_dist:
        # return f"Howitzer can't fire this far. Distance is {dist:.2f} m whereas max distance is {max_dist:.2f} m"
        return f'Гаубиця не може стріляти так далеко. Відстань {dist:.2f} м, тоді як максимальна відстань {max_dist:.2f} м'

    g = 9.80665
    y = alt2 - alt1

    angle_low = atan((vel**2 - sqrt(vel**4 - g * (dist ** 2 + 2 * y * vel ** 2))) / (g * dist))
    angle_high = atan((vel ** 2 + sqrt(vel ** 4 - g * (dist ** 2 + 2 * y * vel ** 2))) / (g * dist))
    if not min_angle <= degrees(angle_low) <= max_angle and not min_angle <= degrees(angle_high) <= max_angle:
        # return f"Howitzer can't do an angle like this. From calculations the angle should be {degrees(angle_low):.2f} angles range from {min_angle} to {max_angle}"
        return f'Гаубиця не може зробити такий кут. За розрахунками кут {degrees(angle_low):.2f}, а має знаходяться у діапазоні від {min_angle} до {max_angle}'

    if min_angle <= angle_low <= max_angle:
        angle = angle_low
    else:
        angle = angle_high

    flight_time = dist / (vel * cos(angle))

    return brng, degrees(angle), flight_time
