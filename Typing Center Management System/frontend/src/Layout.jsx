import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { checkAuth, getUser, logout } from '@/services/authApi';
import ChangePassword from '@/Components/ChangePassword';
import useIdleTimeout from '@/hooks/useIdleTimeout';
import { 
  Menu, 
  X, 
  LogOut, 
  User as UserIcon,
  Shield,
  Home,
  Users,
  FileText,
  CreditCard,
  ClipboardList,
  BarChart3,
  Globe
} from 'lucide-react';
import { Button } from '@/Components/ui/button';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  // 60-minute idle timeout
  useIdleTimeout(60);

  useEffect(() => {
    console.log("Current user:", user);
    console.log("User role:", user?.role);
  }, [user]);

  useEffect(() => {
    const verifyAuth = async () => {
      const { isAuthenticated, user: authUser } = await checkAuth();
      
      if (!isAuthenticated && location.pathname !== '/login') {
        navigate('/login');
      } else {
        setUser(authUser);
      }
      
      setAuthChecked(true);
    };

    verifyAuth();
  }, [navigate, location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { 
      path: '/dashboard', 
      icon: <Home className="w-5 h-5" />, 
      label: 'Dashboard', 
      allowedRoles: ['admin', 'user'] 
    },
    { 
      path: '/clients', 
      icon: <Users className="w-5 h-5" />, 
      label: 'Clients', 
      allowedRoles: ['admin', 'user'] 
    },
    { 
      path: '/quotations', 
      icon: <FileText className="w-5 h-5" />, 
      label: 'Quotations', 
      allowedRoles: ['admin', 'user'] 
    },
    { 
      path: '/invoices', 
      icon: <CreditCard className="w-5 h-5" />, 
      label: 'Invoices', 
      allowedRoles: ['admin', 'user'] 
    },
    { 
      path: '/payments', 
      icon: <CreditCard className="w-5 h-5" />, 
      label: 'Payments', 
      allowedRoles: ['admin', 'user'] 
    },
    { 
      path: '/applications', 
      icon: <ClipboardList className="w-5 h-5" />, 
      label: 'Applications', 
      allowedRoles: ['admin', 'user'] 
    },
    { 
      path: '/useful-links', 
      icon: <Globe className="w-5 h-5" />, 
      label: 'Useful Links', 
      allowedRoles: ['admin', 'user'] 
    },
    { 
      path: '/reports', 
      icon: <BarChart3 className="w-5 h-5" />, 
      label: 'Reports', 
      allowedRoles: ['admin']
    },
    { 
      path: '/users', 
      icon: <Shield className="w-5 h-5" />, 
      label: 'User Management', 
      allowedRoles: ['admin']
    },
  ];

  const canAccess = (allowedRoles) => {
    console.log("Checking access:", {
      userRole: user?.role,
      allowedRoles,
      result: allowedRoles.includes(user?.role)
    });
    return allowedRoles.includes(user?.role);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile sidebar toggle - FIXED position */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-white shadow-md"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Sidebar - FIXED for mobile, STATIC for desktop */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white shadow-lg lg:shadow-none
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">TC</span>
              </div>
              <div>
                <h1 className="font-bold text-slate-800">Typing Center</h1>
                <p className="text-xs text-slate-500">Management System</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              if (!canAccess(item.allowedRoles)) return null;
              
              const isActive = location.pathname === item.path;
              
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors
                    ${isActive 
                      ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                      : 'text-slate-600 hover:bg-slate-50'
                    }
                  `}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t">
            {user && (
              <div className="flex items-center space-x-3 mb-4 p-3 bg-slate-50 rounded-lg">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-800">{user.full_name}</p>
                  <div className="flex items-center gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.role}
                    </span>
                    <button 
                      onClick={() => setShowChangePassword(true)}
                      className="text-xs text-amber-600 hover:text-amber-700 ml-2"
                    >
                      Change Password
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <Button
              variant="outline"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content - Full width on mobile, margin on desktop */}
      <main className="flex-1 min-h-screen lg:ml-0">
        {/* Spacer for mobile toggle button */}
        <div className="h-16 lg:h-0"></div>
        
        {/* Actual content */}
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Change Password Dialog */}
      <ChangePassword 
        open={showChangePassword}
        onOpenChange={setShowChangePassword}
      />
    </div>
  );
}