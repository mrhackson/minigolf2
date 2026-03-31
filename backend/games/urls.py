from django.urls import path
from . import views

urlpatterns = [
    path('', views.GameListCreateView.as_view(), name='game-list-create'),
    path('<int:pk>/', views.GameDetailView.as_view(), name='game-detail'),
    path('<int:pk>/scores/', views.ScoreView.as_view(), name='game-scores'),
    path('join/<uuid:invite_code>/', views.JoinGameView.as_view(), name='join-game'),
    path('history/', views.GameHistoryView.as_view(), name='game-history'),
]
