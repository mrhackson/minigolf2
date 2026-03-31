from django.urls import path
from . import views

urlpatterns = [
    path('', views.GameListCreateView.as_view(), name='game-list-create'),
    path('<int:pk>/', views.GameDetailView.as_view(), name='game-detail'),
    path('<int:pk>/scores/', views.ScoreView.as_view(), name='game-scores'),
    path('<int:pk>/bulk-scores/', views.BulkScoreView.as_view(), name='game-bulk-scores'),
    path('<int:pk>/guest-players/', views.GuestPlayerView.as_view(), name='game-guest-players'),
    path('<int:pk>/guest-players/<int:guest_id>/', views.GuestPlayerView.as_view(), name='game-guest-player-detail'),
    path('join/<uuid:invite_code>/', views.JoinGameView.as_view(), name='join-game'),
    path('history/', views.GameHistoryView.as_view(), name='game-history'),
]
