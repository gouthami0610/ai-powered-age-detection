import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, Home, Search, Bell, ShieldCheck } from 'lucide-react';
import { auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import Button from './Button';
import Avatar from './Avatar';
import { APP_NAME } from '../constants';

const Navbar: React.FC = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-blue-600">
            <ShieldCheck className="h-8 w-8" />
            <span className="hidden sm:inline">{APP_NAME}</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link to="/" className="p-2 text-gray-500 hover:text-blue-600 transition-colors">
                <Home className="h-6 w-6" />
              </Link>
              <Link to="/search" className="p-2 text-gray-500 hover:text-blue-600 transition-colors">
                <Search className="h-6 w-6" />
              </Link>
              <Link to="/notifications" className="p-2 text-gray-500 hover:text-blue-600 transition-colors">
                <Bell className="h-6 w-6" />
              </Link>
              <Link to={`/profile/${user.uid}`} className="flex items-center gap-2 p-1">
                <Avatar src={user.photoURL || undefined} size="sm" />
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-500 hover:text-red-600">
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
