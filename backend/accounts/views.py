from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import RegisterSerializer, UserSerializer, UserPreferencesSerializer
from .models import UserPreferences


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class UserPreferencesView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        preferences, created = UserPreferences.objects.get_or_create(
            user=request.user,
            defaults={'theme': 'default'}
        )
        serializer = UserPreferencesSerializer(preferences)
        return Response(serializer.data)
    
    def post(self, request):
        preferences, created = UserPreferences.objects.get_or_create(
            user=request.user,
            defaults={'theme': 'default'}
        )
        serializer = UserPreferencesSerializer(preferences, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
