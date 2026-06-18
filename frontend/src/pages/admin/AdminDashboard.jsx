import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { adminService, discountService, reviewService } from '../../services';
import { Card, Button, Input, Badge, Spinner, Modal } from '../../components/ui';
import { formatCurrency, formatDate } from '../../utils/helpers';
import RatingStars from '../../components/shared/RatingStars';
import {
  HiOutlineUsers,
  HiOutlineBuildingStorefront,
  HiOutlineCube,
  HiOutlineClipboardDocumentList,
  HiOutlineGift,
  HiOutlineTag,
  HiOutlineCpuChip,
  HiOutlinePlus,
  HiCheckCircle,
  HiOutlineCalendar,
  HiOutlineChatBubbleLeftRight,
  HiOutlineTrash
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('metrics'); // metrics, vouchers, promos, users, reviews
  const [loading, setLoading] = useState(true);

  // Statistics & Logs
  const [metrics, setMetrics] = useState({ userCount: 0, storeCount: 0, productCount: 0, orderCount: 0, totalSales: 0 });
  const [systemLogs, setSystemLogs] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [reviewsList, setReviewsList] = useState([]);

  // Disconts Data
  const [vouchers, setVouchers] = useState([]);
  const [promos, setPromos] = useState([]);

  // Modals & Forms
  const [discountDetail, setDiscountDetail] = useState(null);
  const [discountTypeDetail, setDiscountTypeDetail] = useState('voucher'); // voucher or promo
  const [detailOpen, setDetailOpen] = useState(false);

  // Create Form State
  const [createOpen, setCreateOpen] = useState(false);
  const [formType, setFormType] = useState('voucher'); // voucher or promo
  const [submittingForm, setSubmittingForm] = useState(false);

  // Input States
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('fixed'); // fixed, percentage
  const [discountValue, setDiscountValue] = useState('');
  const [minPurchase, setMinPurchase] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [maxUsage, setMaxUsage] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');

  // Time Simulation States
  const [simulationDays, setSimulationDays] = useState('1');
  const [simulating, setSimulating] = useState(false);

  const handleSimulateTime = async () => {
    if (!simulationDays || isNaN(simulationDays) || parseInt(simulationDays, 10) <= 0) {
      return toast.error('Please enter a valid number of days.');
    }
    try {
      setSimulating(true);
      const res = await adminService.simulateNextDay(parseInt(simulationDays, 10));
      const { refundedOrdersCount } = res.data.data;
      if (refundedOrdersCount > 0) {
        toast.success(
          `Successfully shifted time forward by ${simulationDays} day(s). ${refundedOrdersCount} overdue order(s) auto-refunded to buyers and reversed!`,
          { duration: 6000 }
        );
      } else {
        toast.success(`Shifted time forward by ${simulationDays} day(s). No orders breached SLA.`, { duration: 4500 });
      }
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      toast.error('Simulation leap failed.');
    } finally {
      setSimulating(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'metrics') {
        const [metricsRes, logsRes] = await Promise.all([
          adminService.getMetrics(),
          adminService.getLogs()
        ]);
        setMetrics(metricsRes.data.data);
        setSystemLogs(logsRes.data.data);
      } else if (activeTab === 'vouchers') {
        const res = await discountService.getVouchers();
        setVouchers(res.data.data);
      } else if (activeTab === 'promos') {
        const res = await discountService.getPromos();
        setPromos(res.data.data);
      } else if (activeTab === 'users') {
        const res = await adminService.getUsers();
        setUsersList(res.data.data);
      } else if (activeTab === 'reviews') {
        const res = await reviewService.getReviews({ limit: 100 });
        setReviewsList(res.data.data.reviews);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load admin dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await reviewService.deleteReview(id);
      toast.success('Review deleted successfully.');
      setReviewsList((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete review.');
    }
  };

  const handleDeleteUser = async (id) => {
    if (id === user.id) {
      return toast.error('You cannot delete your own admin account!');
    }
    if (!window.confirm('Are you sure you want to delete this user? This will cascade delete their store, products, wallet, and orders.')) return;
    try {
      await adminService.deleteUser(id);
      toast.success('User deleted successfully.');
      setUsersList((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const handleCreateDiscount = async (e) => {
    e.preventDefault();
    if (!code.trim() || !discountValue || !validFrom || !validUntil) {
      return toast.error('Please fill in all required fields.');
    }

    try {
      setSubmittingForm(true);
      const data = {
        code: code.trim().toUpperCase(),
        discountType,
        discountValue: parseFloat(discountValue),
        minPurchase: minPurchase ? parseFloat(minPurchase) : 0,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        validFrom: new Date(validFrom).toISOString().slice(0, 19).replace('T', ' '),
        validUntil: new Date(validUntil).toISOString().slice(0, 19).replace('T', ' '),
      };

      if (formType === 'voucher') {
        data.maxUsage = parseInt(maxUsage, 10) || 100;
        await discountService.createVoucher(data);
        toast.success(`Voucher code "${data.code}" created successfully!`);
      } else {
        await discountService.createPromo(data);
        toast.success(`Promo code "${data.code}" created successfully!`);
      }

      setCreateOpen(false);
      resetForm();
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create discount.');
    } finally {
      setSubmittingForm(false);
    }
  };

  const resetForm = () => {
    setCode('');
    setDiscountType('fixed');
    setDiscountValue('');
    setMinPurchase('');
    setMaxDiscount('');
    setMaxUsage('');
    setValidFrom('');
    setValidUntil('');
  };

  const openDiscountDetail = (discount, type) => {
    setDiscountDetail(discount);
    setDiscountTypeDetail(type);
    setDetailOpen(true);
  };

  const openCreateModal = (type) => {
    setFormType(type);
    resetForm();
    setCreateOpen(true);
  };

  if (loading && systemLogs.length === 0 && vouchers.length === 0 && usersList.length === 0 && reviewsList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Spinner size="lg" />
        <p className="text-surface-500 mt-4 font-medium">Loading Admin Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-surface-900">Admin Dashboard</h1>
            <Badge variant="admin">System Admin</Badge>
          </div>
          <p className="text-surface-500">System Monitoring, Users Ledger, Vouchers & Promos Configuration.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-200 mb-8 overflow-x-auto gap-2">
        {[
          { id: 'metrics', label: 'Overview & Logs', icon: HiOutlineCpuChip },
          { id: 'vouchers', label: 'Vouchers (Coupons)', icon: HiOutlineGift },
          { id: 'promos', label: 'Promos (Campaigns)', icon: HiOutlineTag },
          { id: 'users', label: 'Market Users', icon: HiOutlineUsers },
          { id: 'reviews', label: 'User Feedback', icon: HiOutlineChatBubbleLeftRight },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-semibold text-sm transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-700 bg-primary-50/50 rounded-t-lg'
                : 'border-transparent text-surface-500 hover:text-surface-800 hover:border-surface-300'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        {/* TAB 1: METRICS & LOGS */}
        {activeTab === 'metrics' && (
          <div className="space-y-8">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: HiOutlineUsers, label: 'Total Users', value: metrics.userCount, color: 'purple' },
                { icon: HiOutlineBuildingStorefront, label: 'Total Stores', value: metrics.storeCount, color: 'amber' },
                { icon: HiOutlineCube, label: 'Active Products', value: metrics.productCount, color: 'primary' },
                { icon: HiOutlineClipboardDocumentList, label: 'Total Orders', value: metrics.orderCount, color: 'emerald' },
                { icon: HiOutlineCpuChip, label: 'Overdue Orders (Past SLA)', value: metrics.overdueCount || 0, color: 'red' },
                { icon: HiOutlineGift, label: 'Total Sales Revenue', value: formatCurrency(metrics.totalSales), color: 'indigo' },
              ].map((stat, i) => (
                <Card key={i} className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-${stat.color}-50 text-${stat.color}-600 flex items-center justify-center flex-shrink-0`}>
                      <stat.icon size={24} />
                    </div>
                    <div>
                      <p className="text-xs text-surface-400 font-semibold uppercase">{stat.label}</p>
                      <p className="text-lg font-extrabold text-surface-900 mt-0.5">{stat.value}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Simulation and Logs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Operational Time Simulation */}
              <div className="lg:col-span-1">
                <Card className="p-6 h-full flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-surface-900 text-lg mb-2 flex items-center gap-2">
                      <HiOutlineCalendar className="text-primary-600" />
                      Operational Time Leap
                    </h3>
                    <p className="text-xs text-surface-500 mb-4 leading-relaxed">
                      SEAPEDIA enforces delivery SLAs: <br />
                      • <strong>Instant:</strong> 2 Hours SLA <br />
                      • <strong>Next Day:</strong> 24 Hours SLA <br />
                      • <strong>Regular:</strong> 72 Hours SLA <br /><br />
                      Simulate shifting time forward to check active orders against SLAs. Breaching orders are auto-returned, refunded to buyers, and product stocks restored.
                    </p>
                  </div>
                  <div className="space-y-4 pt-4 border-t border-surface-100">
                    <div>
                      <label className="block text-xs font-bold text-surface-400 uppercase mb-1.5">Days to Shift Forward</label>
                      <Input
                        type="number"
                        min="1"
                        value={simulationDays}
                        onChange={(e) => setSimulationDays(e.target.value)}
                        placeholder="e.g. 1"
                        disabled={simulating}
                      />
                    </div>
                    <Button fullWidth onClick={handleSimulateTime} loading={simulating} disabled={simulating}>
                      Simulate Time Leap
                    </Button>
                  </div>
                </Card>
              </div>

              {/* System Event Logs */}
              <div className="lg:col-span-2">
                <Card className="p-6 h-full">
                  <h3 className="font-bold text-surface-900 text-lg mb-4 flex items-center gap-2">
                    <HiOutlineCpuChip className="text-primary-600" />
                    Live Order Event Logs
                  </h3>
                  {systemLogs.length === 0 ? (
                    <div className="text-center py-12 text-surface-400">No events logged yet.</div>
                  ) : (
                    <div className="overflow-y-auto max-h-[350px]">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-surface-50 border-b border-surface-200 text-surface-500 font-semibold uppercase tracking-wider text-xs sticky top-0">
                          <tr>
                            <th className="px-6 py-3">Timestamp</th>
                            <th className="px-6 py-3">Order Number</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Note</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-150 text-surface-700 bg-white">
                          {systemLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-surface-50/50">
                              <td className="px-6 py-4 text-xs text-surface-400">{formatDate(log.created_at)}</td>
                              <td className="px-6 py-4 font-bold text-surface-800">{log.order_number}</td>
                              <td className="px-6 py-4">
                                <Badge variant={log.status === 'pesanan_selesai' ? 'success' : log.status === 'dikembalikan' ? 'danger' : 'info'} size="sm">
                                  {log.status}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-xs font-medium max-w-xs truncate" title={log.note}>
                                {log.note}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VOUCHERS */}
        {activeTab === 'vouchers' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-surface-900 text-lg">System Vouchers</h3>
              <Button size="sm" onClick={() => openCreateModal('voucher')} className="flex items-center gap-1.5">
                <HiOutlinePlus size={16} />
                Generate Voucher
              </Button>
            </div>

            {vouchers.length === 0 ? (
              <Card className="p-12 text-center border-dashed border-2 border-surface-250">
                <HiOutlineGift className="mx-auto text-surface-300 mb-4 animate-bounce" size={40} />
                <p className="text-surface-500 font-medium mb-1">No vouchers created yet</p>
                <p className="text-xs text-surface-400 mb-6">Create a voucher code for buyers to redeem during checkout.</p>
                <Button size="sm" onClick={() => openCreateModal('voucher')}>Create First Voucher</Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vouchers.map((v) => (
                  <Card key={v.id} className="p-6 hover:shadow-card transition-all flex flex-col justify-between border border-surface-200">
                    <div>
                      <div className="flex justify-between items-start pb-3 border-b border-surface-100 mb-4">
                        <div>
                          <p className="font-extrabold text-primary-700 text-base">{v.code}</p>
                          <p className="text-[10px] text-surface-400 font-medium">Created: {formatDate(v.created_at)}</p>
                        </div>
                        <Badge variant={v.is_active ? 'success' : 'danger'}>
                          {v.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-6 text-xs text-surface-600">
                        <div className="flex justify-between">
                          <span>Discount Value:</span>
                          <span className="font-bold text-surface-850">
                            {v.discount_type === 'fixed' ? formatCurrency(v.discount_value) : `${v.discount_value}%`}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Min Purchase Required:</span>
                          <span className="font-bold text-surface-850">{formatCurrency(v.min_purchase)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Redemptions Used:</span>
                          <span className="font-semibold text-surface-850">{v.used_count} / {v.max_usage} limit</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-surface-100 flex justify-end">
                      <Button size="xs" variant="secondary" onClick={() => openDiscountDetail(v, 'voucher')}>
                        View Rules & Details
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PROMOS */}
        {activeTab === 'promos' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-surface-900 text-lg">System Promos</h3>
              <Button size="sm" onClick={() => openCreateModal('promo')} className="flex items-center gap-1.5">
                <HiOutlinePlus size={16} />
                Generate Promo
              </Button>
            </div>

            {promos.length === 0 ? (
              <Card className="p-12 text-center border-dashed border-2 border-surface-250">
                <HiOutlineTag className="mx-auto text-surface-300 mb-4 animate-bounce" size={40} />
                <p className="text-surface-500 font-medium mb-1">No promos configured yet</p>
                <p className="text-xs text-surface-400 mb-6">Create promotional codes for store-wide marketing campaigns.</p>
                <Button size="sm" onClick={() => openCreateModal('promo')}>Create First Promo</Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {promos.map((p) => (
                  <Card key={p.id} className="p-6 hover:shadow-card transition-all flex flex-col justify-between border border-surface-200">
                    <div>
                      <div className="flex justify-between items-start pb-3 border-b border-surface-100 mb-4">
                        <div>
                          <p className="font-extrabold text-accent-600 text-base">{p.code}</p>
                          <p className="text-[10px] text-surface-400 font-medium">Created: {formatDate(p.created_at)}</p>
                        </div>
                        <Badge variant={p.is_active ? 'success' : 'danger'}>
                          {p.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-6 text-xs text-surface-600">
                        <div className="flex justify-between">
                          <span>Discount Value:</span>
                          <span className="font-bold text-surface-850">
                            {p.discount_type === 'fixed' ? formatCurrency(p.discount_value) : `${p.discount_value}%`}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Min Purchase Required:</span>
                          <span className="font-bold text-surface-850">{formatCurrency(p.min_purchase)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-surface-100 flex justify-end">
                      <Button size="xs" variant="secondary" onClick={() => openDiscountDetail(p, 'promo')}>
                        View Rules & Details
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: USERS LIST */}
        {activeTab === 'users' && (
          <Card className="p-6">
            <h3 className="font-bold text-surface-900 text-lg mb-4">Platform Users Ledger</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-surface-50 border-b border-surface-200 text-surface-500 font-semibold uppercase tracking-wider text-xs">
                  <tr>
                    <th className="px-6 py-3.5">User Profile</th>
                    <th className="px-6 py-3.5">Contact Details</th>
                    <th className="px-6 py-3.5">Assigned Roles</th>
                    <th className="px-6 py-3.5">Register Date</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-150 text-surface-700">
                  {usersList.map((usr) => (
                    <tr key={usr.id} className="hover:bg-surface-50/50">
                      <td className="px-6 py-4">
                        <p className="font-bold text-surface-900">{usr.full_name}</p>
                        <p className="text-xs text-surface-400">@{usr.username}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-semibold text-surface-700">{usr.email}</p>
                        <p className="text-xs text-surface-400">{usr.phone}</p>
                      </td>
                      <td className="px-6 py-4 flex flex-wrap gap-1.5 pt-5">
                        {usr.roles.map((r, ri) => (
                          <Badge key={ri} variant={r} size="sm">{r}</Badge>
                        ))}
                      </td>
                      <td className="px-6 py-4 text-xs text-surface-400">{formatDate(usr.created_at)}</td>
                      <td className="px-6 py-4 text-right">
                        {usr.id !== user?.id ? (
                          <button
                            onClick={() => handleDeleteUser(usr.id)}
                            className="p-1.5 text-red-650 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete User"
                          >
                            <HiOutlineTrash size={18} />
                          </button>
                        ) : (
                          <span className="text-xs text-surface-400 italic">Self (Admin)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* TAB 5: APPLICATION REVIEWS */}
        {activeTab === 'reviews' && (
          <Card className="p-6 animate-fade-in">
            <h3 className="font-bold text-surface-900 text-lg mb-4">Application Reviews & Feedback</h3>
            {reviewsList.length === 0 ? (
              <div className="text-center py-12 text-surface-400">No reviews submitted yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-surface-50 border-b border-surface-200 text-surface-500 font-semibold uppercase tracking-wider text-xs">
                    <tr>
                      <th className="px-6 py-3.5">Reviewer</th>
                      <th className="px-6 py-3.5">Rating</th>
                      <th className="px-6 py-3.5">Comment</th>
                      <th className="px-6 py-3.5">Date</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-150 text-surface-700 bg-white">
                    {reviewsList.map((rev) => (
                      <tr key={rev.id} className="hover:bg-surface-50/50">
                        <td className="px-6 py-4 font-bold text-surface-900 whitespace-nowrap">
                          {rev.reviewer_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <RatingStars rating={rev.rating} size={14} />
                        </td>
                        <td className="px-6 py-4 max-w-md">
                          <p className="text-surface-700 font-medium leading-relaxed whitespace-pre-wrap">{rev.comment}</p>
                        </td>
                        <td className="px-6 py-4 text-xs text-surface-400 whitespace-nowrap">
                          {formatDate(rev.created_at)}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleDeleteReview(rev.id)}
                            className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Review"
                          >
                            <HiOutlineTrash size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* CREATE MODAL */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title={`Generate New ${formType === 'voucher' ? 'Voucher' : 'Promo Campaign'}`}>
        <form onSubmit={handleCreateDiscount} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-surface-500 uppercase mb-1">Code *</label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. MEGASALE100"
                required
                disabled={submittingForm}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-500 uppercase mb-1">Discount Type *</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                className="w-full px-4 py-2 border border-surface-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                disabled={submittingForm}
              >
                <option value="fixed">Fixed Value (Rp)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-surface-500 uppercase mb-1">Value *</label>
              <Input
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === 'fixed' ? 'e.g. 10000' : 'e.g. 15'}
                required
                min="1"
                disabled={submittingForm}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-500 uppercase mb-1">Min Purchase Required</label>
              <Input
                type="number"
                value={minPurchase}
                onChange={(e) => setMinPurchase(e.target.value)}
                placeholder="e.g. 50000"
                min="0"
                disabled={submittingForm}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-500 uppercase mb-1">Max Discount Cap</label>
              <Input
                type="number"
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(e.target.value)}
                placeholder="e.g. 20000"
                min="0"
                disabled={submittingForm}
              />
            </div>
          </div>

          {formType === 'voucher' && (
            <div>
              <label className="block text-xs font-bold text-surface-500 uppercase mb-1">Max Usage Redemptions Limit *</label>
              <Input
                type="number"
                value={maxUsage}
                onChange={(e) => setMaxUsage(e.target.value)}
                placeholder="e.g. 10"
                required
                min="1"
                disabled={submittingForm}
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-surface-500 uppercase mb-1">Valid From *</label>
              <input
                type="datetime-local"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                className="w-full px-4 py-2 border border-surface-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                required
                disabled={submittingForm}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-500 uppercase mb-1">Valid Until *</label>
              <input
                type="datetime-local"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-4 py-2 border border-surface-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                required
                disabled={submittingForm}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-200">
            <Button variant="secondary" type="button" onClick={() => setCreateOpen(false)} disabled={submittingForm}>
              Cancel
            </Button>
            <Button type="submit" loading={submittingForm}>
              Create Code
            </Button>
          </div>
        </form>
      </Modal>

      {/* DETAIL MODAL */}
      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title={`${discountTypeDetail === 'voucher' ? 'Voucher' : 'Promo'} Coupon Rules`}>
        {discountDetail && (
          <div className="space-y-5 pt-2">
            <div className="flex justify-between items-center border-b border-surface-200 pb-3">
              <div>
                <h4 className="font-extrabold text-xl text-primary-700">{discountDetail.code}</h4>
                <p className="text-xs text-surface-400 capitalize">Type: {discountTypeDetail}</p>
              </div>
              <Badge variant={discountDetail.is_active ? 'success' : 'danger'}>
                {discountDetail.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            <div className="space-y-2.5 text-sm text-surface-650">
              <div className="flex justify-between pb-1.5 border-b border-surface-100">
                <span className="font-medium">Discount Value</span>
                <span className="font-bold text-surface-900">
                  {discountDetail.discount_type === 'fixed' ? formatCurrency(discountDetail.discount_value) : `${discountDetail.discount_value}%`}
                </span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-surface-100">
                <span className="font-medium">Minimum Purchase</span>
                <span className="font-bold text-surface-900">{formatCurrency(discountDetail.min_purchase)}</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-surface-100">
                <span className="font-medium">Maximum Discount Cap</span>
                <span className="font-bold text-surface-900">
                  {discountDetail.max_discount ? formatCurrency(discountDetail.max_discount) : 'No Limit'}
                </span>
              </div>
              {discountTypeDetail === 'voucher' && (
                <div className="flex justify-between pb-1.5 border-b border-surface-100">
                  <span className="font-medium">Usage Limit</span>
                  <span className="font-bold text-surface-900">{discountDetail.used_count} / {discountDetail.max_usage} redemptions</span>
                </div>
              )}
            </div>

            <div className="p-3 bg-surface-50 border border-surface-200 rounded-xl space-y-1.5 text-xs text-surface-500">
              <div className="flex items-center gap-1.5">
                <HiOutlineCalendar size={14} className="text-primary-600" />
                <span>Starts: <strong>{formatDate(discountDetail.valid_from)}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <HiOutlineCalendar size={14} className="text-primary-600" />
                <span>Expires: <strong>{formatDate(discountDetail.valid_until)}</strong></span>
              </div>
            </div>

            <Button fullWidth onClick={() => setDetailOpen(false)}>
              Close Detail
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
