import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface RoleGuardProps {
    children: React.ReactNode;
    role: 'admin' | 'inspector';
}

export function RoleGuard({ children, role }: RoleGuardProps) {
    const user = useAuthStore((s) => s.user);
    const token = useAuthStore((s) => s.token);

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }
    if (user.role !== role) {
        return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;
    }
    return <>{children}</>;
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const token = useAuthStore((s) => s.token);
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
}
