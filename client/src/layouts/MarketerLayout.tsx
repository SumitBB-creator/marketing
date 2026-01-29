import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, LogOut, List, LineChart, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';

import { useBranding } from '@/components/branding-provider';

export default function MarketerLayout({ children }: { children?: React.ReactNode }) {
    const { logout, user } = useAuth();
    const { config } = useBranding();
    const location = useLocation();

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Lead Pool', path: '/marketer/pool', icon: Users },
        { name: 'All Leads', path: '/marketer/all-leads', icon: List },
        { name: 'Performance', path: '/marketer/performance', icon: LineChart },
    ];

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
                            <span className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                                {config?.company_name?.substring(0, 2).toUpperCase() || 'MK'}
                            </span>
                        )}
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                            {config?.company_name || 'LeadTrack'}
                        </h1>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                                    isActive
                                        ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 font-medium"
                                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                )}
                            >
                                <Icon size={20} />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <Link to="/marketer/profile" className="flex items-center gap-3 mb-4 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg p-2 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium overflow-hidden">
                            {user?.avatar_url ? (
                                <img src={user.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                            ) : (
                                <span>{user?.full_name?.charAt(0)}</span>
                            )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate text-gray-900 dark:text-white">{user?.full_name}</p>
                            <p className="text-xs text-gray-500 truncate capitalize">{user?.role?.replace('_', ' ')}</p>
                        </div>
                    </Link>
                    <div className="mb-2 px-2 flex justify-between items-center">
                        <span className="text-sm text-gray-500">Theme</span>
                        <ModeToggle />
                    </div>
                    <Button variant="outline" className="w-full justify-start gap-2" onClick={logout}>
                        <LogOut size={16} />
                        Sign Out
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto w-full p-8">
                {children || <Outlet />}
            </main>
        </div>
    );
}
