export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface LoginParams {
  username: string;
  password: string;
}

export interface UserInfo {
  id: number;
  username: string;
  nickname?: string;
  avatar?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResult extends TokenPair {
  userInfo: UserInfo;
}
