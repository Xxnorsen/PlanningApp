export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  avatarUri?: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload extends AuthCredentials {
  name: string;
}
