import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  HiOutlineShoppingBag, 
  HiOutlineArrowRightOnRectangle, 
  HiOutlineArrowsRightLeft, 
  HiOutlineHome, 
  HiChevronDown,
  HiOutlineSquares2X2,
  HiOutlineWallet
} from 'react-icons/hi2';
import { useAuth } from '../../contexts/AuthContext';
import { Badge } from '../ui';
import { ROLE_CONFIG } from '../../utils/helpers';

export default function DashboardHeader() {
  const { user, activeRole, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const roleConfig = activeRole ? ROLE_CONFIG[activeRole] : null;

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/');
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDashboardPath = () => {
    if (!activeRole) return '/select-role';
    return `/dashboard/${activeRole}`;
  };

  // Get User Initials for Avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <header className="dashboard-header sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-surface-100/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Role */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-sm group-hover:shadow-glow transition-shadow duration-300">
                <HiOutlineShoppingBag className="text-white" size={18} />
              </div>
              <span className="text-lg font-bold text-surface-900 tracking-tight hidden sm:block">
                SEAPEDIA
              </span>
            </Link>

            {activeRole && (
              <div className="flex items-center gap-2 pl-4 border-l border-surface-200">
                <Badge variant={activeRole} size="md" className="flex items-center gap-1">
                  {roleConfig?.IconComponent && <roleConfig.IconComponent size={15} />}
                  <span>{roleConfig?.label} Dashboard</span>
                </Badge>
              </div>
            )}
          </div>

          {/* User Dropdown Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl hover:bg-surface-50 border border-transparent hover:border-surface-100 transition-all duration-200 cursor-pointer focus:outline-none"
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                {getInitials(user?.full_name)}
              </div>
              
              {/* User Details */}
              <div className="text-left hidden sm:block">
                <p className="text-sm font-semibold text-surface-800 leading-tight">{user?.full_name}</p>
                <p className="text-xs text-surface-450">@{user?.username}</p>
              </div>
              
              <HiChevronDown className={`text-surface-400 w-4 h-4 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Card */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl bg-white border border-surface-100 shadow-modal py-2 animate-scale-in z-50">
                {/* Header User info */}
                <div className="px-4 py-3 border-b border-surface-100">
                  <p className="text-xs text-surface-400">Logged in as</p>
                  <p className="text-sm font-bold text-surface-900 mt-0.5 truncate">{user?.full_name}</p>
                  <p className="text-xs text-surface-450">@{user?.username}</p>
                </div>

                {/* Menu Options */}
                <div className="p-1 space-y-0.5">
                  <Link
                    to="/"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-surface-600 hover:text-surface-900 hover:bg-surface-50 transition-colors"
                  >
                    <HiOutlineHome size={18} className="text-surface-400" />
                    Home (Beranda)
                  </Link>

                  {/* Link to active dashboard (where top-up is on buyer) */}
                  <Link
                    to={getDashboardPath()}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-surface-600 hover:text-surface-900 hover:bg-surface-50 transition-colors"
                  >
                    <HiOutlineSquares2X2 size={18} className="text-surface-400" />
                    Dashboard Utama
                  </Link>

                  {/* Link khusus ke Buyer Dashboard jika user punya role buyer & ingin top-up */}
                  {user?.roles?.includes('buyer') && activeRole !== 'buyer' && (
                    <Link
                      to="/dashboard/buyer"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-surface-600 hover:text-surface-900 hover:bg-surface-50 transition-colors"
                    >
                      <HiOutlineWallet size={18} className="text-surface-400" />
                      Buyer Dashboard (Top Up)
                    </Link>
                  )}

                  {user?.roles?.length > 1 && (
                    <Link
                      to="/select-role"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-surface-600 hover:text-surface-900 hover:bg-surface-50 transition-colors"
                    >
                      <HiOutlineArrowsRightLeft size={18} className="text-surface-400" />
                      Switch Role (Ganti Role)
                    </Link>
                  )}
                </div>

                {/* Logout */}
                <div className="border-t border-surface-100 p-1 mt-1">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-danger-600 hover:bg-danger-50 transition-colors cursor-pointer"
                  >
                    <HiOutlineArrowRightOnRectangle size={18} />
                    Keluar (Logout)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
