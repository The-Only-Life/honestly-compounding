import { AppConfig } from "@/config";

// API Client configuration
const API_BASE_URL = AppConfig.API_BASE_URL;

export interface ApiError {
  error: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  captchaToken?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role?: string | null;
  accessApproved?: boolean;
  profileCompleted?: boolean;
  hasAgreedToTerms?: boolean;
  emailVerified: boolean;
  createdAt: string;
  user_metadata?: {
    full_name?: string;
    [key: string]: any;
  };
}

export interface LoginResponse {
  user: AuthUser;
  message: string;
}

export interface LogoutResponse {
  message: string;
}

export interface CurrentUserResponse {
  user: AuthUser;
}

export interface SendOTPRequest {
  phone: string;
}

export interface SendOTPResponse {
  message: string;
}

export interface VerifyOTPRequest {
  phone: string;
  otp: string;
}

export interface VerifyOTPResponse {
  message: string;
  user: AuthUser & {
    phone?: string;
  };
  needsProfileCompletion: boolean;
  accessToken?: string;
}

// User Management types
export interface User {
  id: string;
  email?: string;
  phone?: string;
  role?: string | null;
  accessApproved?: boolean;
  profileCompleted?: boolean;
  emailVerified: boolean;
  createdAt: string;
  lastSignInAt?: string;
  invitedBy?: string | null;
}

export interface UsersResponse {
  users: User[];
}

export interface CreateUserRequest {
  email?: string;
  phone?: string;
  role: "admin" | "sponsor" | "subscriber";
}

export interface CreateUserResponse {
  message: string;
  user: User;
}

export interface UpdateUserRoleRequest {
  role: "admin" | "sponsor" | "subscriber";
}

export interface UpdateUserRoleResponse {
  message: string;
  user: User;
}

// Invite types
export interface InviteUserRequest {
  email?: string;
  phone?: string;
  role: "admin" | "sponsor" | "subscriber";
}

export interface InviteUserResponse {
  message: string;
  user: {
    id: string;
    email?: string;
    phone?: string;
    role: string;
    accessApproved: boolean;
  };
}

export interface BulkInviteUserRequest {
  users: InviteUserRequest[];
}

export interface BulkInviteUserResponse {
  message: string;
  results: {
    successful: Array<{
      id: string;
      email?: string;
      phone?: string;
      role: string;
    }>;
    failed: Array<{
      email?: string;
      phone?: string;
      error: string;
    }>;
  };
}

// Waitlist types
export interface WaitlistEntry {
  id: string;
  email: string;
  status: 'pending' | 'invited';
  created_at: string;
}

export interface WaitlistResponse {
  data: WaitlistEntry[];
  count: number;
}

export interface JoinWaitlistResponse {
  message: string;
  data: {
    id: string;
    email: string;
    status: string;
  };
}

