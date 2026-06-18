import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineUser, HiOutlineLockClosed, HiOutlineEnvelope, HiOutlinePhone, HiOutlineIdentification, HiOutlineShoppingBag } from 'react-icons/hi2';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Input } from '../../components/ui';
import { ROLE_CONFIG } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    username: '', email: '', phone: '', password: '', confirmPassword: '', fullName: '', roles: [],
  });
  const [loading, setLoading] = useState(false);

  const toggleRole = (role) => {
    setForm((prev) => ({
      ...prev,
      roles: prev.roles.includes(role) ? prev.roles.filter((r) => r !== role) : [...prev.roles, role],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password || !form.fullName) {
      toast.error('Please fill all required fields.');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (form.roles.length === 0) {
      toast.error('Please select at least one role.');
      return;
    }

    setLoading(true);
    try {
      await register({
        username: form.username,
        email: form.email,
        phone: form.phone,
        password: form.password,
        fullName: form.fullName,
        roles: form.roles,
      });
      toast.success('Registration successful! Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const selectableRoles = ['buyer', 'seller', 'driver'];

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
          <h1 className="text-3xl font-bold text-white mb-2">Create Your Account</h1>
          <p className="text-primary-200 text-sm">Join the SEAPEDIA marketplace today.</p>
        </div>

        {/* Form Card */}
        <div className="bg-white/95 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/50">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name *"
              icon={HiOutlineIdentification}
              placeholder="Your full name"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
            <Input
              label="Username *"
              icon={HiOutlineUser}
              placeholder="Choose a username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              autoComplete="username"
            />
            <Input
              label="Email *"
              icon={HiOutlineEnvelope}
              type="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Phone (optional)"
              icon={HiOutlinePhone}
              type="tel"
              placeholder="081234567890"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Input
              label="Password *"
              icon={HiOutlineLockClosed}
              type="password"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="new-password"
            />
            <Input
              label="Confirm Password *"
              icon={HiOutlineLockClosed}
              type="password"
              placeholder="Confirm your password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              autoComplete="new-password"
            />

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Select Your Role(s) *
              </label>
              <p className="text-xs text-surface-400 mb-3">You can have multiple roles.</p>
              <div className="grid grid-cols-3 gap-2">
                {selectableRoles.map((role) => {
                  const config = ROLE_CONFIG[role];
                  const selected = form.roles.includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleRole(role)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 cursor-pointer ${
                        selected
                          ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                          : 'border-surface-200 text-surface-500 hover:border-surface-300 hover:bg-surface-50'
                      }`}
                    >
                      <span className="text-xl">{config.icon}</span>
                      <span>{config.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Button type="submit" fullWidth size="lg" loading={loading}>
              Create Account
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-primary-200 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-white hover:underline transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
