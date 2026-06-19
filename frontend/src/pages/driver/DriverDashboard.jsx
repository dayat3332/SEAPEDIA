import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { deliveryService } from '../../services';
import { Card, Button, Badge, Spinner, Modal } from '../../components/ui';
import { formatCurrency, formatDate } from '../../utils/helpers';
import {
  HiOutlineBriefcase,
  HiOutlineCheckCircle,
  HiOutlineMapPin,
  HiOutlineTruck,
  HiOutlineBuildingStorefront,
  HiOutlineClipboardDocumentCheck,
  HiCheck,
  HiOutlineArrowRightOnRectangle
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

export default function DriverDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, available, history
  const [loading, setLoading] = useState(true);
  
  // Dashboard & history data
  const [walletBalance, setWalletBalance] = useState(0);
  const [activeJob, setActiveJob] = useState(null);
  const [history, setHistory] = useState([]);
  
  // Available jobs data
  const [availableJobs, setAvailableJobs] = useState([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  
  // Modals / Details
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobDetailOpen, setJobDetailOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Confirm Complete Modal State
  const [confirmCompleteOpen, setConfirmCompleteOpen] = useState(false);
  const [pendingCompleteId, setPendingCompleteId] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await deliveryService.getDriverDashboard();
      const { balance, activeJob, history } = res.data.data;
      setWalletBalance(balance);
      setActiveJob(activeJob);
      setHistory(history);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load driver data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableJobs = async () => {
    try {
      setLoadingAvailable(true);
      const res = await deliveryService.getAvailableJobs();
      setAvailableJobs(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load available jobs.');
    } finally {
      setLoadingAvailable(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'available') {
      fetchAvailableJobs();
    } else {
      fetchDashboardData();
    }
  }, [activeTab]);

  const handleTakeJob = async (jobId) => {
    try {
      setActionLoading(true);
      await deliveryService.takeJob(jobId);
      toast.success('Job accepted successfully! Drive safely.');
      setJobDetailOpen(false);
      setSelectedJob(null);
      // Switch to dashboard tab to show active job
      setActiveTab('dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to take job.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteJob = async (jobId) => {
    try {
      setActionLoading(true);
      const res = await deliveryService.completeJob(jobId);
      toast.success(`Delivery completed! You earned ${formatCurrency(res.data.data.earning)}.`);
      setConfirmCompleteOpen(false);
      setPendingCompleteId(null);
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete delivery.');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmCompleteJob = (jobId) => {
    setPendingCompleteId(jobId);
    setConfirmCompleteOpen(true);
  };

  const openJobDetail = (job) => {
    setSelectedJob(job);
    setJobDetailOpen(true);
  };

  if (loading && activeTab !== 'available') {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Spinner size="lg" />
        <p className="text-surface-500 mt-4 font-medium">Loading driver dashboard...</p>
      </div>
    );
  }

  // Delivery Method Badge
  const getDeliveryMethodBadge = (method) => {
    switch (method) {
      case 'instant':
        return <Badge variant="danger">Instant</Badge>;
      case 'next_day':
        return <Badge variant="warning">Next Day</Badge>;
      default:
        return <Badge variant="info">Regular</Badge>;
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-surface-900">Driver Portal</h1>
            <Badge variant="driver" className="flex items-center gap-1">
              <HiOutlineTruck size={14} />
              <span>Driver</span>
            </Badge>
          </div>
          <p className="text-surface-500">Welcome back, {user?.full_name}. Manage deliveries and track your earnings.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-200 mb-8 overflow-x-auto gap-2">
        {[
          { id: 'dashboard', label: 'My Dashboard', icon: HiOutlineBriefcase },
          { id: 'available', label: 'Find Delivery Jobs', icon: HiOutlineTruck },
          { id: 'history', label: 'Job History', icon: HiOutlineClipboardDocumentCheck },
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

      {/* Contents */}
      <div className="space-y-6">
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Wallet Stats */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="p-6 bg-gradient-to-br from-primary-600 to-primary-800 text-white shadow-md relative overflow-hidden">
                <div className="absolute -right-8 -bottom-8 opacity-10">
                  <HiOutlineTruck size={140} />
                </div>
                <div className="relative z-10">
                  <p className="text-primary-100 text-xs font-semibold uppercase tracking-wider mb-2">Total Earnings (Wallet Balance)</p>
                  <p className="text-3xl font-extrabold mb-4">{formatCurrency(walletBalance)}</p>
                  <div className="p-3 rounded-lg bg-white/10 text-xs flex justify-between items-center">
                    <span>Completed Jobs:</span>
                    <span className="font-bold">{history.length}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Active Job status */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-bold text-surface-900 text-lg">Active Delivery Assignment</h3>
              {activeJob ? (
                <Card className="p-6 border border-emerald-100 bg-emerald-50/5">
                  <div className="flex justify-between items-start gap-4 mb-4 pb-4 border-b border-surface-150">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-surface-900">{activeJob.order_number}</span>
                        {getDeliveryMethodBadge(activeJob.delivery_method)}
                      </div>
                      <p className="text-xs text-surface-500">Picked up at: {formatDate(activeJob.picked_up_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-surface-450 uppercase font-semibold">Your Earning</p>
                      <p className="text-base font-extrabold text-emerald-600">{formatCurrency(activeJob.delivery_fee * 0.80)}</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div>
                      <p className="text-xs font-bold text-surface-400 uppercase mb-1 flex items-center gap-1">
                        <HiOutlineBuildingStorefront size={14} /> Store Merchant
                      </p>
                      <p className="text-sm font-semibold text-surface-850">{activeJob.store_name}</p>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-surface-400 uppercase mb-1 flex items-center gap-1">
                        <HiOutlineMapPin size={14} /> Delivery Destination
                      </p>
                      <p className="text-xs text-surface-500 font-semibold mb-0.5">
                        Recipient: {activeJob.delivery_address_snapshot.split(' | ')[0]} ({activeJob.delivery_address_snapshot.split(' | ')[1]})
                      </p>
                      <p className="text-xs text-surface-650 leading-relaxed">
                        Address: {activeJob.delivery_address_snapshot.split(' | ')[2]}
                      </p>
                    </div>
                  </div>

                  <Button
                    fullWidth
                    onClick={() => confirmCompleteJob(activeJob.id)}
                    loading={actionLoading}
                    disabled={actionLoading}
                    className="flex items-center justify-center gap-2"
                  >
                    <HiCheck size={18} />
                    Confirm Package Delivered
                  </Button>
                </Card>
              ) : (
                <Card className="p-12 text-center border-dashed border-2 border-surface-250">
                  <HiOutlineTruck className="mx-auto text-surface-300 mb-4 animate-pulse" size={40} />
                  <p className="text-surface-500 font-medium mb-1">No active delivery jobs</p>
                  <p className="text-xs text-surface-400 mb-6">Go to the Find Jobs tab to take your first delivery job!</p>
                  <Button size="sm" onClick={() => setActiveTab('available')}>Browse Available Jobs</Button>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* AVAILABLE JOBS TAB */}
        {activeTab === 'available' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-surface-900 text-lg">Available Delivery Jobs</h3>
              <Button size="xs" variant="secondary" onClick={fetchAvailableJobs} loading={loadingAvailable}>
                Refresh Jobs
              </Button>
            </div>

            {loadingAvailable ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Spinner />
                <p className="text-xs text-surface-450 mt-2">Checking for new jobs...</p>
              </div>
            ) : availableJobs.length === 0 ? (
              <Card className="p-12 text-center border-dashed border-2 border-surface-250">
                <HiOutlineCheckCircle className="mx-auto text-surface-300 mb-4" size={40} />
                <p className="text-surface-500 font-medium mb-1">No jobs available right now</p>
                <p className="text-xs text-surface-400">Stores will list delivery jobs once packages are ready.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableJobs.map((job) => (
                  <Card key={job.id} className="p-6 hover:shadow-card-hover transition-all flex flex-col justify-between border border-surface-200">
                    <div>
                      <div className="flex justify-between items-start gap-4 pb-3 border-b border-surface-100 mb-4">
                        <div>
                          <p className="font-bold text-surface-950 text-sm">{job.order_number}</p>
                          <p className="text-xs text-surface-400 font-medium">{formatDate(job.created_at)}</p>
                        </div>
                        {getDeliveryMethodBadge(job.delivery_method)}
                      </div>

                      <div className="space-y-3 mb-6">
                        <div>
                          <p className="text-xs uppercase font-bold text-surface-400">Pickup Merchant</p>
                          <p className="text-xs font-semibold text-surface-800">{job.store_name}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase font-bold text-surface-400">Destination Address</p>
                          <p className="text-xs text-surface-600 truncate">{job.delivery_address_snapshot.split(' | ')[2]}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-surface-100 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase font-bold text-surface-400">Your Earning</p>
                        <p className="text-sm font-extrabold text-emerald-600">{formatCurrency(job.delivery_fee * 0.80)}</p>
                      </div>
                      <Button size="sm" onClick={() => openJobDetail(job)}>
                        View Details
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <h3 className="font-bold text-surface-900 text-lg">Delivered Jobs Log</h3>
            {history.length === 0 ? (
              <Card className="p-12 text-center border-dashed border-2 border-surface-250">
                <HiOutlineClipboardDocumentCheck className="mx-auto text-surface-300 mb-4" size={40} />
                <p className="text-surface-500 font-medium mb-1">No completed deliveries yet</p>
                <p className="text-xs text-surface-400">Your completed jobs and earnings ledger will show up here.</p>
              </Card>
            ) : (
              <Card className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-surface-50 border-b border-surface-200 text-surface-500 font-semibold uppercase tracking-wider text-xs">
                      <tr>
                        <th className="px-6 py-3.5">Order Number</th>
                        <th className="px-6 py-3.5">Delivered Date</th>
                        <th className="px-6 py-3.5">Store</th>
                        <th className="px-6 py-3.5">Recipient</th>
                        <th className="px-6 py-3.5 text-right">Earning</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-150 text-surface-700">
                      {history.map((job) => (
                        <tr key={job.id} className="hover:bg-surface-50/40">
                          <td className="px-6 py-4 font-bold text-surface-900">{job.order_number}</td>
                          <td className="px-6 py-4 text-xs text-surface-400">{formatDate(job.delivered_at)}</td>
                          <td className="px-6 py-4 font-semibold text-surface-800">{job.store_name}</td>
                          <td className="px-6 py-4">
                            <p className="text-xs font-semibold text-surface-800">{job.delivery_address_snapshot.split(' | ')[0]}</p>
                            <p className="text-xs text-surface-400">{job.delivery_address_snapshot.split(' | ')[1]}</p>
                          </td>
                          <td className="px-6 py-4 text-right font-extrabold text-emerald-600">
                            +{formatCurrency(parseFloat(job.earning))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* JOB DETAILS MODAL */}
      <Modal isOpen={jobDetailOpen} onClose={() => setJobDetailOpen(false)} title="Delivery Job Details">
        {selectedJob && (
          <div className="space-y-6 pt-2">
            <div className="flex justify-between items-start border-b border-surface-200 pb-4">
              <div>
                <h4 className="font-bold text-lg text-surface-900">{selectedJob.order_number}</h4>
                <p className="text-xs text-surface-400">Created: {formatDate(selectedJob.created_at)}</p>
              </div>
              {getDeliveryMethodBadge(selectedJob.delivery_method)}
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-surface-50 border border-surface-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-surface-400 font-bold uppercase tracking-wider">Total Delivery Fee</p>
                  <p className="text-xs font-semibold text-surface-700">{formatCurrency(selectedJob.delivery_fee)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Driver Payout (80%)</p>
                  <p className="text-base font-extrabold text-emerald-600">{formatCurrency(selectedJob.delivery_fee * 0.80)}</p>
                </div>
              </div>

              <div>
                <h5 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Merchant Details</h5>
                <Card className="p-3.5 bg-surface-50/50">
                  <p className="text-sm font-bold text-surface-900 mb-0.5">{selectedJob.store_name}</p>
                  <p className="text-xs text-surface-500">Pick up package from store merchant counter.</p>
                </Card>
              </div>

              <div>
                <h5 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Delivery Destination</h5>
                <Card className="p-3.5 bg-surface-50/50 space-y-1">
                  <p className="text-xs text-surface-500 font-bold">
                    Recipient: <span className="text-surface-800">{selectedJob.delivery_address_snapshot.split(' | ')[0]}</span>
                  </p>
                  <p className="text-xs text-surface-500 font-bold">
                    Phone: <span className="text-surface-800">{selectedJob.delivery_address_snapshot.split(' | ')[1]}</span>
                  </p>
                  <p className="text-xs text-surface-650 leading-relaxed pt-1">
                    Address: {selectedJob.delivery_address_snapshot.split(' | ')[2]}
                  </p>
                </Card>
              </div>
            </div>

            <div className="flex gap-3 border-t border-surface-200 pt-4">
              <Button variant="secondary" onClick={() => setJobDetailOpen(false)} disabled={actionLoading} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() => handleTakeJob(selectedJob.id)}
                loading={actionLoading}
                disabled={actionLoading}
                className="flex-1 flex items-center justify-center gap-1.5"
              >
                Accept Delivery Job
              </Button>
            </div>
          </div>
        )}
      </Modal>
      {/* CONFIRM COMPLETE JOB MODAL */}
      <Modal isOpen={confirmCompleteOpen} onClose={() => setConfirmCompleteOpen(false)} title="Confirm Delivery Completion">
        <p className="text-sm text-surface-600 mb-6">Are you sure you have successfully delivered this package to the recipient?</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmCompleteOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => handleCompleteJob(pendingCompleteId)}>Yes, Package Delivered</Button>
        </div>
      </Modal>
    </main>
  );
}
