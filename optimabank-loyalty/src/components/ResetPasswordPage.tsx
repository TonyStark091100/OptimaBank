import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Paper, Alert } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { userApi } from '../services/api';

const ResetPasswordPage: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [uid, setUid] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirm, setConfirm] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setUid(params.get('uid') || '');
    setToken(params.get('token') || '');
  }, [params]);

  const onSubmit = async () => {
    setError('');
    setMessage('');
    if (!uid || !token) {
      setError('Invalid or missing reset link.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Please enter a password with at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    try {
      setSubmitting(true);
      const res = await userApi.confirmPasswordReset(uid, token, password);
      setMessage(res.message || 'Password reset successful');
      setTimeout(() => navigate('/login'), 1500);
    } catch (e: any) {
      setError(e.message || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0A0A14 0%, #1A102E 100%)', p: 2 }}>
      <Paper sx={{ p: 3, maxWidth: 420, width: '100%', background: 'rgba(20, 20, 30, 0.9)', color: 'white', border: '1px solid rgba(162, 89, 255, 0.3)' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Reset Password</Typography>
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField fullWidth label="New Password" type="password" value={password} onChange={e => setPassword(e.target.value)} sx={{ mb: 2 }} />
        <TextField fullWidth label="Confirm New Password" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} sx={{ mb: 2 }} />
        <Button fullWidth variant="contained" onClick={onSubmit} disabled={submitting} sx={{ background: '#A259FF', '&:hover': { background: '#8a3ffb' } }}>
          {submitting ? 'Submitting...' : 'Reset Password'}
        </Button>
      </Paper>
    </Box>
  );
};

export default ResetPasswordPage;
