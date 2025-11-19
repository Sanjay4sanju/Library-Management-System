from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),

    # Authentication routes
    path('api/auth/', include('authentication.urls')),

    # Core app routes
    path('api/', include('core.urls')),
]
