// API service for OptimaBank Loyalty System
const API_BASE_URL = 'http://127.0.0.1:8000';

// Mini-Games API
export const gamesApi = {
  getGames: async (): Promise<MiniGame[]> => {
    const response = await fetch(`${API_BASE_URL}/accounts/games/`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch mini-games');
    const data = await response.json();
    return data.games;
  },

  submitScore: async (gameId: number, score: number, durationSeconds: number): Promise<GameScoreResult> => {
    const response = await fetch(`${API_BASE_URL}/accounts/games/submit-score/`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        game_id: gameId,
        score: score,
        duration_seconds: durationSeconds,
      }),
    });
    if (!response.ok) throw new Error('Failed to submit score');
    return response.json();
  },

  getGameHistory: async (): Promise<GameSession[]> => {
    const response = await fetch(`${API_BASE_URL}/accounts/games/history/`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch game history');
    const data = await response.json();
    return data.history;
  },
};

// Leaderboard API
export const leaderboardApi = {
  getLeaderboard: async (limit: number = 50, includePrivate: boolean = false): Promise<LeaderboardEntry[]> => {
    const response = await fetch(`${API_BASE_URL}/accounts/leaderboard/?limit=${limit}&include_private=${includePrivate}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch leaderboard');
    const data = await response.json();
    return data.leaderboard;
  },

  updatePrivacy: async (isPublic: boolean): Promise<PrivacyUpdateResult> => {
    const response = await fetch(`${API_BASE_URL}/accounts/leaderboard/privacy/`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        is_public: isPublic,
      }),
    });
    if (!response.ok) throw new Error('Failed to update privacy settings');
    return response.json();
  },

  getUserStats: async (): Promise<LeaderboardStats> => {
    const response = await fetch(`${API_BASE_URL}/accounts/leaderboard/stats/`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch leaderboard stats');
    return response.json();
  },
};

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

// Helper function to get auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  console.log('getAuthHeaders - token found:', !!token);
  if (token) {
    console.log('getAuthHeaders - token preview:', token.substring(0, 20) + '...');
  }
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

// Helper function to test server connectivity
export const testServerConnectivity = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/accounts/categories/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    console.error('Server connectivity test failed:', error);
    return false;
  }
};

// Helper function to test authentication
export const testAuthentication = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/accounts/profile/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return response.ok;
  } catch (error) {
    console.error('Authentication test failed:', error);
    return false;
  }
};

// API response interface
interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

// Voucher interfaces
export interface Voucher {
  id: number;
  title: string;
  category: string;
  points: number;
  original_points: number;
  discount: string;
  rating: number;
  image_url: string;
  description: string;
  terms: string;
  quantity_available: number;
  featured: boolean;
  created_at: string;
}

export interface VoucherCategory {
  id: number;
  name: string;
  icon: string;
}

// User interfaces
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  points: number;
  created_at: string;
}

// Cart interfaces
export interface CartItem {
  id: number;
  voucher: {
    id: number;
    title: string;
    points: number;
    image_url: string;
  };
  quantity: number;
  added_at: string;
}

export interface Cart {
  id: number;
  items: CartItem[];
  total_points: number;
  created_at: string;
}

// Redemption interfaces
export interface Redemption {
  id: string;
  redemption_id?: string; // For cart checkout responses
  voucher_title: string;
  coupon_code: string;
  pdf_url: string;
}

export interface RedemptionResponse {
  message: string;
  id?: string;
  redemption_id?: string;
  coupon_code?: string;
  pdf_url?: string;
  points_remaining?: number;
  redemptions?: Redemption[];
  total_points_used?: number;
  is_multi_voucher?: boolean;
}

// Notification interfaces
export interface Notification {
  id: number;
  message: string;
  read: boolean;
  created_at: string;
}

// Mini-Games Types
export interface MiniGame {
  id: number;
  name: string;
  game_type: 'spin_wheel' | 'memory_game' | 'trivia_quiz' | 'daily_challenge';
  description: string;
  base_points: number;
  max_points: number;
}

export interface GameSession {
  id: number;
  game_name: string;
  game_type: string;
  score: number;
  points_earned: number;
  played_at: string;
  duration_seconds: number;
}

export interface GameScoreResult {
  success: boolean;
  points_earned: number;
  total_points: number;
  game_session_id: number;
}

// Leaderboard Types
export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  username: string;
  email?: string;
  total_points: number;
  tier_name: string;
  last_updated: string;
  is_current_user?: boolean;
}

export interface LeaderboardStats {
  rank: number;
  total_points: number;
  tier_name: string;
  is_public: boolean;
  last_updated: string;
}

export interface PrivacyUpdateResult {
  success: boolean;
  is_public: boolean;
}

// Chatbot interfaces
export interface ChatMessage {
  id: string;
  message_type: 'user' | 'bot' | 'system';
  content: string;
  timestamp: string;
  is_read: boolean;
}

export interface ChatSession {
  id: string;
  session_id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  messages: ChatMessage[];
}

export interface ChatResponse {
  session_id: string;
  user_message: ChatMessage;
  bot_message: ChatMessage;
}

// API Functions

// Voucher APIs
export const voucherApi = {
  // Get all vouchers with optional filtering
  getVouchers: async (category?: string, search?: string): Promise<Voucher[]> => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    
    const headers = getAuthHeaders();
    console.log('getVouchers - headers:', headers);
    
    const response = await fetch(`${API_BASE_URL}/accounts/vouchers/?${params}`, {
      headers,
    });
    
    console.log('getVouchers response status:', response.status);
    console.log('getVouchers response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('getVouchers error response:', errorText);
      throw new Error(`Failed to fetch vouchers: ${response.status} - ${errorText}`);
    }
    
    return response.json();
  },

  // Get voucher details
  getVoucher: async (voucherId: number): Promise<Voucher> => {
    const response = await fetch(`${API_BASE_URL}/accounts/vouchers/${voucherId}/`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch voucher details');
    }
    
    return response.json();
  },

  // Get voucher categories
  getCategories: async (): Promise<VoucherCategory[]> => {
    const response = await fetch(`${API_BASE_URL}/accounts/categories/`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    
    return response.json();
  },
};

// User Profile APIs
export const userApi = {
  // Get user profile
  getProfile: async (): Promise<UserProfile> => {
    const response = await fetch(`${API_BASE_URL}/accounts/profile/`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }
    
    return response.json();
  },
};

// Cart APIs
export const cartApi = {
  // Get user's cart
  getCart: async (): Promise<Cart> => {
    const response = await fetch(`${API_BASE_URL}/accounts/cart/`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch cart');
    }
    
    return response.json();
  },

  // Add item to cart
  addToCart: async (voucherId: number, quantity: number = 1): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/accounts/cart/add/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ voucher_id: voucherId, quantity }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to add item to cart');
    }
    
    return data;
  },

  // Update cart item quantity
  updateCartItem: async (itemId: number, quantity: number): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/accounts/cart/items/${itemId}/`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ quantity }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update cart item');
    }
    
    return data;
  },

  // Remove item from cart
  removeFromCart: async (itemId: number): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/accounts/cart/items/${itemId}/remove/`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to remove item from cart');
    }
    
    return data;
  },
};

// Redemption APIs
export const redemptionApi = {
  // Redeem a single voucher
  redeemVoucher: async (voucherId: number, quantity: number = 1): Promise<RedemptionResponse> => {
    console.log('redeemVoucher called with:', { voucherId, quantity });
    
    const headers = getAuthHeaders();
    console.log('redeemVoucher headers:', headers);
    
    try {
      const authHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if ((headers as any).Authorization) {
        authHeaders['Authorization'] = (headers as any).Authorization;
      }
      
      const response = await fetch(`${API_BASE_URL}/accounts/redeem/`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ voucher_id: voucherId, quantity }),
      });
      
      console.log('redeemVoucher response status:', response.status);
      console.log('redeemVoucher response ok:', response.ok);
      
      const data = await response.json();
      console.log('redeemVoucher response data:', data);
      
      if (!response.ok) {
        console.error('redeemVoucher error:', data);
        throw new Error(data.error || data.detail || 'Failed to redeem voucher');
      }
      
      return data;
    } catch (error) {
      console.error('redeemVoucher fetch error:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server. Please check your internet connection.');
      }
      throw error;
    }
  },

  // Checkout entire cart
  checkoutCart: async (): Promise<RedemptionResponse> => {
    const response = await fetch(`${API_BASE_URL}/accounts/checkout/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to checkout cart');
    }
    
    return data;
  },

  // Download voucher PDF
  downloadVoucherPdf: async (redemptionId: string): Promise<{ pdf_url: string }> => {
    const response = await fetch(`${API_BASE_URL}/accounts/redemptions/${redemptionId}/pdf/`, {
      headers: getAuthHeaders(),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get PDF URL');
    }
    
    return data;
  },

  // Serve voucher PDF directly
  serveVoucherPdf: async (redemptionId: string): Promise<Blob> => {
    console.log(`Requesting PDF for redemption ID: ${redemptionId}`);
    const url = `${API_BASE_URL}/accounts/redemptions/${redemptionId}/serve/`;
    console.log(`PDF URL: ${url}`);
    
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    
    console.log(`PDF response status: ${response.status}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`PDF serve error:`, errorData);
      throw new Error(errorData.error || 'Failed to serve PDF');
    }
    
    const blob = await response.blob();
    console.log(`PDF blob created: ${blob.size} bytes, type: ${blob.type}`);
    return blob;
  },
};

// Notification APIs
export const notificationApi = {
  // Get user notifications
  getNotifications: async (): Promise<Notification[]> => {
    const response = await fetch(`${API_BASE_URL}/accounts/notifications/`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }
    
    return response.json();
  },

  // Mark all notifications as read
  markAsRead: async (): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/accounts/notifications/mark-read/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to mark notifications as read');
    }
    
    return data;
  },
};

// Authentication APIs
export const authApi = {
  // Login with email and password
  login: async (email: string, password: string): Promise<any> => {
    console.log('Making login request to:', `${API_BASE_URL}/accounts/login/`);
    console.log('Request body:', { email, password: '***' });
    
    const response = await fetch(`${API_BASE_URL}/accounts/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    console.log('Login response status:', response.status);
    console.log('Login response ok:', response.ok);
    
    const data = await response.json();
    console.log('Login response data:', data);
    
    if (!response.ok) {
      throw new Error(data.error || `Login failed with status ${response.status}`);
    }
    
    // Store tokens in localStorage
    if (data.access) {
      localStorage.setItem('access_token', data.access);
    }
    if (data.refresh) {
      localStorage.setItem('refresh_token', data.refresh);
    }
    
    return data;
  },

  // Google authentication
  googleAuth: async (token: string, action: 'signup' | 'login' = 'login'): Promise<any> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/google/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, action }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Enhanced error handling with specific error types
        const error = new Error(data.detail || 'Google authentication failed');
        (error as any).errorType = data.error_type;
        (error as any).email = data.email;
        throw error;
      }
      
      // Store tokens in localStorage
      if (data.access) {
        localStorage.setItem('access_token', data.access);
      }
      if (data.refresh) {
        localStorage.setItem('refresh_token', data.refresh);
      }
      
      return data;
    } catch (error) {
      console.error('Google auth error:', error);
      throw error;
    }
  },

  // Request OTP
  requestOtp: async (email: string): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/users/request-otp/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to request OTP');
    }
    
    return data;
  },

  // Verify OTP
  verifyOtp: async (email: string, otp: string): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/users/verify-otp/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to verify OTP');
    }
    
    return data;
  },

  // User signup
  signup: async (userData: {
    email: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    password: string;
  }): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/users/signup/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to sign up');
    }
    
    return data;
  },
};

