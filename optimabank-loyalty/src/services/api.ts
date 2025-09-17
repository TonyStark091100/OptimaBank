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
  id: number;
  username: string;
  email: string;
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

const apiService = {
  voucherApi,
  userApi,
  cartApi,
  redemptionApi,
  notificationApi,
  authApi,
  downloadPdf,
};

export default apiService;
