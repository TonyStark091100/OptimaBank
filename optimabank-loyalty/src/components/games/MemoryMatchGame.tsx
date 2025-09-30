import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  Fade,
  Zoom
} from '@mui/material';
import { EmojiEvents, Refresh } from '@mui/icons-material';

interface CardData {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface MemoryMatchGameProps {
  onScoreUpdate: (score: number) => void;
  onGameComplete: (finalScore: number) => void;
  timeLeft: number;
  isPlaying: boolean;
}

const MemoryMatchGame: React.FC<MemoryMatchGameProps> = ({
  onScoreUpdate,
  onGameComplete,
  timeLeft,
  isPlaying
}) => {
  const [cards, setCards] = useState<CardData[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matches, setMatches] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  const initializeGame = useCallback(() => {
    // Emoji pairs for the memory game
    const emojiPairs = [
      '🎯', '🎮', '🎲', '🎪', '🎨', '🎭', '🎸', '🎺',
      '🏆', '🏅', '🥇', '🥈', '🥉', '🎖️', '🏵️', '🎗️'
    ];
    
    // Create pairs of cards
    const cardPairs = [...emojiPairs.slice(0, 8)]; // Use 8 pairs for 16 cards
    const gameCards = [...cardPairs, ...cardPairs]
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false
      }))
      .sort(() => Math.random() - 0.5); // Shuffle cards

    setCards(gameCards);
    setFlippedCards([]);
    setMatches(0);
    setMoves(0);
    setGameStarted(true);
  }, []);

  useEffect(() => {
    if (isPlaying && !gameStarted) {
      initializeGame();
    }
  }, [isPlaying, gameStarted, initializeGame]);

  const handleGameEnd = useCallback(() => {
    const finalScore = matches * 10 + (30 - timeLeft) * 2;
    onGameComplete(finalScore);
  }, [matches, timeLeft, onGameComplete]);

  useEffect(() => {
    if (timeLeft <= 0 && isPlaying) {
      handleGameEnd();
    }
  }, [timeLeft, isPlaying, handleGameEnd]);

  const handleCardClick = (cardId: number) => {
    if (!isPlaying || flippedCards.length >= 2) return;

    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    setCards(prevCards =>
      prevCards.map(c =>
        c.id === cardId ? { ...c, isFlipped: true } : c
      )
    );

    if (newFlippedCards.length === 2) {
      setMoves(prev => prev + 1);
      checkForMatch(newFlippedCards);
    }
  };

  const checkForMatch = (flippedIds: number[]) => {
    setTimeout(() => {
      const [firstId, secondId] = flippedIds;
      const firstCard = cards.find(c => c.id === firstId);
      const secondCard = cards.find(c => c.id === secondId);

      if (firstCard && secondCard && firstCard.emoji === secondCard.emoji) {
        // Match found
        setCards(prevCards =>
          prevCards.map(c =>
            c.id === firstId || c.id === secondId
              ? { ...c, isMatched: true, isFlipped: false }
              : c
          )
        );
        setMatches(prev => prev + 1);
        onScoreUpdate((matches + 1) * 10);
      } else {
        // No match, flip cards back
        setCards(prevCards =>
          prevCards.map(c =>
            c.id === firstId || c.id === secondId
              ? { ...c, isFlipped: false }
              : c
          )
        );
      }
      setFlippedCards([]);
    }, 1000);
  };

  const resetGame = () => {
    setGameStarted(false);
    initializeGame();
  };

  // Check if game is won
  useEffect(() => {
    if (matches === 8 && isPlaying) {
      setTimeout(() => {
        handleGameEnd();
      }, 500);
    }
  }, [matches, isPlaying, handleGameEnd]);

  if (!gameStarted) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h5" sx={{ mb: 3, color: '#A259FF' }}>
          🧠 Memory Match
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, color: 'rgba(255,255,255,0.7)' }}>
          Match pairs of cards to earn points! Find all 8 pairs before time runs out.
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
          Start Game
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Game Stats */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Typography variant="body2" sx={{ color: '#4CAF50' }}>
            Matches: {matches}/8
          </Typography>
          <Typography variant="body2" sx={{ color: '#FF9800' }}>
            Moves: {moves}
          </Typography>
        </Box>
        <Button
          startIcon={<Refresh />}
          onClick={resetGame}
          size="small"
          sx={{ color: '#A259FF' }}
        >
          Reset
        </Button>
      </Box>

      {/* Game Grid */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: 1, 
        maxWidth: 400, 
        mx: 'auto' 
      }}>
        {cards.map((card) => (
          <Fade in={true} timeout={300} key={card.id}>
            <Card
              onClick={() => handleCardClick(card.id)}
              sx={{
                height: 80,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: card.isFlipped || card.isMatched
                  ? 'linear-gradient(135deg, #A259FF 0%, #8a3ffb 100%)'
                  : 'linear-gradient(135deg, #2D1B69 0%, #1E103C 100%)',
                border: card.isMatched
                  ? '2px solid #4CAF50'
                  : '2px solid rgba(255,255,255,0.1)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: '0 4px 12px rgba(162, 89, 255, 0.3)'
                }
              }}
            >
              <CardContent sx={{ p: 0 }}>
                {card.isFlipped || card.isMatched ? (
                  <Zoom in={true} timeout={200}>
                    <Typography sx={{ fontSize: '2rem' }}>
                      {card.emoji}
                    </Typography>
                  </Zoom>
                ) : (
                  <Typography sx={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.3)' }}>
                    ?
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Fade>
        ))}
      </Box>

      {/* Game Instructions */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
          Click cards to flip them and find matching pairs!
        </Typography>
      </Box>

      {/* Win Condition */}
      {matches === 8 && (
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Zoom in={true}>
            <Paper sx={{ 
              p: 2, 
              background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
              color: 'white'
            }}>
              <EmojiEvents sx={{ fontSize: '3rem', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                🎉 Perfect Memory! All pairs matched!
              </Typography>
            </Paper>
          </Zoom>
        </Box>
      )}
    </Box>
  );
};

export default MemoryMatchGame;
