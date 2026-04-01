import logging

from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import UserPreferences

logger = logging.getLogger(__name__)


class CaseInsensitiveTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        username = attrs.get(self.username_field, '')
        try:
            user = User.objects.get(username__iexact=username)
            attrs[self.username_field] = user.username
        except User.DoesNotExist:
            pass
        except User.MultipleObjectsReturned:
            logger.error(
                'Multiple users found with case-insensitive username %r. '
                'Database integrity may be compromised.',
                username,
            )
        return super().validate(attrs)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password')

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError('A user with that username already exists.')
        return value

    def validate(self, attrs):
        user = User(
            username=attrs.get('username', ''),
            email=attrs.get('email', ''),
        )
        try:
            validate_password(attrs['password'], user=user)
        except DjangoValidationError as e:
            raise serializers.ValidationError({'password': e.messages})
        return attrs

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
