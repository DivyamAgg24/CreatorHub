import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
    children?: React.ReactNode;
    redirectTo?: string;
}

/**
 * ProtectedRoute component that redirects unauthenticated users
 * Can be used either with children or as a wrapper for route elements
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    redirectTo = '/login'
}) => {
    const { isAuthenticated, isLoading } = useAuth();

    // Show loading indicator while checking authentication
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Redirect if not authenticated
    if (!isAuthenticated) {
        return <Navigate to={redirectTo} replace />;
    }

    // Render children if provided, otherwise render the outlet for nested routes
    return <>{children ? children : <Outlet />}</>;
};

export default ProtectedRoute;