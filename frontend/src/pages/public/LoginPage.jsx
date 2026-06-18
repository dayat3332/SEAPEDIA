import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineUser, HiOutlineLockClosed, HiOutlineShoppingBag } from 'react-icons/hi2';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Input } from '../../components/ui';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      toast.error('Please fill all fields.');
      return;
    }
    setLoading(true);
    try {
      const { activeRole, user } = await login(form.username, form.password);
      toast.success(`Welcome back, ${user.full_name}!`);

      if (activeRole) {
        navigate(`/dashboard/${activeRole}`);
      } else {
        navigate('/select-role');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center px-4 py-12 animate-fade-in min-h-screen">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-8 group">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
              <HiOutlineShoppingBag className="text-white" size={24} />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">
              SEAPEDIA
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-primary-200 text-sm">Sign in to your account to continue.</p>
        </div>

        {/* Form Card */}
        <div className="bg-white/95 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/50">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Username"
              icon={HiOutlineUser}
              placeholder="Enter your username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              autoComplete="username"
            />
            <Input
              label="Password"
              icon={HiOutlineLockClosed}
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="current-password"
            />
            <Button type="submit" fullWidth size="lg" loading={loading}>
              Sign In
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-primary-200 mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-white hover:underline transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
