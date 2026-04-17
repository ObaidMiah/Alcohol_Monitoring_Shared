import { apiFetch } from "./client";

interface CognitoConfig {
  userPoolId: string;
  clientId: string;
  region: string;
}

export function getCognitoConfig(): CognitoConfig {
  // Try web env vars first, then mobile
  const userPoolId =
    (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_COGNITO_USER_POOL_ID) ||
    (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_COGNITO_USER_POOL_ID) ||
    "";

  const clientId =
    (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_COGNITO_WEB_CLIENT_ID) ||
    (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_COGNITO_MOBILE_CLIENT_ID) ||
    "";

  const region =
    (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_COGNITO_REGION) ||
    (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_COGNITO_REGION) ||
    "us-west-2";

  return { userPoolId, clientId, region };
}

export function getCognitoUrl(): string {
  const { region } = getCognitoConfig();
  return `https://cognito-idp.${region}.amazonaws.com/`;
}

export async function cognitoRequest<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  const url = getCognitoUrl();
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": `AWSCognitoIdentityProviderService.${action}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message ?? `Cognito ${action} failed`);
  }

  return response.json();
}

interface AuthResult {
  AccessToken: string;
  IdToken: string;
  RefreshToken?: string;
  ExpiresIn: number;
}

interface SignInResponse {
  AuthenticationResult: AuthResult;
}

export async function signIn(
  username: string,
  password: string,
): Promise<AuthResult> {
  const { clientId } = getCognitoConfig();
  const response = await cognitoRequest<SignInResponse>("InitiateAuth", {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: clientId,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password,
    },
  });
  return response.AuthenticationResult;
}

export async function refreshToken(refreshTokenValue: string): Promise<AuthResult> {
  const { clientId } = getCognitoConfig();
  const response = await cognitoRequest<SignInResponse>("InitiateAuth", {
    AuthFlow: "REFRESH_TOKEN_AUTH",
    ClientId: clientId,
    AuthParameters: {
      REFRESH_TOKEN: refreshTokenValue,
    },
  });
  return response.AuthenticationResult;
}

interface SignUpResponse {
  UserConfirmed: boolean;
  UserSub: string;
}

export async function signUp(
  username: string,
  password: string,
  email: string,
): Promise<SignUpResponse> {
  const { clientId } = getCognitoConfig();
  return cognitoRequest<SignUpResponse>("SignUp", {
    ClientId: clientId,
    Username: username,
    Password: password,
    UserAttributes: [{ Name: "email", Value: email }],
  });
}

export async function confirmSignUp(
  username: string,
  code: string,
): Promise<void> {
  const { clientId } = getCognitoConfig();
  await cognitoRequest("ConfirmSignUp", {
    ClientId: clientId,
    Username: username,
    ConfirmationCode: code,
  });
}

export async function forgotPassword(username: string): Promise<void> {
  const { clientId } = getCognitoConfig();
  await cognitoRequest("ForgotPassword", {
    ClientId: clientId,
    Username: username,
  });
}

export async function confirmForgotPassword(
  username: string,
  code: string,
  newPassword: string,
): Promise<void> {
  const { clientId } = getCognitoConfig();
  await cognitoRequest("ConfirmForgotPassword", {
    ClientId: clientId,
    Username: username,
    ConfirmationCode: code,
    Password: newPassword,
  });
}

export async function signOut(accessToken: string): Promise<void> {
  await cognitoRequest("GlobalSignOut", {
    AccessToken: accessToken,
  });
}