// Utility function to download PDF
export const downloadPdf = (pdfUrl: string, filename: string = 'voucher.pdf') => {
  const link = document.createElement('a');
  link.href = pdfUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Utility function to download PDF blob
export const downloadPdfBlob = async (redemptionId: string, filename: string = 'voucher.pdf') => {
  try {
    console.log(`Downloading PDF for redemption ID: ${redemptionId}, filename: ${filename}`);
    
    const blob = await redemptionApi.serveVoucherPdf(redemptionId);
    console.log(`PDF blob received, size: ${blob.size} bytes, type: ${blob.type}`);
    
    // Ensure filename has .pdf extension
    if (!filename.toLowerCase().endsWith('.pdf')) {
      filename += '.pdf';
    }
    
    // Create blob URL and download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    // Add to DOM, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the blob URL
    window.URL.revokeObjectURL(url);
    
    console.log(`PDF download initiated for: ${filename}`);
  } catch (error) {
    console.error('Failed to download PDF:', error);
    throw error;
  }
};

// Tiered Rewards System Interfaces
export interface RewardTier {
  id: number;
  tier_name: string;
  tier_level: number;
  min_points: number;
  color: string;
  icon: string;
  benefits: string[];
  exclusive_offers: boolean;
  premium_support: boolean;
  created_at: string;
}

export interface TierBenefit {
  id: number;
  benefit_name: string;
  description: string;
  benefit_type: string;
  is_active: boolean;
  created_at: string;
}

export interface UserTier {
  id: number;
  current_tier: RewardTier;
  total_points_earned: number;
  tier_points: number;
  tier_start_date: string;
  last_tier_upgrade: string | null;
  tier_progress: number;
  points_to_next_tier: number;
  next_tier: RewardTier | null;
  created_at: string;
  updated_at: string;
}

export interface TierActivity {
  id: number;
  activity_type: string;
  points_earned: number;
  description: string;
  created_at: string;
}

export interface TierProgressData {
  current_tier: RewardTier;
  next_tier: RewardTier | null;
  progress_percentage: number;
  points_to_next_tier: number;
  total_points_earned: number;
  tier_benefits: TierBenefit[];
  tier_points: number;
  tier_start_date: string;
  last_tier_upgrade: string | null;
}

// Tiered Rewards APIs
export const tierApi = {
  // Get all available tiers
  getAllTiers: async (): Promise<RewardTier[]> => {
    const response = await fetch(`${API_BASE_URL}/accounts/tiers/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get tiers');
    }
    
    return data;
  },

  // Get user's current tier information
  getUserTierInfo: async (): Promise<TierProgressData> => {
    const response = await fetch(`${API_BASE_URL}/accounts/tiers/user/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get user tier info');
    }
    
    return data;
  },

  // Get benefits for a specific tier
  getTierBenefits: async (tierId: number): Promise<TierBenefit[]> => {
    const response = await fetch(`${API_BASE_URL}/accounts/tiers/${tierId}/benefits/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get tier benefits');
    }
    
    return data;
  },

  // Get user's tier activities
  getUserActivities: async (): Promise<TierActivity[]> => {
    const response = await fetch(`${API_BASE_URL}/accounts/tiers/activities/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get user activities');
    }
    
    return data;
  },

  // Add a new tier activity
  addTierActivity: async (activityData: {
    activity_type: string;
    points_earned: number;
    description: string;
  }): Promise<TierActivity> => {
    const response = await fetch(`${API_BASE_URL}/accounts/tiers/activities/add/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(activityData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to add tier activity');
    }
    
    return data;
  },

  // Simulate daily login activity
  simulateLoginActivity: async (): Promise<{
    activity: TierActivity;
    tier_info: UserTier;
    message: string;
  }> => {
    const response = await fetch(`${API_BASE_URL}/accounts/tiers/login-bonus/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to claim login bonus');
    }
    
    return data;
  },
};

// Chatbot APIs (No authentication required)
export const chatbotApi = {
  // Start a new chat session
  startChat: async (): Promise<ChatSession> => {
    const response = await fetch(`${API_BASE_URL}/chatbot/start/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to start chat session');
    }
    
    return response.json();
  },

  // Send a message to the chatbot
  sendMessage: async (message: string, sessionId?: string): Promise<ChatResponse> => {
    const response = await fetch(`${API_BASE_URL}/chatbot/send/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, session_id: sessionId }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to send message');
    }
    
    return response.json();
  },

  // Get chat history for a session
  getChatHistory: async (sessionId: string): Promise<ChatSession> => {
    const response = await fetch(`${API_BASE_URL}/chatbot/sessions/${sessionId}/`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to get chat history');
    }
    
    return response.json();
  },

  // Get all user chat sessions
  getUserSessions: async (): Promise<ChatSession[]> => {
    const response = await fetch(`${API_BASE_URL}/chatbot/sessions/`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to get user sessions');
    }
    
    return response.json();
  },

  // End a chat session
  endChat: async (sessionId: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/chatbot/sessions/${sessionId}/end/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to end chat session');
    }
    
    return response.json();
  },
};

