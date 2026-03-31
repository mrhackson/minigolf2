from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase


class PasswordProtectionTests(APITestCase):
    """Verify that password validators are enforced on registration."""

    url = '/api/auth/register/'

    def _register(self, password, username='testuser', email='test@example.com'):
        return self.client.post(self.url, {
            'username': username,
            'email': email,
            'password': password,
        })

    # ── Valid registration ────────────────────────────────────────────────────

    def test_strong_password_accepted(self):
        response = self._register('X7!kqP2w@zLm')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotIn('password', response.data)

    def test_password_is_hashed_in_database(self):
        self._register('X7!kqP2w@zLm')
        user = User.objects.get(username='testuser')
        self.assertNotEqual(user.password, 'X7!kqP2w@zLm')
        self.assertTrue(user.password.startswith('pbkdf2_sha256$'))

    # ── MinimumLengthValidator ────────────────────────────────────────────────

    def test_short_password_rejected(self):
        response = self._register('abc1234')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    # ── CommonPasswordValidator ───────────────────────────────────────────────

    def test_common_password_rejected(self):
        response = self._register('password')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    # ── NumericPasswordValidator ──────────────────────────────────────────────

    def test_entirely_numeric_password_rejected(self):
        response = self._register('12345678')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    # ── UserAttributeSimilarityValidator ─────────────────────────────────────

    def test_password_too_similar_to_username_rejected(self):
        response = self._register('testuser1', username='testuser')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

