import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  HiOutlineShoppingBag, 
  HiOutlineUser, 
  HiOutlineBars3, 
  HiXMark, 
  HiOutlineArrowRightOnRectangle, 
  HiOutlineSquares2X2,
  HiChevronDown,
  HiOutlineArrowsRightLeft,
  HiOutlineWallet
} from 'react-icons/hi2';
import { HiOutlineHome } from 'react-icons/hi2';
import { useAuth } from '../../contexts/AuthContext';
import { Badge } from '../ui';
import { ROLE_CONFIG } from '../../utils/helpers';

export default function Navbar() {
  const { user, activeRole, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/');
    setMobileOpen(false);
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

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/products', label: 'Products' },
  ];

  const getDashboardPath = () => {
    if (!activeRole) return '/select-role';
    return `/dashboard/${activeRole}`;
  };

  const roleConfig = activeRole ? ROLE_CONFIG[activeRole] : null;

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-surface-100/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-sm group-hover:shadow-glow transition-shadow duration-300">
              <HiOutlineShoppingBag className="text-white" size={20} />
            </div>
            <span className="text-xl font-bold text-surface-900 tracking-tight">
              SEAPEDIA
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === link.to
                    ? 'text-primary-700 bg-primary-50'
                    : 'text-surface-600 hover:text-surface-900 hover:bg-surface-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {activeRole && (
                  <Badge variant={activeRole}>
                    {roleConfig?.icon} {roleConfig?.label}
                  </Badge>
                )}
                {activeRole === 'buyer' && (
                  <Link
                    to="/cart"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-surface-600 hover:text-surface-900 hover:bg-surface-50 transition-colors duration-150"
                  >
                    <HiOutlineShoppingBag size={18} />
                    Cart
                  </Link>
                )}

                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-surface-50 border border-transparent hover:border-surface-100 transition-all duration-200 cursor-pointer focus:outline-none"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                      {getInitials(user?.full_name)}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-surface-800 leading-tight">{user?.full_name}</p>
                      <p className="text-[10px] text-surface-400">@{user?.username}</p>
                    </div>
                    <HiChevronDown className={`text-surface-400 w-4 h-4 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl bg-white border border-surface-100 shadow-modal py-2 animate-scale-in z-50">
                      <div className="px-4 py-3 border-b border-surface-100">
                        <p className="text-xs text-surface-400">Logged in as</p>
                        <p className="text-sm font-bold text-surface-900 mt-0.5 truncate">{user?.full_name}</p>
                        <p className="text-xs text-surface-450">@{user?.username}</p>
                      </div>

                      <div className="p-1 space-y-0.5">
                        <Link
                          to={getDashboardPath()}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-surface-600 hover:text-surface-900 hover:bg-surface-50 transition-colors"
                        >
                          <HiOutlineSquares2X2 size={18} className="text-surface-400" />
                          Dashboard Utama
                        </Link>

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
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-surface-600 hover:text-surface-900 rounded-lg hover:bg-surface-50 transition-colors duration-150"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-surface-600 hover:bg-surface-100 transition-colors cursor-pointer"
          >
            {mobileOpen ? <HiXMark size={24} /> : <HiOutlineBars3 size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-surface-100 bg-white animate-slide-up">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? 'text-primary-700 bg-primary-50'
                    : 'text-surface-600 hover:bg-surface-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                {activeRole === 'buyer' && (
                  <Link
                    to="/cart"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 rounded-lg text-sm font-medium text-surface-600 hover:bg-surface-50"
                  >
                    Cart
                  </Link>
                )}
                <Link
                  to={getDashboardPath()}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-2.5 rounded-lg text-sm font-medium text-primary-700 bg-primary-50"
                >
                  Dashboard {activeRole && `(${ROLE_CONFIG[activeRole]?.label})`}
                </Link>
                {user?.roles?.length > 1 && (
                  <Link
                    to="/select-role"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 rounded-lg text-sm font-medium text-surface-600 hover:bg-surface-50"
                  >
                    Switch Role
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-danger-500 hover:bg-danger-50 cursor-pointer"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center px-4 py-2.5 rounded-xl text-sm font-medium border border-surface-200 text-surface-700 hover:bg-surface-50"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
