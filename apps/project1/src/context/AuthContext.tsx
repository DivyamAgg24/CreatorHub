import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthState } from '../types';
import axios from "axios"

interface AuthContextType extends AuthState {
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [authState, setAuthState] = useState<AuthState>({
        token: null,
        isAuthenticated: false,
        isLoading: true,
    });

    useEffect(() => {
        const checkAuthStatus = () => {
            const token = localStorage.getItem('token');

            if (token) {
                try {
                    setAuthState({
                        token: token,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } catch (error) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setAuthState({
                        token: null,
                        isAuthenticated: false,
                        isLoading: false,
                    });
                }
            } else {
                setAuthState({
                    token: null,
                    isAuthenticated: false,
                    isLoading: false,
                });
            }
        };

        checkAuthStatus();
    }, []);

    // In a real app, you would use API calls to a backend for these functions
    const login = async (email: string, password: string) => {
        const response = await axios.post("http://localhost:3000/v1/auth/login", {
            email,
            password
        })
        setAuthState((prev) => ({ ...prev, isLoading: true }));

        try {
            
            if(response.data.success){
                localStorage.setItem('token', "Bearer " + response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                setAuthState({
                    token: response.data.token,
                    isAuthenticated: true,
                    isLoading: false,
                });
            }
        } catch (error) {
            setAuthState((prev) => ({ ...prev, isLoading: false }));
            throw new Error('Login failed');
        }
    };

    const register = async (name: string, email: string, password: string) => {
        const response = await axios.post("http://localhost:3000/v1/auth/register", {
            name,
            email,
            password
        })
        setAuthState((prev) => ({ ...prev, isLoading: true }));

        try {
            if(response.data.success){
                localStorage.setItem('token', "Bearer " + response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                setAuthState({
                    token: response.data.token,
                    isAuthenticated: true,
                    isLoading: false,
                });
            }

        } catch (error) {
            setAuthState((prev) => ({ ...prev, isLoading: false }));
            throw new Error('Registration failed');
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setAuthState({
            token: null,
            isAuthenticated: false,
            isLoading: false,
        });
    };

    const resetPassword = async (email: string) => {
        
        try {
            
            console.log(`Password reset email sent to: ${email}`);
        } catch (error) {
            throw new Error('Password reset failed');
        }
    };

    return (
        <AuthContext.Provider
            value={{
                ...authState,
                login,
                register,
                logout,
                resetPassword,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
};