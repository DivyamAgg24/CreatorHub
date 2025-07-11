export interface User {
    id: number;
    email: string;
    name: string;
    password: string;
    createdAt: string;
}

export interface AuthState {
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

// Idea types
export interface Idea {
    id: string;
    userId: string;
    title: string;
    description: string;
    category: string;
    status: IdeaStatus;
    progress: number;
    createdAt: string;
    updatedAt: string;
}

export type IdeaStatus = 'ideation' | 'drafting' | 'in-progress' | 'finished';

// Content types
export interface Content {
    id: string;
    ideaId: string;
    type: ContentType;
    title: string;
    data: string;
    createdAt: string;
    updatedAt: string;
}

export type ContentType = 'text' | 'image' | 'video';

// Theme types
export type Theme = 'light' | 'dark';