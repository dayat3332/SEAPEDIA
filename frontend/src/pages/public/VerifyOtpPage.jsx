import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { HiOutlineEnvelope, HiOutlineShieldCheck, HiOutlineShoppingBag, HiOutlineArrowLeft } from 'react-icons/hi2';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Input } from '../../components/ui';
import toast from 'react-hot-toast';

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOtp, resendOtp } = useAuth();

  const [email, setEmail] = useState(location.state?.email || '');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);

  // Countdown timer for resend button
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Email is required.');
      return;
    }
    if (!otpCode || otpCode.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(email, otpCode);
      toast.success('Email verified successfully! You can now sign in.');
      navigate('/login', { state: { username: location.state?.username } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed. Please check your OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error('Please enter your email to resend OTP.');
      return;
    }
    setResending(true);
    try {
      await resendOtp(email);
      toast.success('A new OTP code has been sent to your email.');
      setTimer(60);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setResending(false);
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
          <h1 className="text-3xl font-bold text-white mb-2">Verify Your Email</h1>
          <p className="text-primary-200 text-sm">Enter the 6-digit OTP code sent to your email.</p>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/50">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email field (readonly if passed from register, otherwise editable) */}
            <Input
              label="Email Address"
              icon={HiOutlineEnvelope}
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!!location.state?.email}
            />

            <Input
              label="Verification Code (OTP)"
              icon={HiOutlineShieldCheck}
              type="text"
              maxLength={6}
              placeholder="e.g. 123456"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              className="text-center tracking-widest text-lg font-bold"
            />

            <Button type="submit" fullWidth size="lg" loading={loading}>
              Verify & Activate Account
            </Button>
          </form>

          {/* Resend Section */}
          <div className="mt-6 text-center text-sm border-t border-surface-100 pt-6">
            <p className="text-surface-500 mb-2">Didn&apos;t receive the code?</p>
            {timer > 0 ? (
              <p className="text-surface-400 font-medium">
                Resend code in <span className="font-semibold text-primary-600">{timer}s</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="font-semibold text-primary-600 hover:text-primary-700 hover:underline transition-colors focus:outline-none cursor-pointer"
              >
                {resending ? 'Sending...' : 'Resend OTP Code'}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-sm text-primary-200 mt-6">
          <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-white hover:underline transition-colors">
            <HiOutlineArrowLeft size={16} /> Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
