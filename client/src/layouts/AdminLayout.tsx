// import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, Users, Layers, LogOut, Palette, List, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';

import { useTheme } from '@/components/theme-provider';
import { useBranding } from '@/components/branding-provider';

export default function AdminLayout() {
    const { logout, user } = useAuth();
    const { config } = useBranding();
    const { theme } = useTheme();
    const location = useLocation();

    const navItems = [
        { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
        { name: 'All Leads', path: '/admin/leads', icon: List },
        { name: 'Platforms', path: '/admin/platforms', icon: Layers },
        { name: 'Team', path: '/admin/team', icon: Users },
        { name: 'Users', path: '/admin/users', icon: ShieldCheck },
        { name: 'Branding', path: '/admin/branding', icon: Palette },
        { name: 'Performance', path: '/admin/performance', icon: List },];

    return (
        <div className="flex h-screen transition-colors duration-200" style={{ backgroundColor: 'var(--app-bg)' }}>
            {/* Sidebar */}
            <aside
                className="w-64 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-colors duration-200 bg-[var(--app-sidebar)]"
            >
                <div className="p-6">
                    <div className="flex items-center gap-2">
                        {config?.logo_url ? (
                            <img src={config.logo_url} alt="Logo" className="h-8 w-auto object-contain" />
                        ) : (
                            <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                                {config?.company_name?.substring(0, 2).toUpperCase() || 'LP'}
                            </span>
                        )}
                        <h1 className="text-xl font-bold text-foreground truncate">
                            {config?.company_name || 'LeadTrack'}
                        </h1>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                                    isActive
                                        ? theme === 'custom'
                                            ? "bg-primary text-primary-foreground font-medium"
                                            : "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-medium"
                                        : theme === 'custom'
                                            ? "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                                            : "text-muted-foreground hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                )}
                            >
                                <Icon size={20} />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <Link
                        to="/admin/profile"
                        className={cn(
                            "flex items-center gap-3 mb-4 px-2 rounded-lg p-2 transition-colors",
                            theme === 'custom'
                                ? "hover:bg-primary"
                                : "hover:bg-gray-100 dark:hover:bg-gray-800"
                        )}
                    >
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium overflow-hidden">
                            {user?.avatar_url ? (
                                <img src={user.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                            ) : (
                                <span>{user?.full_name?.charAt(0)}</span>
                            )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate text-foreground">{user?.full_name}</p>
                            <p className="text-xs text-muted-foreground truncate capitalize">{user?.role?.replace('_', ' ')}</p>
                        </div>
                    </Link>
                    <div className="mb-2 px-2 flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Theme</span>
                        <ModeToggle />
                    </div>
                    <Button variant="outline" className="w-full justify-start gap-2" onClick={logout}>
                        <LogOut size={16} />
                        Sign Out
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8">
                <Outlet />
            </main>
        </div>
    );
}
