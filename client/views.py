from django.shortcuts import render
from django.http import JsonResponse
import json
import math

# Create your views here.
def home(requests):
    return render(requests, 'client/index.html')


def map(requests):
    return render(requests, 'client/map.html')


def compute(requests):
    data = {}
    if requests.method == 'POST':
        post_data = json.loads(requests.body)
        location, target, weapon = post_data.get('location'), post_data.get('target'), post_data.get('weapon')

        print(location, target, weapon)


    return JsonResponse({'Error': 'Something went wrong'} if not data else data)
