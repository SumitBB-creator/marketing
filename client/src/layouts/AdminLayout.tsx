// import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, Users, Layers, LogOut, Palette, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';

export default function AdminLayout() {
    const { logout, user } = useAuth();
    const location = useLocation();

    const navItems = [
        { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
        { name: 'All Leads', path: '/admin/leads', icon: List },
        { name: 'Platforms', path: '/admin/platforms', icon: Layers },
        { name: 'Team', path: '/admin/team', icon: Users },
        { name: 'Branding', path: '/admin/branding', icon: Palette },
        { name: 'Performance', path: '/admin/performance', icon: List },];

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="p-6">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs">LP</span>
                        LeadTrack
                    </h1>
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
                                        ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-medium"
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
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium">
                            {user?.full_name?.charAt(0)}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate text-gray-900 dark:text-white">{user?.full_name}</p>
                            <p className="text-xs text-gray-500 truncate capitalize">{user?.role?.replace('_', ' ')}</p>
                        </div>
                    </div>
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
            <main className="flex-1 overflow-y-auto p-8">
                <Outlet />
            </main>
        </div>
    );
}
