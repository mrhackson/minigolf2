import uuid
from django.conf import settings
from django.db import models


class Game(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
    ]

    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_games'
    )
    name = models.CharField(max_length=200)
    num_holes = models.PositiveIntegerField(default=18)
    invite_code = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class GamePlayer(models.Model):
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='players')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='game_memberships'
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('game', 'user')

    def __str__(self):
        return f"{self.user.username} in {self.game.name}"


class Score(models.Model):
    game_player = models.ForeignKey(
        GamePlayer, on_delete=models.CASCADE, related_name='scores'
    )
    hole_number = models.PositiveIntegerField()
    strokes = models.PositiveIntegerField()

    class Meta:
        unique_together = ('game_player', 'hole_number')
        ordering = ['hole_number']

    def __str__(self):
        return f"Hole {self.hole_number}: {self.strokes} strokes"