// Real-time Analytics Interfaces
export interface RealtimeChartData {
  hour: string;
  users: number;
  timestamp: string;
  activity_level: 'low' | 'medium' | 'high';
}

export interface RealtimeMetrics {
  total_users: number;
  active_today: number;
  recent_activities: number;
  tier_distribution: { [key: string]: number };
  server_time: string;
  uptime_hours: number;
  current_activity: number;
  peak_activity_today: number;
  avg_activity_today: number;
}

// User Spending Analytics Interfaces
export interface UserSpendingData {
  totalSpent: number;
  totalSaved: number;
  monthlySpending: Array<{ month: string; amount: number }>;
  categoryBreakdown: Array<{ category: string; amount: number; percentage: number }>;
  roi: number;
  averageMonthlySpending: number;
  projectedYearlySavings: number;
  topCategories: Array<{ category: string; count: number }>;
  recentRedemptions: Array<{ date: string; voucher: string; points: number; savings: number }>;
  achievements: Array<UserAchievement>;
  lastUpdated: string;
}

export interface UserAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedDate?: string;
  progress?: number;
  total?: number;
  category: 'spending' | 'redemption' | 'tier' | 'loyalty' | 'special';
}

export interface UserRedemptionHistory {
  redemptions: Array<{
    id: string;
    date: string;
    voucher_title: string;
    voucher_category: string;
    points_spent: number;
    value_saved: number;
    status: string;
  }>;
  total_redemptions: number;
  total_points_spent: number;
  total_savings: number;
}

