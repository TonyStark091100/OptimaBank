// API service for OptimaBank Loyalty System
const API_BASE_URL = 'http://localhost:8000';

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

// Helper function to get auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
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
  voucher_title: string;
  coupon_code: string;
  pdf_url: string;
}

export interface RedemptionResponse {
  message: string;
  redemption_id?: string;
  coupon_code?: string;
  pdf_url?: string;
  points_remaining?: number;
  redemptions?: Redemption[];
  total_points_used?: number;
}

// Notification interfaces
export interface Notification {
  id: number;
  message: string;
  read: boolean;
  created_at: string;
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
    
    const response = await fetch(`${API_BASE_URL}/accounts/vouchers/?${params}`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch vouchers');
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
    const response = await fetch(`${API_BASE_URL}/accounts/redeem/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ voucher_id: voucherId, quantity }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to redeem voucher');
    }
    
    return data;
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
    const response = await fetch(`${API_BASE_URL}/accounts/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      throw new Error('Login failed');
    }
    
    const data = await response.json();
    
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
  googleAuth: async (token: string): Promise<any> => {
    // For demo purposes, extract email from Google token and use regular login
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const email = payload.email;
      
      if (!email) {
        throw new Error('No email found in Google token');
      }
      
      // Use the regular login endpoint with Google email
      return await authApi.login(email, 'google_auth_demo');
    } catch (error) {
      throw new Error('Invalid Google token');
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
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      },
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

// Chatbot APIs
export const chatbotApi = {
  // Start a new chat session
  startChat: async (): Promise<ChatSession> => {
    const response = await fetch(`${API_BASE_URL}/chatbot/start/`, {
      method: 'POST',
      headers: getAuthHeaders(),
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
      headers: getAuthHeaders(),
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
      headers: getAuthHeaders(),
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
      headers: getAuthHeaders(),
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
}

export interface RealtimeMetrics {
  total_users: number;
  active_today: number;
  recent_activities: number;
  tier_distribution: { [key: string]: number };
  server_time: string;
  uptime_hours: number;
}

export interface LiveUserCount {
  active_users: number;
  total_users: number;
  online_users: number;
  timestamp: string;
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
};

export default apiService;
