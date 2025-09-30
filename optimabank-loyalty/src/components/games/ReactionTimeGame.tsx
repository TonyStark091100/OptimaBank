import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Fade,
  Zoom
} from '@mui/material';
import { FlashOn, Timer, Speed } from '@mui/icons-material';

interface ReactionTimeGameProps {
  onScoreUpdate: (score: number) => void;
  onGameComplete: (finalScore: number) => void;
  timeLeft: number;
  isPlaying: boolean;
}

interface GameRound {
  id: number;
  startTime: number;
  reactionTime: number;
  isCompleted: boolean;
}

const ReactionTimeGame: React.FC<ReactionTimeGameProps> = ({
  onScoreUpdate,
  onGameComplete,
  timeLeft,
  isPlaying
}) => {
  const [gameState, setGameState] = useState<'waiting' | 'ready' | 'go' | 'completed'>('waiting');
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds] = useState(5);
  const [rounds, setRounds] = useState<GameRound[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [, setWaitTime] = useState(0);
  const [showGreen, setShowGreen] = useState(false);
  const [clickTime, setClickTime] = useState(0);

  const initializeGame = useCallback(() => {
    setGameState('waiting');
    setCurrentRound(1);
    setRounds([]);
    setGameStarted(true);
    setWaitTime(0);
    setShowGreen(false);
    setClickTime(0);
  }, []);

  useEffect(() => {
    if (isPlaying && !gameStarted) {
      initializeGame();
    }
  }, [isPlaying, gameStarted, initializeGame]);

  const handleGameEnd = useCallback(() => {
    const totalScore = rounds.reduce((sum, round) => {
      if (round.reactionTime > 0) {
        return sum + Math.max(0, 1000 - round.reactionTime) / 10;
      }
      return sum - 5; // Penalty for early clicks
    }, 0);
    
    onGameComplete(Math.max(0, totalScore));
  }, [rounds, onGameComplete]);

  useEffect(() => {
    if (timeLeft <= 0 && isPlaying) {
      handleGameEnd();
    }
  }, [timeLeft, isPlaying, handleGameEnd]);


  const handleClick = () => {
    if (gameState !== 'go') {
      // Clicked too early - penalty
      const newRound: GameRound = {
        id: currentRound,
        startTime: clickTime,
        reactionTime: -1, // Penalty for clicking too early
        isCompleted: true
      };
      setRounds(prev => [...prev, newRound]);
      onScoreUpdate(-5);
      nextRound();
      return;
    }

    const reactionTime = Date.now() - clickTime;
    const score = Math.max(0, 1000 - reactionTime); // Better score for faster reactions

    const newRound: GameRound = {
      id: currentRound,
      startTime: clickTime,
      reactionTime: reactionTime,
      isCompleted: true
    };

    setRounds(prev => [...prev, newRound]);
    onScoreUpdate(Math.floor(score / 10)); // Convert to points

    setGameState('completed');
    setTimeout(() => {
      nextRound();
    }, 1500);
  };

  const nextRound = () => {
    if (currentRound < totalRounds) {
      setCurrentRound(prev => prev + 1);
      setGameState('waiting');
      setShowGreen(false);
    } else {
      handleGameEnd();
    }
  };

  const resetGame = () => {
    setGameStarted(false);
    initializeGame();
  };

  const getAverageReactionTime = () => {
    const validRounds = rounds.filter(r => r.reactionTime > 0);
    if (validRounds.length === 0) return 0;
    const total = validRounds.reduce((sum, r) => sum + r.reactionTime, 0);
    return Math.floor(total / validRounds.length);
  };

  const getGameStatusText = () => {
    switch (gameState) {
      case 'waiting':
        return 'Click to start the round!';
      case 'ready':
        return 'Wait for the green light...';
      case 'go':
        return 'NOW! Click as fast as you can!';
      case 'completed':
        return 'Great reaction! Next round...';
      default:
        return '';
    }
  };

  const getGameStatusColor = () => {
    switch (gameState) {
      case 'waiting':
        return '#FF9800';
      case 'ready':
        return '#FF5722';
      case 'go':
        return '#4CAF50';
      case 'completed':
        return '#2196F3';
      default:
        return '#A259FF';
    }
  };

  if (!gameStarted) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h5" sx={{ mb: 3, color: '#A259FF' }}>
          ⚡ Reaction Time Challenge
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, color: 'rgba(255,255,255,0.7)' }}>
          Test your reflexes! Click as soon as you see the green light. Complete {totalRounds} rounds.
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
      {/* Game Progress */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="body2" sx={{ color: '#A259FF' }}>
          Round {currentRound}/{totalRounds}
        </Typography>
        {rounds.length > 0 && (
          <Typography variant="body2" sx={{ color: '#4CAF50' }}>
            Avg: {getAverageReactionTime()}ms
          </Typography>
        )}
      </Box>

      {/* Game Area */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Paper
          onClick={handleClick}
          sx={{
            width: 300,
            height: 300,
            mx: 'auto',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: showGreen
              ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'
              : gameState === 'ready'
              ? 'linear-gradient(135deg, #FF5722 0%, #D32F2F 100%)'
              : 'linear-gradient(135deg, #2D1B69 0%, #1E103C 100%)',
            border: showGreen
              ? '3px solid #4CAF50'
              : gameState === 'ready'
              ? '3px solid #FF5722'
              : '3px solid rgba(255,255,255,0.1)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'scale(1.02)',
              boxShadow: '0 8px 24px rgba(162, 89, 255, 0.3)'
            }
          }}
        >
          {gameState === 'ready' && (
            <Fade in={true}>
              <Box>
                <CircularProgress
                  size={60}
                  sx={{ color: 'white', mb: 2 }}
                />
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                  WAIT...
                </Typography>
              </Box>
            </Fade>
          )}

          {showGreen && (
            <Zoom in={true}>
              <Box>
                <FlashOn sx={{ fontSize: '4rem', color: 'white', mb: 2 }} />
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                  CLICK NOW!
                </Typography>
              </Box>
            </Zoom>
          )}

          {gameState === 'waiting' && (
            <Box>
              <Timer sx={{ fontSize: '4rem', color: '#A259FF', mb: 2 }} />
              <Typography variant="h6" sx={{ color: 'white' }}>
                Click to Start
              </Typography>
            </Box>
          )}

          {gameState === 'completed' && (
            <Zoom in={true}>
              <Box>
                <Speed sx={{ fontSize: '4rem', color: '#2196F3', mb: 2 }} />
                <Typography variant="h6" sx={{ color: 'white' }}>
                  Good!
                </Typography>
              </Box>
            </Zoom>
          )}
        </Paper>

        <Typography 
          variant="h6" 
          sx={{ 
            mt: 2, 
            color: getGameStatusColor(),
            fontWeight: 'bold'
          }}
        >
          {getGameStatusText()}
        </Typography>
      </Box>

      {/* Round Results */}
      {rounds.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#A259FF' }}>
            Round Results
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
            {rounds.map((round) => (
              <Paper
                key={round.id}
                sx={{
                  p: 1,
                  minWidth: 80,
                  textAlign: 'center',
                  background: round.reactionTime > 0
                    ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'
                    : 'linear-gradient(135deg, #F44336 0%, #D32F2F 100%)',
                  color: 'white'
                }}
              >
                <Typography variant="caption" sx={{ display: 'block' }}>
                  Round {round.id}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {round.reactionTime > 0 ? `${round.reactionTime}ms` : 'Too Early'}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Box>
      )}

      {/* Game Instructions */}
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
          Click when you see green! Don't click too early or you'll get a penalty.
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

export default ReactionTimeGame;
