import { Link } from 'react-router-dom';
import { HiOutlineShoppingBag } from 'react-icons/hi2';

export default function Footer() {
  return (
    <footer className="bg-surface-900 text-surface-300 border-t border-surface-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm">
                <HiOutlineShoppingBag className="text-white" size={20} />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">SEAPEDIA</span>
            </div>
            <p className="text-sm text-surface-400 max-w-sm leading-relaxed">
              Your trusted multi-role marketplace connecting sellers, buyers, and drivers
              in one seamless platform.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Marketplace</h4>
            <ul className="space-y-2.5">
              <li><Link to="/products" className="text-sm text-surface-400 hover:text-white transition-colors duration-200">Browse Products</Link></li>
              <li><Link to="/register" className="text-sm text-surface-400 hover:text-white transition-colors duration-200">Become a Seller</Link></li>
              <li><Link to="/register" className="text-sm text-surface-400 hover:text-white transition-colors duration-200">Become a Driver</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Support</h4>
            <ul className="space-y-2.5">
              <li><span className="text-sm text-surface-400">Help Center</span></li>
              <li><span className="text-sm text-surface-400">Privacy Policy</span></li>
              <li><span className="text-sm text-surface-400">Terms of Service</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-surface-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-surface-500">
            &copy; {new Date().getFullYear()} SEAPEDIA. Built for COMPFEST 18 SE Academy.
          </p>
        </div>
      </div>
    </footer>
  );
}
