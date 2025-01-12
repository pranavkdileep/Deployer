export interface LoginDTO {
    email: string;
    password: string;
    timestamp: number;
}

export interface LogingResponseDTO {
    success: boolean;
    message?: string;
    token: string;
    timestamp: number;
}