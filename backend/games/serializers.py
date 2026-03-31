from django.contrib.auth.models import User
from django.db.models import Sum
from rest_framework import serializers
from .models import Game, GamePlayer, Score, GuestPlayer


class ScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Score
        fields = ('id', 'hole_number', 'strokes')


class GuestPlayerSerializer(serializers.ModelSerializer):
    scores = ScoreSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()

    class Meta:
        model = GuestPlayer
        fields = ('id', 'name', 'scores', 'total')

    def get_total(self, obj):
        return obj.scores.aggregate(total=Sum('strokes'))['total'] or 0


class PlayerScoreSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    scores = ScoreSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()

    class Meta:
        model = GamePlayer
        fields = ('id', 'user_id', 'username', 'scores', 'total')

    def get_total(self, obj):
        return obj.scores.aggregate(total=Sum('strokes'))['total'] or 0


class AllPlayersSerializer(serializers.Serializer):
    """Combined serializer for both registered and guest players"""
    registered_players = PlayerScoreSerializer(many=True)
    guest_players = GuestPlayerSerializer(many=True)


class GameListSerializer(serializers.ModelSerializer):
    creator_name = serializers.CharField(source='creator.username', read_only=True)
    player_count = serializers.SerializerMethodField()

    class Meta:
        model = Game
        fields = ('id', 'name', 'num_holes', 'status', 'creator_name', 'player_count', 'created_at', 'invite_code')

    def get_player_count(self, obj):
        return obj.players.count()


class GameDetailSerializer(serializers.ModelSerializer):
    creator_name = serializers.CharField(source='creator.username', read_only=True)
    players = PlayerScoreSerializer(many=True, read_only=True)
    guest_players = GuestPlayerSerializer(many=True, read_only=True)
    is_creator = serializers.SerializerMethodField()

    class Meta:
        model = Game
        fields = ('id', 'name', 'num_holes', 'status', 'creator_name', 'invite_code', 'players', 'guest_players', 'is_creator', 'created_at')

    def get_is_creator(self, obj):
        request = self.context.get('request')
        return request and obj.creator == request.user


class GameCreateSerializer(serializers.ModelSerializer):
    name = serializers.CharField(max_length=200, required=False, allow_blank=True)
    
    class Meta:
        model = Game
        fields = ('id', 'name', 'num_holes', 'invite_code', 'status', 'created_at')
        read_only_fields = ('id', 'invite_code', 'status', 'created_at')

    def validate_num_holes(self, value):
        if value < 1 or value > 36:
            raise serializers.ValidationError("Number of holes must be between 1 and 36.")
        return value


class ScoreSubmitSerializer(serializers.Serializer):
    scores = serializers.ListField(
        child=serializers.DictField(child=serializers.IntegerField()),
        allow_empty=False,
    )

    def validate_scores(self, value):
        game = self.context['game']
        for entry in value:
            hole = entry.get('hole_number')
            strokes = entry.get('strokes')
            if hole is None or strokes is None:
                raise serializers.ValidationError("Each score must have hole_number and strokes.")
            if hole < 1 or hole > game.num_holes:
                raise serializers.ValidationError(f"hole_number must be between 1 and {game.num_holes}.")
            if strokes < 1:
                raise serializers.ValidationError("strokes must be at least 1.")
        return value


class GuestPlayerCreateSerializer(serializers.ModelSerializer):
    name = serializers.CharField(max_length=100)

    class Meta:
        model = GuestPlayer
        fields = ('name',)

    def validate_name(self, value):
        game = self.context['game']
        if GuestPlayer.objects.filter(game=game, name__iexact=value).exists():
            raise serializers.ValidationError("A player with this name already exists in this game.")
        return value


class ScoreUpdateSerializer(serializers.Serializer):
    """Serializer for updating scores for any player (guest or registered)"""
    player_type = serializers.ChoiceField(choices=[('user', 'User'), ('guest', 'Guest')])
    player_id = serializers.IntegerField()
    hole_number = serializers.IntegerField()
    strokes = serializers.IntegerField(min_value=1)

    def validate(self, data):
        game = self.context['game']
        
        # Validate hole number
        if data['hole_number'] < 1 or data['hole_number'] > game.num_holes:
            raise serializers.ValidationError(f"hole_number must be between 1 and {game.num_holes}.")
        
        # Validate player exists
        if data['player_type'] == 'user':
            if not GamePlayer.objects.filter(game=game, user_id=data['player_id']).exists():
                raise serializers.ValidationError("User is not a player in this game.")
        else:  # guest
            if not GuestPlayer.objects.filter(game=game, id=data['player_id']).exists():
                raise serializers.ValidationError("Guest player not found in this game.")
        
        return data


class BulkScoreUpdateSerializer(serializers.Serializer):
    """Serializer for updating multiple scores at once"""
    scores = serializers.ListField(
        child=ScoreUpdateSerializer(),
        allow_empty=False
    )

    def validate_scores(self, value):
        # Check for duplicate score entries for same player/hole
        seen = set()
        for score_data in value:
            key = (score_data['player_type'], score_data['player_id'], score_data['hole_number'])
            if key in seen:
                raise serializers.ValidationError("Duplicate scores for same player and hole.")
            seen.add(key)
        return value


class GameHistorySerializer(serializers.ModelSerializer):
    total_score = serializers.IntegerField()
    player_count = serializers.SerializerMethodField()
    creator_name = serializers.CharField(source='creator.username', read_only=True)

    class Meta:
        model = Game
        fields = ('id', 'name', 'num_holes', 'status', 'creator_name', 'player_count', 'total_score', 'created_at')

    def get_player_count(self, obj):
        return obj.players.count() + obj.guest_players.count()
