import { User } from '../types';
import { LogOut, Users, BarChart3, Home } from 'lucide-react';

interface NavigationProps {
  currentUser: User;
  currentView: string;
  onLogout: () => void;
}

export default function Navigation({ currentUser, currentView, onLogout }: NavigationProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold text-blue-600">MindLedger Lite</h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              {currentUser.avatar_url && (
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <div className="text-sm">
                <p className="font-medium text-gray-900">{currentUser.name}</p>
                <p className="text-gray-600 text-xs capitalize">{currentUser.role}</p>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
