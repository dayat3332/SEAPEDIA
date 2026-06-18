import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_CONFIG } from '../utils/helpers';
import { HiArrowRight, HiOutlineShoppingBag } from 'react-icons/hi2';
import toast from 'react-hot-toast';

// React Bits animation components
import { SplitText, FadeContent } from '../components/reactbits';

export default function RoleSelectPage() {
  const navigate = useNavigate();
  const { user, selectRole } = useAuth();

  const handleSelect = async (role) => {
    try {
      await selectRole(role);
      toast.success(`Switched to ${ROLE_CONFIG[role].label} role.`);
      navigate(`/dashboard/${role}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to select role.');
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="flex items-center justify-center px-4 py-12 min-h-screen">
      <div className="w-full max-w-lg text-center">
        {/* Logo with FadeContent */}
        <FadeContent delay={0} duration={0.5} blur direction="down" distance={20}>
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg">
              <HiOutlineShoppingBag className="text-white" size={24} />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">SEAPEDIA</span>
          </div>
        </FadeContent>

        {/* Title with SplitText animation */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            <SplitText
              text="Choose Your Role"
              delay={0.08}
              duration={0.6}
              ease="easeOut"
              splitBy="words"
              from={{ opacity: 0, y: 30, filter: 'blur(6px)' }}
              to={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              tag="span"
              className="block"
            />
          </h1>
          <FadeContent delay={0.4} duration={0.5} blur direction="up" distance={10}>
            <p className="text-primary-200">
              Welcome, <strong className="text-white">{user.full_name}</strong>! Select the role you want to use for this session.
            </p>
          </FadeContent>
        </div>

        {/* Role cards with staggered FadeContent */}
        <div className="grid grid-cols-1 gap-4">
          {user.roles?.map((role, idx) => {
            const config = ROLE_CONFIG[role];
            return (
              <FadeContent
                key={role}
                delay={0.5 + idx * 0.12}
                duration={0.5}
                blur
                direction="up"
                distance={30}
              >
                <button
                  onClick={() => handleSelect(role)}
                  className="group flex items-center gap-4 p-5 bg-white/95 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer text-left w-full"
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${config.bgClass}`}>
                    {config.IconComponent ? <config.IconComponent size={28} /> : config.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-surface-900">{config.label}</h3>
                    <p className="text-sm text-surface-500">
                      {role === 'seller' && 'Manage your store and products'}
                      {role === 'buyer' && 'Shop and manage your orders'}
                      {role === 'driver' && 'Find and deliver orders'}
                      {role === 'admin' && 'Monitor the marketplace'}
                    </p>
                  </div>
                  <HiArrowRight className="text-surface-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all duration-200" size={20} />
                </button>
              </FadeContent>
            );
          })}
        </div>
      </div>
    </div>
  );
}
