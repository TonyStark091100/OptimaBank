import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Fade,
  Zoom,
  CircularProgress
} from '@mui/material';
import { Psychology, CheckCircle, Error } from '@mui/icons-material';

interface SequenceMasterGameProps {
  onScoreUpdate: (score: number) => void;
  onGameComplete: (finalScore: number) => void;
  timeLeft: number;
  isPlaying: boolean;
}

interface ColorSequence {
  id: number;
  color: string;
  emoji: string;
  sound: string;
}

interface GameState {
  sequence: number[];
  userSequence: number[];
  currentStep: number;
  isShowing: boolean;
  isPlaying: boolean;
  level: number;
  score: number;
}

const SequenceMasterGame: React.FC<SequenceMasterGameProps> = ({
  onScoreUpdate,
  onGameComplete,
  timeLeft,
  isPlaying
}) => {
  const [gameState, setGameState] = useState<GameState>({
    sequence: [],
    userSequence: [],
    currentStep: 0,
    isShowing: false,
    isPlaying: false,
    level: 1,
    score: 0
  });
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: ''
  });

  const colors: ColorSequence[] = [
    { id: 0, color: '#F44336', emoji: '🔴', sound: 'red' },
    { id: 1, color: '#4CAF50', emoji: '🟢', sound: 'green' },
    { id: 2, color: '#2196F3', emoji: '🔵', sound: 'blue' },
    { id: 3, color: '#FF9800', emoji: '🟡', sound: 'yellow' },
    { id: 4, color: '#9C27B0', emoji: '🟣', sound: 'purple' },
    { id: 5, color: '#FF5722', emoji: '🟠', sound: 'orange' }
  ];

  const initializeGame = useCallback(() => {
    const initialSequence = [Math.floor(Math.random() * 6)];
    setGameState({
      sequence: initialSequence,
      userSequence: [],
      currentStep: 0,
      isShowing: true,
      isPlaying: false,
      level: 1,
      score: 0
    });
    setGameStarted(true);
    setGameOver(false);
    setFeedback({ type: null, message: '' });
  }, []);

  useEffect(() => {
    if (isPlaying && !gameStarted) {
      initializeGame();
    }
  }, [isPlaying, gameStarted, initializeGame]);

  const handleGameEnd = useCallback(() => {
    const finalScore = gameState.score;
    onGameComplete(finalScore);
  }, [gameState.score, onGameComplete]);

  useEffect(() => {
    if (timeLeft <= 0 && isPlaying) {
      handleGameEnd();
    }
  }, [timeLeft, isPlaying, handleGameEnd]);

  const showSequence = useCallback(async () => {
    for (let i = 0; i < gameState.sequence.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      // In a real implementation, you would highlight the color here
      await new Promise(resolve => setTimeout(resolve, 400));
    }
    
    setGameState(prev => ({ ...prev, isShowing: false, isPlaying: true }));
  }, [gameState.sequence.length]);

  useEffect(() => {
    if (gameState.isShowing && gameState.sequence.length > 0) {
      showSequence();
    }
  }, [gameState.isShowing, gameState.sequence, showSequence]);

  const handleColorClick = (colorId: number) => {
    if (!gameState.isPlaying || gameOver) return;

    const newUserSequence = [...gameState.userSequence, colorId];
    setGameState(prev => ({ ...prev, userSequence: newUserSequence }));

    // Check if the click is correct
    const expectedColor = gameState.sequence[newUserSequence.length - 1];
    
    if (colorId === expectedColor) {
      // Correct click
      if (newUserSequence.length === gameState.sequence.length) {
        // Sequence completed correctly
        const levelScore = gameState.level * 20;
        const newScore = gameState.score + levelScore;
        
        setGameState(prev => ({
          ...prev,
          score: newScore,
          level: prev.level + 1,
          userSequence: [],
          isShowing: true
        }));
        
        onScoreUpdate(levelScore);
        setFeedback({ type: 'success', message: `Level ${gameState.level} Complete! +${levelScore} points` });
        
        // Add next color to sequence
        setTimeout(() => {
          const nextColor = Math.floor(Math.random() * 6);
          setGameState(prev => ({
            ...prev,
            sequence: [...prev.sequence, nextColor],
            currentStep: 0
          }));
          setFeedback({ type: null, message: '' });
        }, 1500);
      }
    } else {
      // Wrong color clicked
      setGameOver(true);
      setFeedback({ type: 'error', message: 'Wrong sequence! Game Over!' });
      setTimeout(() => {
        handleGameEnd();
      }, 2000);
    }
  };

  const resetGame = () => {
    setGameStarted(false);
    initializeGame();
  };

  const getColorStyle = (colorId: number) => {
    const color = colors[colorId];
    return {
      backgroundColor: color.color,
      color: 'white',
      border: '3px solid rgba(255,255,255,0.3)',
      '&:hover': {
        transform: 'scale(1.05)',
        boxShadow: `0 8px 16px ${color.color}40`
      }
    };
  };

  if (!gameStarted) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h5" sx={{ mb: 3, color: '#A259FF' }}>
          🎯 Sequence Master
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, color: 'rgba(255,255,255,0.7)' }}>
          Watch the sequence and repeat it! Each level adds one more color. How far can you go?
        </Typography>
        <Button
          variant="contained"
          onClick={initializeGame}
          sx={{
            background: 'linear-gradient(45deg, #A259FF 30%, #8a3ffb 90%)',
            px: 4,
            py: 1.5
          }}
        >
          Start Challenge
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Game Stats */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="body2" sx={{ color: '#4CAF50' }}>
          Level: {gameState.level}
        </Typography>
        <Typography variant="body2" sx={{ color: '#FF9800' }}>
          Score: {gameState.score}
        </Typography>
      </Box>

      {/* Feedback */}
      {feedback.type && (
        <Fade in={true}>
          <Paper sx={{
            p: 2,
            mb: 3,
            textAlign: 'center',
            background: feedback.type === 'success'
              ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'
              : 'linear-gradient(135deg, #F44336 0%, #D32F2F 100%)',
            color: 'white'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              {feedback.type === 'success' ? (
                <CheckCircle sx={{ fontSize: '1.5rem' }} />
              ) : (
                <Error sx={{ fontSize: '1.5rem' }} />
              )}
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {feedback.message}
              </Typography>
            </Box>
          </Paper>
        </Fade>
      )}

      {/* Game Area */}
      <Box sx={{ mb: 4 }}>
        {gameState.isShowing ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Psychology sx={{ fontSize: '3rem', color: '#A259FF', mb: 2 }} />
            <Typography variant="h6" sx={{ color: 'white' }}>
              Watch the sequence carefully...
            </Typography>
            <CircularProgress sx={{ color: '#A259FF', mt: 2 }} />
          </Box>
        ) : (
          <Box>
            <Typography variant="h6" sx={{ textAlign: 'center', mb: 3, color: '#A259FF' }}>
              Now repeat the sequence!
            </Typography>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: 2, 
              maxWidth: 400, 
              mx: 'auto' 
            }}>
              {colors.slice(0, 6).map((color) => (
                <Zoom in={true} key={color.id}>
                  <Paper
                    onClick={() => handleColorClick(color.id)}
                    sx={{
                      height: 80,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: gameOver ? 'not-allowed' : 'pointer',
                      opacity: gameOver ? 0.5 : 1,
                      transition: 'all 0.3s ease',
                      ...getColorStyle(color.id)
                    }}
                  >
                    <Typography sx={{ fontSize: '2rem' }}>
                      {color.emoji}
                    </Typography>
                  </Paper>
                </Zoom>
              ))}
            </Box>
          </Box>
        )}
      </Box>

      {/* Current Sequence Progress */}
      {gameState.isPlaying && gameState.userSequence.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ color: '#A259FF', mb: 1 }}>
            Your sequence:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
            {gameState.userSequence.map((colorId, index) => (
              <Paper
                key={index}
                sx={{
                  p: 1,
                  minWidth: 40,
                  textAlign: 'center',
                  background: colors[colorId].color,
                  color: 'white'
                }}
              >
                <Typography sx={{ fontSize: '1.2rem' }}>
                  {colors[colorId].emoji}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Box>
      )}

      {/* Game Instructions */}
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
          Click the colors in the same order they appeared!
        </Typography>
        <Button
          onClick={resetGame}
          size="small"
          sx={{ color: '#A259FF', mt: 1 }}
        >
          Reset Game
        </Button>
      </Box>
    </Box>
  );
};

export default SequenceMasterGame;
