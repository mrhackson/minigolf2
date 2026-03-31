import uuid
from datetime import date
from django.conf import settings
from django.db import models


def get_default_game_name():
    return date.today().strftime('%Y-%m-%d')


class Game(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
    ]

    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_games'
    )
    name = models.CharField(max_length=200, default=get_default_game_name)
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


class GuestPlayer(models.Model):
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='guest_players')
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('game', 'name')

    def __str__(self):
        return f"{self.name} (Guest) in {self.game.name}"


class Score(models.Model):
    # One score belongs to either a registered player or a guest player
    game_player = models.ForeignKey(
        GamePlayer, on_delete=models.CASCADE, related_name='scores', null=True, blank=True
    )
    guest_player = models.ForeignKey(
        GuestPlayer, on_delete=models.CASCADE, related_name='scores', null=True, blank=True
    )
    hole_number = models.PositiveIntegerField()
    strokes = models.PositiveIntegerField()

    class Meta:
        # Ensure each hole has only one score per player (guest or registered)
        constraints = [
            models.CheckConstraint(
                condition=models.Q(game_player__isnull=False) ^ models.Q(guest_player__isnull=False),
                name='score_belongs_to_one_player_type'
            )
        ]
        ordering = ['hole_number']

    def __str__(self):
        player_name = self.game_player.user.username if self.game_player else self.guest_player.name
        return f"{player_name} - Hole {self.hole_number}: {self.strokes} strokes"

    @property
    def player_name(self):
        return self.game_player.user.username if self.game_player else self.guest_player.name

    @property
    def player_id(self):
        if self.game_player:
            return f"user_{self.game_player.user.id}"
        else:
            return f"guest_{self.guest_player.id}"
