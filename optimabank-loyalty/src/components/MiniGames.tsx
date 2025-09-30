import React, { useState, useEffect } from 'react';
import { gamesApi, MiniGame, GameSession, GameScoreResult } from '../services/api';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  LinearProgress,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Close,
  PlayArrow,
  Timer,
  Score,
  SportsEsports
} from '@mui/icons-material';
import MemoryMatchGame from './games/MemoryMatchGame';
import ReactionTimeGame from './games/ReactionTimeGame';
import SequenceMasterGame from './games/SequenceMasterGame';
import SpeedTypingGame from './games/SpeedTypingGame';
// Leaderboard removed - using homepage leaderboard instead

interface MiniGameProps {
  open: boolean;
  onClose: () => void;
  onGameComplete: (points: number, gameName: string) => void;
  onShowSnackbar: (message: string, severity: 'success' | 'error' | 'warning' | 'info') => void;
}

interface GameState {
  score: number;
  timeLeft: number;
  isPlaying: boolean;
  isCompleted: boolean;
  level: number;
  streak: number;
}

const MiniGames: React.FC<MiniGameProps> = ({
  open,
  onClose,
  onGameComplete,
  onShowSnackbar
}) => {
  // State for backend integration
  const [games, setGames] = useState<MiniGame[]>([]);
  const [gameHistory, setGameHistory] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  // Removed showLeaderboard state - using homepage leaderboard instead
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    timeLeft: 60, // Increased to 60 seconds for better gameplay
    isPlaying: false,
    isCompleted: false,
    level: 1,
    streak: 0
  });

  // Load games from backend
  useEffect(() => {
    if (open) {
      loadGames();
      loadGameHistory();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Game timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState.isPlaying && gameState.timeLeft > 0) {
      interval = setInterval(() => {
        setGameState(prev => {
          const newTimeLeft = prev.timeLeft - 1;
          if (newTimeLeft <= 0) {
            endGame();
            return { ...prev, timeLeft: 0, isPlaying: false };
          }
          return { ...prev, timeLeft: newTimeLeft };
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameState.isPlaying, gameState.timeLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadGames = async () => {
    try {
      setLoading(true);
      const gamesData = await gamesApi.getGames();
      setGames(gamesData);
    } catch (error) {
      onShowSnackbar('Failed to load games', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadGameHistory = async () => {
    try {
      const history = await gamesApi.getGameHistory();
      setGameHistory(history);
    } catch (error) {
      console.error('Failed to load game history:', error);
    }
  };

  const submitScore = async (gameType: string, score: number, duration: number) => {
    try {
      const game = games.find(g => g.game_type === gameType);
      if (!game) return;

      const result: GameScoreResult = await gamesApi.submitScore(game.id, score, duration);
      
      onShowSnackbar(`🎉 You earned ${result.points_earned} points!`, 'success');
      
      // Refresh game history
      loadGameHistory();
      
      return result;
    } catch (error) {
      onShowSnackbar('Failed to submit score', 'error');
      throw error;
    }
  };

  // Use backend games data, fallback to mock data if loading
  const displayGames = games.length > 0 ? games : [
    {
      id: 1,
      name: 'Memory Match',
      game_type: 'memory_game' as const,
      description: 'Match pairs of cards to earn points',
      base_points: 10,
      max_points: 100
    },
    {
      id: 2,
      name: 'Reaction Time',
      game_type: 'spin_wheel' as const,
      description: 'Click when you see the green light',
      base_points: 15,
      max_points: 150
    },
    {
      id: 3,
      name: 'Sequence Master',
      game_type: 'trivia_quiz' as const,
      description: 'Repeat the color sequence',
      base_points: 20,
      max_points: 200
    },
    {
      id: 4,
      name: 'Speed Typing',
      game_type: 'daily_challenge' as const,
      description: 'Type words as fast as you can',
      base_points: 25,
      max_points: 180
    }
  ];

  const startGame = (gameId: number | string) => {
    setSelectedGame(String(gameId));
    setGameState({
      score: 0,
      timeLeft: 60,
      isPlaying: true,
      isCompleted: false,
      level: 1,
      streak: 0
    });
  };

  const endGame = async () => {
    if (selectedGame && gameState.score > 0) {
      const game = displayGames.find(g => g.id === Number(selectedGame));
      if (game) {
        // Submit score to backend
        try {
          await submitScore(game.game_type, gameState.score, 60 - gameState.timeLeft);
        } catch (error) {
          console.error('Failed to submit score:', error);
        }
      }
    }
    
    setGameState(prev => ({ ...prev, isPlaying: false, isCompleted: true }));
  };

  const resetGame = () => {
    setSelectedGame(null);
    setGameState({
      score: 0,
      timeLeft: 60,
      isPlaying: false,
      isCompleted: false,
      level: 1,
      streak: 0
    });
  };

  const getGameIcon = (gameType: string) => {
    switch (gameType) {
      case 'memory_game': return '🧠';
      case 'spin_wheel': return '⚡';
      case 'trivia_quiz': return '🎯';
      case 'daily_challenge': return '⌨️';
      default: return '🎮';
    }
  };

  const getGameColor = (gameType: string) => {
    switch (gameType) {
      case 'memory_game': return '#4CAF50';
      case 'spin_wheel': return '#FF9800';
      case 'trivia_quiz': return '#E91E63';
      case 'daily_challenge': return '#2196F3';
      default: return '#A259FF';
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes slideShade {
            0% { left: -100%; }
            50% { left: 100%; }
            100% { left: -100%; }
          }
        `}
      </style>
      <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, #1E103C 0%, #2D1B69 100%)',
          color: 'white',
          borderRadius: isMobile ? 0 : 3
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        pb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SportsEsports sx={{ color: '#A259FF', fontSize: 28 }} />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Mini-Games
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <LinearProgress sx={{ width: '100%', bgcolor: 'rgba(255,255,255,0.1)' }} />
          </Box>
        ) : (
          <Box>
            {!selectedGame ? (
              // Game Selection
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ color: '#A259FF' }}>
                    Choose a game to play and earn bonus points!
                  </Typography>
                  {/* Leaderboard button removed - using homepage leaderboard instead */}
                </Box>
                
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(2, 1fr)' },
                  gap: 2
                }}>
                  {displayGames.map((game) => (
                    <Paper
                      key={game.id}
                      onClick={() => startGame(game.id)}
                      sx={{
                        p: 3,
                        textAlign: 'center',
                        cursor: 'pointer',
                        border: `2px solid ${getGameColor(game.game_type)}`,
                        borderRadius: 3,
                        background: `
                          linear-gradient(135deg, 
                            ${getGameColor(game.game_type)}20 0%, 
                            ${getGameColor(game.game_type)}12 30%,
                            ${getGameColor(game.game_type)}08 70%,
                            rgba(255, 255, 255, 0.03) 100%
                          )
                        `,
                        transition: 'all 0.3s ease',
                        boxShadow: `0 2px 8px ${getGameColor(game.game_type)}20`,
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: -50,
                          right: -50,
                          width: 100,
                          height: 100,
                          background: `radial-gradient(circle, ${getGameColor(game.game_type)}25 0%, transparent 70%)`,
                          borderRadius: '50%',
                          opacity: 0.8,
                          transition: 'all 0.3s ease',
                        },
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: -30,
                          left: -30,
                          width: 80,
                          height: 80,
                          background: `radial-gradient(circle, ${getGameColor(game.game_type)}15 0%, transparent 70%)`,
                          borderRadius: '50%',
                          opacity: 0.6,
                          transition: 'all 0.3s ease',
                        },
                        ...(game.game_type === 'memory_game' && {
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: '-100%',
                            width: '100%',
                            height: '100%',
                            background: `linear-gradient(90deg, transparent 0%, ${getGameColor(game.game_type)}15 50%, transparent 100%)`,
                            opacity: 0.4,
                            transition: 'all 0.6s ease',
                            animation: 'slideShade 3s ease-in-out infinite',
                          },
                        }),
                        '&:hover': {
                          boxShadow: `0 8px 25px ${getGameColor(game.game_type)}30`,
                          transform: 'translateY(-4px)',
                          border: `3px solid ${getGameColor(game.game_type)}`,
                          background: `
                            linear-gradient(135deg, 
                              ${getGameColor(game.game_type)}30 0%, 
                              ${getGameColor(game.game_type)}18 30%,
                              ${getGameColor(game.game_type)}12 70%,
                              rgba(255, 255, 255, 0.05) 100%
                            )
                          `,
                          '&::before': {
                            opacity: 1,
                            transform: 'scale(1.1)',
                          },
                          '&::after': {
                            opacity: 0.8,
                            transform: 'scale(1.1)',
                          }
                        }
                      }}
                    >
                      <Box sx={{ position: 'relative', zIndex: 1 }}>
                        <Typography sx={{ fontSize: '3rem', mb: 1 }}>
                          {getGameIcon(game.game_type)}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                          {game.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
                          {game.description}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Chip
                            label={`${game.base_points}-${game.max_points} pts`}
                            size="small"
                            sx={{
                              bgcolor: getGameColor(game.game_type),
                              color: 'white',
                              fontWeight: 600
                            }}
                          />
                          <Button
                            startIcon={<PlayArrow />}
                            sx={{
                              color: getGameColor(game.game_type),
                              fontWeight: 600
                            }}
                          >
                            Play
                          </Button>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Box>

                {/* Game History */}
                {gameHistory.length > 0 && (
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" sx={{ mb: 2, color: '#A259FF' }}>
                      Recent Games
                    </Typography>
                    <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                      {gameHistory.slice(0, 5).map((session) => (
                        <Paper
                          key={session.id}
                          sx={{
                            p: 2,
                            mb: 1,
                            bgcolor: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)'
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {session.game_name}
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                {new Date(session.played_at).toLocaleDateString()}
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="h6" sx={{ color: '#4CAF50' }}>
                                +{session.points_earned} pts
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                Score: {session.score}
                              </Typography>
                            </Box>
                          </Box>
                        </Paper>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            ) : (
              // Game Play Area
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6">
                    {displayGames.find(g => g.id === Number(selectedGame))?.name}
                  </Typography>
                  <Button onClick={resetGame} startIcon={<Close />}>
                    Back to Games
                  </Button>
                </Box>

                {/* Game Timer and Score */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Timer sx={{ color: '#A259FF' }} />
                    <Typography variant="h6">
                      {gameState.timeLeft}s
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Score sx={{ color: '#4CAF50' }} />
                    <Typography variant="h6">
                      {gameState.score} points
                    </Typography>
                  </Box>
                </Box>

                {/* Game Components */}
                <Paper
                  sx={{
                    p: 3,
                    bgcolor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    minHeight: 500
                  }}
                >
                  {selectedGame === '1' && (
                    <MemoryMatchGame
                      onScoreUpdate={(score) => setGameState(prev => ({ ...prev, score: prev.score + score }))}
                      onGameComplete={(finalScore) => {
                        setGameState(prev => ({ ...prev, score: finalScore, isCompleted: true }));
                        endGame();
                      }}
                      timeLeft={gameState.timeLeft}
                      isPlaying={gameState.isPlaying}
                    />
                  )}
                  
                  {selectedGame === '2' && (
                    <ReactionTimeGame
                      onScoreUpdate={(score) => setGameState(prev => ({ ...prev, score: prev.score + score }))}
                      onGameComplete={(finalScore) => {
                        setGameState(prev => ({ ...prev, score: finalScore, isCompleted: true }));
                        endGame();
                      }}
                      timeLeft={gameState.timeLeft}
                      isPlaying={gameState.isPlaying}
                    />
                  )}
                  
                  {selectedGame === '3' && (
                    <SequenceMasterGame
                      onScoreUpdate={(score) => setGameState(prev => ({ ...prev, score: prev.score + score }))}
                      onGameComplete={(finalScore) => {
                        setGameState(prev => ({ ...prev, score: finalScore, isCompleted: true }));
                        endGame();
                      }}
                      timeLeft={gameState.timeLeft}
                      isPlaying={gameState.isPlaying}
                    />
                  )}
                  
                  {selectedGame === '4' && (
                    <SpeedTypingGame
                      onScoreUpdate={(score) => setGameState(prev => ({ ...prev, score: prev.score + score }))}
                      onGameComplete={(finalScore) => {
                        setGameState(prev => ({ ...prev, score: finalScore, isCompleted: true }));
                        endGame();
                      }}
                      timeLeft={gameState.timeLeft}
                      isPlaying={gameState.isPlaying}
                    />
                  )}
                </Paper>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button
          onClick={onClose}
          sx={{
            background: 'rgba(255,255,255,0.1)',
            color: 'white',
            '&:hover': { background: 'rgba(255,255,255,0.2)' }
          }}
        >
          Close
        </Button>
      </DialogActions>

      {/* Leaderboard removed - using homepage leaderboard instead */}
    </Dialog>
    </>
  );
};

export default MiniGames;