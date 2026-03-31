from django.db.models import Sum, Subquery, OuterRef, IntegerField
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Game, GamePlayer, Score
from .serializers import (
    GameListSerializer,
    GameDetailSerializer,
    GameCreateSerializer,
    ScoreSubmitSerializer,
    GameHistorySerializer,
)


class GameListCreateView(generics.ListCreateAPIView):
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return GameCreateSerializer
        return GameListSerializer

    def get_queryset(self):
        return Game.objects.filter(players__user=self.request.user).distinct()

    def perform_create(self, serializer):
        game = serializer.save(creator=self.request.user)
        GamePlayer.objects.create(game=game, user=self.request.user)


class GameDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = GameDetailSerializer

    def get_queryset(self):
        return Game.objects.filter(players__user=self.request.user)

    def update(self, request, *args, **kwargs):
        game = self.get_object()
        if game.creator != request.user:
            return Response(
                {'detail': 'Only the creator can update the game.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        new_status = request.data.get('status')
        if new_status == 'completed':
            game.status = 'completed'
            game.save()
        return Response(GameDetailSerializer(game, context={'request': request}).data)


class JoinGameView(APIView):
    def post(self, request, invite_code):
        try:
            game = Game.objects.get(invite_code=invite_code)
        except Game.DoesNotExist:
            return Response(
                {'detail': 'Game not found.'}, status=status.HTTP_404_NOT_FOUND
            )

        if game.status == 'completed':
            return Response(
                {'detail': 'This game is already completed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        _, created = GamePlayer.objects.get_or_create(game=game, user=request.user)
        if not created:
            return Response({'detail': 'Already in this game.', 'game_id': game.id})
        return Response(
            {'detail': 'Joined successfully.', 'game_id': game.id},
            status=status.HTTP_201_CREATED,
        )


class ScoreView(APIView):
    def get(self, request, pk):
        try:
            game = Game.objects.get(pk=pk, players__user=request.user)
        except Game.DoesNotExist:
            return Response(
                {'detail': 'Game not found.'}, status=status.HTTP_404_NOT_FOUND
            )

        players = game.players.select_related('user').prefetch_related('scores').all()
        from .serializers import PlayerScoreSerializer

        return Response(PlayerScoreSerializer(players, many=True).data)

    def post(self, request, pk):
        try:
            game = Game.objects.get(pk=pk, players__user=request.user)
        except Game.DoesNotExist:
            return Response(
                {'detail': 'Game not found.'}, status=status.HTTP_404_NOT_FOUND
            )

        if game.status == 'completed':
            return Response(
                {'detail': 'Cannot update scores for a completed game.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        game_player = GamePlayer.objects.get(game=game, user=request.user)
        serializer = ScoreSubmitSerializer(data=request.data, context={'game': game})
        serializer.is_valid(raise_exception=True)

        for entry in serializer.validated_data['scores']:
            Score.objects.update_or_create(
                game_player=game_player,
                hole_number=entry['hole_number'],
                defaults={'strokes': entry['strokes']},
            )

        return Response({'detail': 'Scores saved.'})


class GameHistoryView(generics.ListAPIView):
    serializer_class = GameHistorySerializer

    def get_queryset(self):
        user = self.request.user
        total_score_subquery = Score.objects.filter(
            game_player__game=OuterRef('pk'),
            game_player__user=user,
        ).values('game_player__game').annotate(total=Sum('strokes')).values('total')

        return (
            Game.objects.filter(players__user=user)
            .annotate(total_score=Subquery(total_score_subquery, output_field=IntegerField()))
            .distinct()
        )