export interface LiveUserCount {
  active_users: number;
  active_users_15min: number;
  active_users_1hour: number;
  total_users: number;
  online_users: number;
  activity_trend: number;
  timestamp: string;
  status: string;
}

// Real-time Analytics APIs
export const analyticsApi = {
  // Get real-time analytics data
  getRealtimeAnalytics: async (): Promise<{
    chart_data: RealtimeChartData[];
    metrics: RealtimeMetrics;
    status: string;
  }> => {
    const response = await fetch(`${API_BASE_URL}/accounts/analytics/realtime/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get real-time analytics');
    }
    
    return data;
  },

  // Get live user count
  getLiveUserCount: async (): Promise<LiveUserCount> => {
    const response = await fetch(`${API_BASE_URL}/accounts/analytics/live-users/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get live user count');
    }
    
    return data;
  },

  // Get user-specific spending analytics
  getUserSpendingAnalytics: async (): Promise<UserSpendingData> => {
    const response = await fetch(`${API_BASE_URL}/accounts/analytics/user-spending/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get user spending analytics');
    }
    
    return data;
  },

  // Get user redemption history
  getUserRedemptionHistory: async (): Promise<UserRedemptionHistory> => {
    const response = await fetch(`${API_BASE_URL}/accounts/analytics/user-redemptions/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get user redemption history');
    }
    
    return data;
  },

  // Get user achievements
  getUserAchievements: async (): Promise<UserAchievement[]> => {
    const response = await fetch(`${API_BASE_URL}/accounts/analytics/user-achievements/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get user achievements');
    }
    
    return data.achievements || [];
  },
};

const apiService = {
  voucherApi,
  userApi,
  cartApi,
  redemptionApi,
  notificationApi,
  authApi,
  chatbotApi,
  tierApi,
  analyticsApi,
  downloadPdf,
  downloadPdfBlob,
};

export default apiService;
