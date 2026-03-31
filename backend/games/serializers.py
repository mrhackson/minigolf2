from django.contrib.auth.models import User
from django.db.models import Sum
from rest_framework import serializers
from .models import Game, GamePlayer, Score


class ScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Score
        fields = ('id', 'hole_number', 'strokes')


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
    is_creator = serializers.SerializerMethodField()

    class Meta:
        model = Game
        fields = ('id', 'name', 'num_holes', 'status', 'creator_name', 'invite_code', 'players', 'is_creator', 'created_at')

    def get_is_creator(self, obj):
        request = self.context.get('request')
        return request and obj.creator == request.user


class GameCreateSerializer(serializers.ModelSerializer):
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


class GameHistorySerializer(serializers.ModelSerializer):
    total_score = serializers.IntegerField()
    player_count = serializers.SerializerMethodField()
    creator_name = serializers.CharField(source='creator.username', read_only=True)

    class Meta:
        model = Game
        fields = ('id', 'name', 'num_holes', 'status', 'creator_name', 'player_count', 'total_score', 'created_at')

    def get_player_count(self, obj):
        return obj.players.count()
