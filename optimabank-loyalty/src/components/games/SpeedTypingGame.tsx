import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  LinearProgress,
  Fade
} from '@mui/material';
import { CheckCircle, Error } from '@mui/icons-material';

interface SpeedTypingGameProps {
  onScoreUpdate: (score: number) => void;
  onGameComplete: (finalScore: number) => void;
  timeLeft: number;
  isPlaying: boolean;
}

interface WordChallenge {
  word: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
}

interface GameState {
  currentWord: string;
  userInput: string;
  wordIndex: number;
  wordsCompleted: number;
  correctChars: number;
  totalChars: number;
  currentLevel: number;
  score: number;
}

const SpeedTypingGame: React.FC<SpeedTypingGameProps> = ({
  onScoreUpdate,
  onGameComplete,
  timeLeft,
  isPlaying
}) => {
  const [gameState, setGameState] = useState<GameState>({
    currentWord: '',
    userInput: '',
    wordIndex: 0,
    wordsCompleted: 0,
    correctChars: 0,
    totalChars: 0,
    currentLevel: 1,
    score: 0
  });
  const [gameStarted, setGameStarted] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: ''
  });
  const [gameWords] = useState<WordChallenge[]>([
    { word: 'bank', difficulty: 'easy', points: 10 },
    { word: 'money', difficulty: 'easy', points: 10 },
    { word: 'reward', difficulty: 'easy', points: 10 },
    { word: 'points', difficulty: 'easy', points: 10 },
    { word: 'voucher', difficulty: 'easy', points: 10 },
    { word: 'account', difficulty: 'medium', points: 15 },
    { word: 'deposit', difficulty: 'medium', points: 15 },
    { word: 'interest', difficulty: 'medium', points: 15 },
    { word: 'balance', difficulty: 'medium', points: 15 },
    { word: 'transaction', difficulty: 'hard', points: 20 },
    { word: 'investment', difficulty: 'hard', points: 20 },
    { word: 'authentication', difficulty: 'hard', points: 20 },
    { word: 'cryptocurrency', difficulty: 'hard', points: 25 },
    { word: 'entrepreneurship', difficulty: 'hard', points: 25 }
  ]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const initializeGame = useCallback(() => {
    const firstWord = gameWords[0];
    setGameState({
      currentWord: firstWord.word,
      userInput: '',
      wordIndex: 0,
      wordsCompleted: 0,
      correctChars: 0,
      totalChars: firstWord.word.length,
      currentLevel: 1,
      score: 0
    });
    setCurrentWordIndex(0);
    setGameStarted(true);
    setFeedback({ type: null, message: '' });
    
    // Focus the input field
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  }, [gameWords]);

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

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value.toLowerCase();
    setGameState(prev => ({ ...prev, userInput: input }));

    // Check if word is completed
    if (input === gameState.currentWord.toLowerCase()) {
      handleWordComplete();
    }
  };

  const handleWordComplete = () => {
    const currentWordData = gameWords[currentWordIndex];
    const wordScore = currentWordData.points;
    const accuracyBonus = Math.floor((gameState.correctChars / gameState.totalChars) * 10);
    const totalWordScore = wordScore + accuracyBonus;

    setGameState(prev => ({
      ...prev,
      wordsCompleted: prev.wordsCompleted + 1,
      score: prev.score + totalWordScore,
      correctChars: prev.correctChars + gameState.currentWord.length,
      totalChars: prev.totalChars + gameState.currentWord.length
    }));

    onScoreUpdate(totalWordScore);
    setFeedback({ type: 'success', message: `+${totalWordScore} points!` });

    // Move to next word
    setTimeout(() => {
      const nextIndex = (currentWordIndex + 1) % gameWords.length;
      const nextWord = gameWords[nextIndex];
      
      setGameState(prev => ({
        ...prev,
        currentWord: nextWord.word,
        userInput: '',
        wordIndex: nextIndex,
        totalChars: prev.totalChars + nextWord.word.length,
        currentLevel: Math.floor(prev.wordsCompleted / 5) + 1
      }));
      setCurrentWordIndex(nextIndex);
      setFeedback({ type: null, message: '' });
      
      // Focus input again
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 1000);
  };

  const resetGame = () => {
    setGameStarted(false);
    initializeGame();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#F44336';
      default: return '#A259FF';
    }
  };

  const getWPM = () => {
    const timeElapsed = 30 - timeLeft;
    if (timeElapsed === 0) return 0;
    return Math.floor((gameState.wordsCompleted * 60) / timeElapsed);
  };

  const getAccuracy = () => {
    if (gameState.totalChars === 0) return 100;
    return Math.floor((gameState.correctChars / gameState.totalChars) * 100);
  };

  if (!gameStarted) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h5" sx={{ mb: 3, color: '#A259FF' }}>
          ⌨️ Speed Typing Challenge
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, color: 'rgba(255,255,255,0.7)' }}>
          Type the words as fast as you can! Earn bonus points for accuracy and speed.
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
          Start Typing
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Game Stats */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="body2" sx={{ color: '#4CAF50' }}>
            Words: {gameState.wordsCompleted}
          </Typography>
          <Typography variant="body2" sx={{ color: '#FF9800' }}>
            Level: {gameState.currentLevel}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="body2" sx={{ color: '#2196F3' }}>
            WPM: {getWPM()}
          </Typography>
          <Typography variant="body2" sx={{ color: '#9C27B0' }}>
            Accuracy: {getAccuracy()}%
          </Typography>
        </Box>
      </Box>

      {/* Progress Bar */}
      <LinearProgress
        variant="determinate"
        value={(gameState.wordsCompleted / 20) * 100}
        sx={{
          height: 8,
          borderRadius: 4,
          mb: 3,
          backgroundColor: 'rgba(255,255,255,0.1)',
          '& .MuiLinearProgress-bar': {
            background: 'linear-gradient(90deg, #A259FF 0%, #8a3ffb 100%)'
          }
        }}
      />

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
        {/* Current Word Display */}
        <Paper sx={{
          p: 4,
          mb: 3,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #2D1B69 0%, #1E103C 100%)',
          border: '2px solid rgba(162, 89, 255, 0.3)'
        }}>
          <Typography variant="h4" sx={{ 
            color: 'white', 
            fontWeight: 'bold',
            letterSpacing: '0.2em',
            mb: 2
          }}>
            {gameState.currentWord.toUpperCase()}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Difficulty:
            </Typography>
            <Box sx={{
              px: 2,
              py: 0.5,
              borderRadius: 2,
              backgroundColor: getDifficultyColor(gameWords[currentWordIndex].difficulty),
              color: 'white',
              fontWeight: 'bold'
            }}>
              {gameWords[currentWordIndex].difficulty.toUpperCase()}
            </Box>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Points: {gameWords[currentWordIndex].points}
            </Typography>
          </Box>
        </Paper>

        {/* Input Field */}
        <TextField
          ref={inputRef}
          fullWidth
          value={gameState.userInput}
          onChange={handleInputChange}
          placeholder="Type the word here..."
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(255,255,255,0.05)',
              color: 'white',
              fontSize: '1.2rem',
              '& fieldset': {
                borderColor: 'rgba(162, 89, 255, 0.3)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(162, 89, 255, 0.5)',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#A259FF',
              },
            },
            '& .MuiInputBase-input': {
              textAlign: 'center',
              fontWeight: 'bold'
            }
          }}
        />
      </Box>

      {/* Score Display */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ color: '#A259FF', fontWeight: 'bold' }}>
          Score: {gameState.score}
        </Typography>
      </Box>

      {/* Game Instructions */}
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
          Type each word exactly as shown. Faster typing = more points!
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

export default SpeedTypingGame;
