from django.shortcuts import render

# Create your views here.
def home(requests):
    return render(requests, 'client/index.html')


def map(requests):
    return render(requests, 'client/map.html')