export interface ApproveWaitlistResponse {
  message: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

// Bucket types
export interface Bucket {
  id: string;
  name: string;
  description: string;
  riskMeasure: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator?: {
    fullName: string;
  };
}

export interface BucketsResponse {
  buckets: Bucket[];
  total: number;
}

export interface CreateBucketRequest {
  name: string;
  description: string;
  riskMeasure: string;
}

// Theme types
export interface Theme {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator?: {
    fullName: string;
  };
}

export interface ThemesResponse {
  themes: Theme[];
  total: number;
}

export interface CreateThemeRequest {
  name: string;
  description: string;
}

// Stock types
export interface Stock {
  id: string;
  symbol: string;
  companyName: string;
  themeId: string;
  bucketId: string;
  pdfUrl?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator?: {
    fullName: string;
  };
  theme?: {
    id: string;
    name: string;
    description?: string;
  };
  bucket?: {
    id: string;
    name: string;
    description?: string;
  };
}

export interface StocksResponse {
  stocks: Stock[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateStockRequest {
  symbol: string;
  companyName: string;
  themeId: string;
  bucketId: string;
  pdfUrl?: string;
}

export interface UploadPDFResponse {
  fileName: string;
  url: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      ...options.headers,
    };

    // Only set Content-Type if there's a body
    if (options.body) {
      headers["Content-Type"] = "application/json";
    }

    const config: RequestInit = {
      ...options,
      headers,
      credentials: "include", // Important: Include cookies in requests
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: `HTTP error ${response.status}`,
      }));
      throw new Error(error.error);
    }

    return response.json();
  }

  // Auth endpoints
  async login(data: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<LogoutResponse> {
    return this.request<LogoutResponse>("/api/auth/logout", {
      method: "POST",
    });
  }

  async logoutAll(): Promise<LogoutResponse> {
    return this.request<LogoutResponse>("/api/auth/logout-all", {
      method: "POST",
    });
  }

  async getCurrentUser(): Promise<CurrentUserResponse> {
    return this.request<CurrentUserResponse>("/api/auth/me");
  }

  async refreshToken(): Promise<LoginResponse> {
    return this.request<LoginResponse>("/api/auth/refresh", {
      method: "POST",
    });
  }

  async sendOTP(data: SendOTPRequest): Promise<SendOTPResponse> {
    return this.request<SendOTPResponse>("/api/auth/phone/send-otp", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async verifyOTP(data: VerifyOTPRequest): Promise<VerifyOTPResponse> {
    return this.request<VerifyOTPResponse>("/api/auth/phone/verify-otp", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // User Management endpoints
  async getAllUsers(): Promise<UsersResponse> {
    return this.request<UsersResponse>("/api/users");
  }

  async createUser(data: CreateUserRequest): Promise<CreateUserResponse> {
    return this.request<CreateUserResponse>("/api/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateUserRole(
    userId: string,
    data: UpdateUserRoleRequest
  ): Promise<UpdateUserRoleResponse> {
    return this.request<UpdateUserRoleResponse>(`/api/users/${userId}/role`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async updateUserAccess(
    userId: string,
    accessApproved: boolean
  ): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/users/${userId}/access`, {
      method: "PATCH",
      body: JSON.stringify({ accessApproved }),
    });
  }

  // Invite endpoints
  async inviteUser(data: InviteUserRequest): Promise<InviteUserResponse> {
    return this.request<InviteUserResponse>("/api/auth/invite", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async inviteUsersBulk(data: BulkInviteUserRequest): Promise<BulkInviteUserResponse> {
    return this.request<BulkInviteUserResponse>("/api/auth/invite-bulk", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async generateVerificationLink(userId: string): Promise<{ message: string; verificationUrl: string; user: { id: string; email: string; emailVerified: boolean } }> {
    return this.request<{ message: string; verificationUrl: string; user: { id: string; email: string; emailVerified: boolean } }>("/api/auth/generate-verification-link", {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  async deleteUser(userId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/users/${userId}`, {
      method: "DELETE",
    });
  }

  // Waitlist endpoints
  async joinWaitlist(email: string, captchaToken?: string): Promise<JoinWaitlistResponse> {
    return this.request<JoinWaitlistResponse>("/api/waitlist/join", {
      method: "POST",
      body: JSON.stringify({ email, captchaToken }),
    });
  }

  async getWaitlist(status?: 'pending' | 'invited'): Promise<WaitlistResponse> {
    const queryParams = status ? `?status=${status}` : '';
    return this.request<WaitlistResponse>(`/api/waitlist${queryParams}`);
  }

  async approveWaitlist(id: string, email: string): Promise<ApproveWaitlistResponse> {
    return this.request<ApproveWaitlistResponse>("/api/waitlist/approve", {
      method: "POST",
      body: JSON.stringify({ id, email }),
    });
  }

  acknowledgeTerms(): Promise<{ message: string }> {
    return this.request<{ message: string }>("/api/users/acknowledge-terms", {
      method: "POST",
      body: JSON.stringify({}),
    });
  }

  // Bucket endpoints
  async getBuckets(): Promise<BucketsResponse> {
    return this.request<BucketsResponse>("/api/buckets");
  }

  async getBucket(id: string): Promise<Bucket> {
    return this.request<Bucket>(`/api/buckets/${id}`);
  }

  async createBucket(data: CreateBucketRequest): Promise<Bucket> {
    return this.request<Bucket>("/api/buckets", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Theme endpoints
  async getThemes(): Promise<ThemesResponse> {
    return this.request<ThemesResponse>("/api/themes");
  }

  async getTheme(id: string): Promise<Theme> {
    return this.request<Theme>(`/api/themes/${id}`);
  }

  async createTheme(data: CreateThemeRequest): Promise<Theme> {
    return this.request<Theme>("/api/themes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Stock endpoints
  async getStocks(page: number = 1, limit: number = 10): Promise<StocksResponse> {
    return this.request<StocksResponse>(`/api/stocks?page=${page}&limit=${limit}`);
  }

  async getStock(id: string): Promise<Stock> {
    return this.request<Stock>(`/api/stocks/${id}`);
  }

  async createStock(data: CreateStockRequest): Promise<Stock> {
    return this.request<Stock>("/api/stocks", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async uploadStockPDF(file: File): Promise<UploadPDFResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const url = `${this.baseUrl}/api/stocks/upload-pdf`;
    const response = await fetch(url, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: `HTTP error ${response.status}`,
      }));
      throw new Error(error.error);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
