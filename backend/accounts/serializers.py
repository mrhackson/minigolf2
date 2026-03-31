from django.contrib.auth.models import User
from rest_framework import serializers
from .models import UserPreferences


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
        )
        return user


class UserPreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPreferences
        fields = ['theme']


class UserSerializer(serializers.ModelSerializer):
    preferences = UserPreferencesSerializer(read_only=True)
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'preferences')
