import { AppConfig } from "@/config";

// API Client configuration
const API_BASE_URL = AppConfig.API_BASE_URL;

export interface ApiError {
  error: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role?: string | null;
  accessApproved?: boolean;
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

// User Management types
export interface User {
  id: string;
  email?: string;
  phone?: string;
  role?: string | null;
  accessApproved?: boolean;
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

  async deleteUser(userId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/users/${userId}`, {
      method: "DELETE",
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
