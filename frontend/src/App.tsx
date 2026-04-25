import React, { useEffect } from 'react';
import { useRoutes, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { showToast } from '@/components/ui/Toast';
import { RoleGuard } from '@/router';
import AppShell from '@/components/layout/AppShell';
import {
  LayoutDashboard,
  FolderOpen,
  Calendar,
  ClipboardList,
  Users,
  UserCircle,
  Home,
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import LoginPage from '@/pages/login/LoginPage';
import ProfilePage from '@/pages/profile/ProfilePage';
import UserListPage from '@/pages/admin/UserList/UserListPage';
import ProjectListPage from '@/pages/admin/ProjectList/ProjectListPage';
import ProjectFormPage from '@/pages/admin/ProjectForm/ProjectFormPage';
import InverterListPage from '@/pages/admin/InverterList/InverterListPage';
import InverterDetailPage from '@/pages/admin/InverterList/InverterDetailPage';
import PlanListPage from '@/pages/admin/PlanList/PlanListPage';
import PlanDetailPage from '@/pages/admin/PlanList/PlanDetailPage';
import InspectorProjectListPage from '@/pages/inspector/ProjectList/ProjectListPage';
import InspectorInverterListPage from '@/pages/inspector/InverterList/InverterListPage';
import InspectionFormPage from '@/pages/inspector/InspectionForm/InspectionFormPage';
import DashboardPage from '@/pages/admin/Dashboard/DashboardPage';
import RecordListPage from '@/pages/records/RecordListPage';
import RecordDetailPage from '@/pages/records/RecordDetailPage';

const adminMenuItems = [
  { icon: LayoutDashboard, label: '数据概览', path: '/admin' },
  { icon: FolderOpen, label: '项目管理', path: '/admin/projects' },
  { icon: Calendar, label: '计划管理', path: '/admin/plans' },
  { icon: ClipboardList, label: '巡检记录', path: '/admin/records' },
  { icon: Users, label: '用户管理', path: '/admin/users' },
  { icon: UserCircle, label: '个人中心', path: '/admin/profile' },
];

const inspectorMenuItems = [
  { icon: Home, label: '巡检首页', path: '/' },
  { icon: ClipboardList, label: '巡检记录', path: '/records' },
  { icon: UserCircle, label: '个人中心', path: '/profile' },
];

function AdminRoutes() {
  return (
    <RoleGuard role="admin">
      <AppShell menuItems={adminMenuItems}>
        <React.Suspense fallback={<LoadingSpinner />}>
          {useRoutes([
            { path: '/', element: <DashboardPage /> },
            { path: '/projects', element: <ProjectListPage /> },
            { path: '/projects/new', element: <ProjectFormPage /> },
            { path: '/projects/:projectId/edit', element: <ProjectFormPage /> },
            { path: '/projects/:projectId/inverters', element: <InverterListPage /> },
            { path: '/projects/:projectId/inverters/:inverterId', element: <InverterDetailPage /> },
            { path: '/plans', element: <PlanListPage /> },
            { path: '/plans/:planGroupId', element: <PlanDetailPage /> },
            { path: '/users', element: <UserListPage /> },
            { path: '/records', element: <RecordListPage /> },
            { path: '/records/:recordId', element: <RecordDetailPage /> },
            { path: '/records/:recordId/edit', element: <InspectionFormPage /> },
            { path: '/profile', element: <ProfilePage /> },
            { path: '*', element: <Navigate to="/admin" replace /> },
          ])}
        </React.Suspense>
      </AppShell>
    </RoleGuard>
  );
}

function InspectorRoutes() {
  return (
    <RoleGuard role="inspector">
      <AppShell menuItems={inspectorMenuItems}>
        <React.Suspense fallback={<LoadingSpinner />}>
          {useRoutes([
            { path: '/', element: <InspectorProjectListPage /> },
            { path: '/projects/:projectId/inverters', element: <InspectorInverterListPage /> },
            { path: '/projects/:projectId/inverters/:inverterId/inspect', element: <InspectionFormPage /> },
            { path: '/records', element: <RecordListPage /> },
            { path: '/records/:recordId', element: <RecordDetailPage /> },
            { path: '/records/:recordId/edit', element: <InspectionFormPage /> },
            { path: '/profile', element: <ProfilePage /> },
            { path: '*', element: <Navigate to="/" replace /> },
          ])}
        </React.Suspense>
      </AppShell>
    </RoleGuard>
  );
}

function App() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.needResetPwd && !window.location.pathname.endsWith('/profile')) {
      navigate(user.role === 'admin' ? '/admin/profile' : '/profile', { replace: true });
      showToast({ icon: 'warning', content: '请先修改密码' });
    }
  }, [user?.needResetPwd]);

  const routes = useRoutes([
    { path: '/login', element: user ? <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace /> : <LoginPage /> },
    { path: '/admin/*', element: <AdminRoutes /> },
    { path: '/*', element: <InspectorRoutes /> },
  ]);

  return routes;
}

export default App;
