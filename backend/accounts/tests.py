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


class CaseInsensitiveLoginTests(APITestCase):
    """Verify that login accepts any case variant of the registered username."""

    register_url = '/api/auth/register/'
    login_url = '/api/auth/login/'
    password = 'X7!kqP2w@zLm'

    def setUp(self):
        self.client.post(self.register_url, {
            'username': 'TestUser',
            'email': 'test@example.com',
            'password': self.password,
        })

    def _login(self, username):
        return self.client.post(self.login_url, {
            'username': username,
            'password': self.password,
        })

    def test_login_with_exact_case(self):
        response = self._login('TestUser')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_login_with_lowercase(self):
        response = self._login('testuser')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_login_with_uppercase(self):
        response = self._login('TESTUSER')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_login_with_mixed_case(self):
        response = self._login('tEsTuSeR')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_username_preserved_as_registered(self):
        """The stored username must match what was entered at registration."""
        user = User.objects.get(username__iexact='testuser')
        self.assertEqual(user.username, 'TestUser')


class CaseInsensitiveRegistrationTests(APITestCase):
    """Verify that registration rejects duplicate usernames regardless of case."""

    url = '/api/auth/register/'
    password = 'X7!kqP2w@zLm'

    def _register(self, username):
        return self.client.post(self.url, {
            'username': username,
            'email': f'{username.lower()}@example.com',
            'password': self.password,
        })

    def test_duplicate_username_different_case_rejected(self):
        self._register('Alice')
        response = self._register('alice')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', response.data)

    def test_duplicate_username_uppercase_rejected(self):
        self._register('Bob')
        response = self._register('BOB')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', response.data)

    def test_unique_username_accepted(self):
        self._register('Alice')
        response = self._register('Bob')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

