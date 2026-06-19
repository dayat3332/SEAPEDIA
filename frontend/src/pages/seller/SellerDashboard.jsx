import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, Badge, Button, Input, Modal, Spinner } from '../../components/ui';
import { storeService, productService, orderService } from '../../services';
import { ROLE_CONFIG, formatCurrency, formatDate, getImageUrl } from '../../utils/helpers';
import { 
  HiOutlineBuildingStorefront, 
  HiOutlineCube, 
  HiOutlineBanknotes,
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineClipboardDocumentList,
  HiOutlineClock,
  HiOutlineTruck,
  HiCheck,
  HiOutlinePrinter
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

export default function SellerDashboard() {
  const { user } = useAuth();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('products');
  const [loading, setLoading] = useState(true);

  // Store Form State
  const [storeFormOpen, setStoreFormOpen] = useState(false);
  const [isEditStore, setIsEditStore] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [storeDesc, setStoreDesc] = useState('');
  const [storeLogo, setStoreLogo] = useState('');
  const [submittingStore, setSubmittingStore] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Product Modal State
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productName, setProductName] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productStock, setProductStock] = useState('');
  const [productImage, setProductImage] = useState('');
  const [productImageFile, setProductImageFile] = useState(null);
  const [productActive, setProductActive] = useState(true);
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(false);

  // Order Details Modal State
  const [orderDetailOpen, setOrderDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);
  const [processingOrder, setProcessingOrder] = useState(false);

  useEffect(() => {
    fetchStoreAndProducts();
  }, []);

  const fetchStoreAndProducts = async () => {
    try {
      setLoading(true);
      const storeRes = await storeService.getMyStore();
      const currentStore = storeRes.data.data;
      setStore(currentStore);

      if (currentStore) {
        const [prodRes, ordersRes] = await Promise.all([
          productService.getSellerProducts(),
          orderService.getSellerOrders(),
        ]);
        setProducts(prodRes.data.data);
        setOrders(ordersRes.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const handleStoreSubmit = async (e) => {
    e.preventDefault();
    if (!storeName.trim() || storeName.trim().length < 3) {
      return toast.error('Store name must be at least 3 characters.');
    }

    try {
      setSubmittingStore(true);
      const payload = {
        storeName: storeName.trim(),
        description: storeDesc.trim(),
        imageUrl: storeLogo.trim() || null
      };

      if (isEditStore) {
        const res = await storeService.updateStore(payload);
        setStore(res.data.data);
        toast.success('Store updated successfully.');
      } else {
        const res = await storeService.createStore(payload);
        setStore(res.data.data);
        toast.success('Store created successfully! You can now add products.');
      }
      setStoreFormOpen(false);
      fetchStoreAndProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save store profile.');
    } finally {
      setSubmittingStore(false);
    }
  };

  const openStoreForm = () => {
    if (store) {
      setIsEditStore(true);
      setStoreName(store.store_name);
      setStoreDesc(store.description || '');
      setStoreLogo(store.image_url || '');
    } else {
      setIsEditStore(false);
      setStoreName('');
      setStoreDesc('');
      setStoreLogo('');
    }
    setStoreFormOpen(true);
  };

  const handleStoreLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size cannot exceed 5MB.');
      return;
    }

    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append('image', file);

      const res = await productService.uploadProductImage(formData);
      setStoreLogo(res.data.imageUrl);
      toast.success('Logo uploaded successfully.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const openProductModal = (product = null) => {
    setProductImageFile(null);
    if (product) {
      setSelectedProduct(product);
      setProductName(product.name);
      setProductDesc(product.description || '');
      setProductPrice(product.price);
      setProductStock(product.stock);
      setProductImage(product.image_url || '');
      setProductActive(!!product.is_active);
    } else {
      setSelectedProduct(null);
      setProductName('');
      setProductDesc('');
      setProductPrice('');
      setProductStock('');
      setProductImage('');
      setProductActive(true);
    }
    setProductModalOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size cannot exceed 5MB.');
      return;
    }

    setProductImageFile(file);
    setProductImage(URL.createObjectURL(file));
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!productName.trim() || productName.trim().length < 3) {
      return toast.error('Product name must be at least 3 characters.');
    }
    if (!productPrice || parseFloat(productPrice) <= 0) {
      return toast.error('Price must be a positive number.');
    }
    if (productStock === '' || parseInt(productStock, 10) < 0) {
      return toast.error('Stock must be 0 or more.');
    }

    try {
      setSubmittingProduct(true);
      const formData = new FormData();
      formData.append('name', productName.trim());
      formData.append('description', productDesc.trim());
      formData.append('price', parseFloat(productPrice));
      formData.append('stock', parseInt(productStock, 10));
      formData.append('isActive', productActive);
      
      if (productImageFile) {
        formData.append('image', productImageFile);
      } else {
        formData.append('imageUrl', productImage || '');
      }

      if (selectedProduct) {
        await productService.updateProduct(selectedProduct.id, formData);
        toast.success('Product updated successfully.');
      } else {
        await productService.createProduct(formData);
        toast.success('Product added successfully.');
      }
      setProductModalOpen(false);
      fetchStoreAndProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product.');
    } finally {
      setSubmittingProduct(false);
    }
  };

  const openDeleteModal = (product) => {
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      setDeletingProduct(true);
      await productService.deleteProduct(productToDelete.id);
      toast.success('Product deleted successfully.');
      setDeleteModalOpen(false);
      fetchStoreAndProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete product.');
    } finally {
      setDeletingProduct(false);
    }
  };

  const viewOrderDetails = async (orderId) => {
    try {
      setLoadingOrderDetails(true);
      setOrderDetailOpen(true);
      const res = await orderService.getOrderById(orderId);
      setSelectedOrder(res.data.data);
    } catch (err) {
      toast.error('Failed to load order details.');
      setOrderDetailOpen(false);
    } finally {
      setLoadingOrderDetails(false);
    }
  };

  const handlePrintReceipt = (order) => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      toast.error('Pop-up blocker is enabled. Please allow pop-ups to print.');
      return;
    }

    const itemsRows = order.items.map((item, idx) => `
      <tr>
        <td style="border-bottom: 1px solid #e2e8f0; padding: 10px 0; font-size: 13px;">${idx + 1}</td>
        <td style="border-bottom: 1px solid #e2e8f0; padding: 10px 0; font-size: 13px;">
          <strong style="color: #1e293b;">${item.product_name}</strong>
        </td>
        <td style="border-bottom: 1px solid #e2e8f0; padding: 10px 0; font-size: 13px; text-align: center;">${item.quantity}</td>
        <td style="border-bottom: 1px solid #e2e8f0; padding: 10px 0; font-size: 13px; text-align: right;">${formatCurrency(item.product_price)}</td>
        <td style="border-bottom: 1px solid #e2e8f0; padding: 10px 0; font-size: 13px; text-align: right; font-weight: bold;">${formatCurrency(item.subtotal)}</td>
      </tr>
    `).join('');

    const discountRow = parseFloat(order.discount_amount) > 0 ? `
      <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px; color: #dc2626;">
        <span>Discount:</span>
        <span>-${formatCurrency(order.discount_amount)}</span>
      </div>
    ` : '';

    const addressParts = order.delivery_address_snapshot ? order.delivery_address_snapshot.split(' | ') : [];
    const recipientName = addressParts[0] || '-';
    const recipientPhone = addressParts[1] || '-';
    const recipientAddress = addressParts[2] || '-';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Resi Pengiriman - ${order.order_number}</title>
          <meta charset="utf-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              color: #334155;
              background-color: #ffffff;
              padding: 20px;
              margin: 0;
            }
            .label-card {
              border: 2px dashed #cbd5e1;
              border-radius: 12px;
              padding: 24px;
              max-width: 650px;
              margin: 0 auto;
              background-color: #fff;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #334155;
              padding-bottom: 16px;
              margin-bottom: 20px;
            }
            .logo {
              font-size: 22px;
              font-weight: 800;
              color: #0284c7;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .title {
              font-size: 14px;
              font-weight: 700;
              color: #475569;
              background-color: #f1f5f9;
              padding: 6px 12px;
              border-radius: 6px;
              text-transform: uppercase;
            }
            .meta-grid {
              display: grid;
              grid-template-cols: 1fr 1fr;
              gap: 16px;
              margin-bottom: 24px;
              background-color: #f8fafc;
              padding: 16px;
              border-radius: 8px;
            }
            .meta-item label {
              display: block;
              font-size: 11px;
              text-transform: uppercase;
              font-weight: 600;
              color: #64748b;
              margin-bottom: 4px;
            }
            .meta-item span {
              font-size: 14px;
              font-weight: 700;
              color: #1e293b;
            }
            .address-box {
              display: grid;
              grid-template-cols: 1fr 1fr;
              gap: 16px;
              margin-bottom: 24px;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 20px;
            }
            .address-title {
              font-size: 12px;
              font-weight: 700;
              text-transform: uppercase;
              color: #64748b;
              margin-bottom: 8px;
            }
            .address-content {
              font-size: 13px;
              line-height: 1.5;
              color: #334155;
            }
            .barcode-placeholder {
              text-align: center;
              margin: 20px 0;
              padding: 12px;
              background-color: #f1f5f9;
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              font-family: monospace;
              font-size: 14px;
              letter-spacing: 4px;
              font-weight: bold;
              color: #1e293b;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .summary-box {
              width: 250px;
              margin-left: auto;
              border-top: 2px solid #e2e8f0;
              padding-top: 12px;
            }
            .print-btn {
              display: block;
              width: 100%;
              text-align: center;
              background-color: #0284c7;
              color: white;
              padding: 12px;
              border-radius: 8px;
              font-weight: 700;
              font-size: 14px;
              cursor: pointer;
              margin-top: 30px;
              border: none;
              text-transform: uppercase;
              box-shadow: 0 4px 6px -1px rgba(2, 132, 199, 0.2);
            }
            .print-btn:hover {
              background-color: #0369a1;
            }
            @media print {
              body {
                padding: 0;
                background-color: #fff;
              }
              .label-card {
                border: 2px solid #1e293b;
                border-radius: 0;
                padding: 15px;
                max-width: 100%;
              }
              .print-btn {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="label-card">
            <div class="header">
              <div class="logo">SEAPEDIA</div>
              <div class="title">RESI PENGIRIMAN (SHIPPING LABEL)</div>
            </div>

            <div class="barcode-placeholder">
              ||||| | |||| ||||| ||| |||| | || ${order.order_number}
            </div>

            <div class="meta-grid">
              <div class="meta-item">
                <label>Nomor Pesanan</label>
                <span>${order.order_number}</span>
              </div>
              <div class="meta-item">
                <label>Metode Pengiriman</label>
                <span style="text-transform: uppercase; color: #0284c7;">${order.delivery_method}</span>
              </div>
              <div class="meta-item" style="grid-column: span 2;">
                <label>Tanggal Transaksi</label>
                <span>${formatDate(order.created_at)}</span>
              </div>
            </div>

            <div class="address-box">
              <div>
                <div class="address-title">PENGIRIM (FROM)</div>
                <div class="address-content">
                  <strong style="color: #1e293b;">${order.store_name}</strong><br>
                  Toko Seller SEAPEDIA
                </div>
              </div>
              <div>
                <div class="address-title">PENERIMA (TO)</div>
                <div class="address-content">
                  <strong style="color: #1e293b;">${recipientName}</strong><br>
                  Hub: ${recipientPhone}<br>
                  ${recipientAddress}
                </div>
              </div>
            </div>

            <h4 style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 12px;">Daftar Barang</h4>
            <table class="items-table">
              <thead>
                <tr style="border-bottom: 2px solid #cbd5e1; text-align: left; font-size: 11px; text-transform: uppercase; color: #64748b;">
                  <th style="padding-bottom: 8px; width: 30px;">No</th>
                  <th style="padding-bottom: 8px;">Nama Barang</th>
                  <th style="padding-bottom: 8px; text-align: center; width: 50px;">Qty</th>
                  <th style="padding-bottom: 8px; text-align: right; width: 100px;">Harga</th>
                  <th style="padding-bottom: 8px; text-align: right; width: 100px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
              </tbody>
            </table>

            <div class="summary-box">
              <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px;">
                <span>Subtotal:</span>
                <span>${formatCurrency(order.subtotal)}</span>
              </div>
              ${discountRow}
              <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px;">
                <span>Ongkos Kirim:</span>
                <span>${formatCurrency(order.delivery_fee)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px;">
                <span>PPN (12%):</span>
                <span>${formatCurrency(order.tax_amount)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 800; color: #1e293b; margin-top: 10px; border-top: 1px solid #e2e8f0; padding-top: 8px;">
                <span>Total Bayar:</span>
                <span>${formatCurrency(order.total)}</span>
              </div>
            </div>

            <div style="text-align: center; font-size: 11px; color: #94a3b8; margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 15px;">
              Terima kasih telah berbelanja di SEAPEDIA. Simpan resi ini sebagai bukti pengiriman yang sah.
            </div>

            <button class="print-btn" onclick="window.print()">Cetak Resi & Simpan PDF</button>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePackOrder = async (orderId) => {
    try {
      setProcessingOrder(true);
      await orderService.updateOrderStatus(orderId, 'menunggu_pengirim', 'Seller has packed the items. Order is ready for pickup.');
      toast.success('Order status updated. Ready for driver pickup!');
      setOrderDetailOpen(false);
      // Refresh order listing
      const ordersRes = await orderService.getSellerOrders();
      setOrders(ordersRes.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order status.');
    } finally {
      setProcessingOrder(false);
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'sedang_dikemas':
        return 'warning';
      case 'menunggu_pengirim':
        return 'primary';
      case 'sedang_dikirim':
        return 'info';
      case 'pesanan_selesai':
        return 'success';
      case 'dikembalikan':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'sedang_dikemas':
        return 'Sedang Dikemas';
      case 'menunggu_pengirim':
        return 'Menunggu Pengirim';
      case 'sedang_dikirim':
        return 'Sedang Kirim';
      case 'pesanan_selesai':
        return 'Selesai';
      case 'dikembalikan':
        return 'Dikembalikan';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Spinner size="lg" />
        <p className="text-surface-500 mt-4">Loading store dashboard...</p>
      </div>
    );
  }

  // Calculate earnings from completed orders
  const totalEarnings = orders
    .filter((o) => o.status === 'pesanan_selesai')
    .reduce((sum, o) => sum + parseFloat(o.total), 0);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-surface-900">Seller Dashboard</h1>
            <Badge variant="seller" className="flex items-center gap-1">
              {ROLE_CONFIG.seller.IconComponent ? <ROLE_CONFIG.seller.IconComponent size={14} /> : ROLE_CONFIG.seller.icon}
              <span>Seller</span>
            </Badge>
          </div>
          <p className="text-surface-500">Welcome back, {user?.full_name}. Manage your store and products here.</p>
        </div>
        {store && (
          <Button variant="secondary" onClick={openStoreForm} className="flex items-center gap-2">
            <HiOutlinePencilSquare size={18} />
            Edit Store Profile
          </Button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <HiOutlineBuildingStorefront size={24} />
            </div>
            <div>
              <p className="text-sm text-surface-500 font-medium">Store</p>
              <p className="text-lg font-bold text-surface-950">
                {store ? store.store_name : 'Setup Required'}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
              <HiOutlineCube size={24} />
            </div>
            <div>
              <p className="text-sm text-surface-500 font-medium">Products</p>
              <p className="text-lg font-bold text-surface-950">
                {store ? products.length : '—'}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <HiOutlineBanknotes size={24} />
            </div>
            <div>
              <p className="text-sm text-surface-500 font-medium">Store Revenue</p>
              <p className="text-lg font-bold text-emerald-700">
                {formatCurrency(totalEarnings)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {!store ? (
        <Card className="p-10 text-center max-w-2xl mx-auto border-dashed border-2 border-surface-300">
          <HiOutlineBuildingStorefront className="mx-auto text-amber-500 mb-4" size={48} />
          <h3 className="text-xl font-bold text-surface-900 mb-2">Create Your Store Profile</h3>
          <p className="text-sm text-surface-500 mb-6 leading-relaxed">
            Before listing products and selling them on SEAPEDIA, you must define your store identity. Store names must be unique.
          </p>
          <Button onClick={openStoreForm} size="lg" className="w-full sm:w-auto">
            Set Up Store Now
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Store Profile Info */}
          <Card className="p-6 bg-surface-50 border border-surface-200">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className="w-20 h-20 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-3xl overflow-hidden shadow-inner flex-shrink-0">
                {store.image_url ? (
                  <img
                    src={getImageUrl(store.image_url)}
                    alt={store.store_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1472851294608-062f824d296e?w=200';
                    }}
                  />
                ) : (
                  store.store_name.substring(0, 2).toUpperCase()
                )}
              </div>
              <div className="text-center sm:text-left flex-grow">
                <h2 className="text-xl font-bold text-surface-950 mb-1">{store.store_name}</h2>
                <p className="text-sm text-surface-600 mb-2">{store.description || 'No description provided.'}</p>
                <Badge variant="success">Active Store</Badge>
              </div>
            </div>
          </Card>

          {/* Tabs header */}
          <div className="flex border-b border-surface-200 gap-2 mb-6">
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all cursor-pointer ${
                activeTab === 'products'
                  ? 'border-primary-600 text-primary-700 bg-primary-50/30'
                  : 'border-transparent text-surface-500 hover:text-surface-800'
              }`}
            >
              <HiOutlineCube size={18} />
              Products Catalog
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'border-primary-600 text-primary-700 bg-primary-50/30'
                  : 'border-transparent text-surface-500 hover:text-surface-800'
              }`}
            >
              <HiOutlineClipboardDocumentList size={18} />
              Incoming Orders
              {orders.filter(o => o.status === 'sedang_dikemas').length > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold">
                  {orders.filter(o => o.status === 'sedang_dikemas').length}
                </span>
              )}
            </button>
          </div>

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-surface-900">Products Catalog ({products.length})</h2>
                <Button onClick={() => openProductModal()} className="flex items-center gap-2" size="sm">
                  <HiOutlinePlus size={18} />
                  Add New Product
                </Button>
              </div>

              {products.length === 0 ? (
                <Card className="p-12 text-center border-dashed border-2 border-surface-250">
                  <HiOutlineCube className="mx-auto text-surface-350 mb-4" size={40} />
                  <p className="text-surface-500 font-medium mb-1">No products in your catalog yet</p>
                  <p className="text-xs text-surface-400 mb-4">Start selling by adding your first product to SEAPEDIA.</p>
                  <Button onClick={() => openProductModal()} size="sm" variant="secondary">
                    Add Product
                  </Button>
                </Card>
              ) : (
                <Card className="overflow-hidden border border-surface-200 shadow-sm animate-fade-in">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-surface-200 text-left text-sm">
                      <thead className="bg-surface-50 text-surface-600 font-semibold uppercase tracking-wider text-xs">
                        <tr>
                          <th className="px-6 py-4">Product Info</th>
                          <th className="px-6 py-4">Price</th>
                          <th className="px-6 py-4">Stock</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-200 text-surface-900 bg-white">
                        {products.map((p) => (
                          <tr key={p.id} className="hover:bg-surface-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-surface-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                  {p.image_url ? (
                                    <img
                                      src={getImageUrl(p.image_url)}
                                      alt={p.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400';
                                      }}
                                    />
                                  ) : (
                                    <HiOutlineCube className="text-surface-400" size={24} />
                                  )}
                                </div>
                                <div>
                                  <p className="font-semibold text-surface-950">{p.name}</p>
                                  <p className="text-xs text-surface-400 max-w-[200px] truncate">{p.description}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-medium">{formatCurrency(p.price)}</td>
                            <td className="px-6 py-4 font-semibold text-surface-700">{p.stock} pcs</td>
                            <td className="px-6 py-4">
                              {p.is_active ? (
                                <Badge variant="success" className="flex items-center gap-1 w-fit">
                                  <HiOutlineEye size={12} /> Active
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                                  <HiOutlineEyeSlash size={12} /> Inactive
                                </Badge>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                              <Button variant="ghost" size="sm" onClick={() => openProductModal(p)} className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg">
                                <HiOutlinePencilSquare size={18} />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => openDeleteModal(p)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                <HiOutlineTrash size={18} />
                              </Button>
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

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-surface-900">Incoming Orders ({orders.length})</h2>

              {orders.length === 0 ? (
                <Card className="p-12 text-center border-dashed border-2 border-surface-250">
                  <HiOutlineClipboardDocumentList className="mx-auto text-surface-350 mb-4" size={40} />
                  <p className="text-surface-500 font-medium mb-1">No incoming orders yet</p>
                  <p className="text-xs text-surface-400">Orders placed by customers for your store will appear here.</p>
                </Card>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  {orders.map((order) => (
                    <Card key={order.id} className="p-5 hover:shadow-card-hover border border-surface-150 transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-surface-100 mb-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-surface-950 text-sm sm:text-base">{order.order_number}</span>
                            <span className="text-xs text-surface-400">{formatDate(order.created_at)}</span>
                          </div>
                          <p className="text-xs text-surface-500 mt-1">Customer: <strong className="text-surface-700">{order.buyer_name}</strong></p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={getStatusBadgeVariant(order.status)}>
                            {getStatusLabel(order.status)}
                          </Badge>
                          <button
                            onClick={() => viewOrderDetails(order.id)}
                            className="inline-flex items-center justify-center px-3 py-1 text-xs font-semibold rounded-lg border border-primary-200 bg-primary-50/50 text-primary-700 hover:bg-primary-50 hover:text-primary-800 hover:border-primary-300 active:bg-primary-100 transition-all duration-200 cursor-pointer"
                          >
                            Review Order
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-surface-500">
                        <div>
                          <p className="mb-0.5">Shipping Method: <strong className="text-surface-700 capitalize">{order.delivery_method}</strong></p>
                          <p className="truncate max-w-sm sm:max-w-md">Address Snapshot: <span className="text-surface-600">{order.delivery_address_snapshot.split('|')[2]}</span></p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-surface-400 font-medium">Customer Payment</p>
                          <p className="text-sm font-extrabold text-primary-700">{formatCurrency(order.total)}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Store Setup / Edit Modal */}
      <Modal isOpen={storeFormOpen} onClose={() => setStoreFormOpen(false)} title={isEditStore ? 'Edit Store Profile' : 'Set Up Your Store'}>
        <form onSubmit={handleStoreSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-surface-600 uppercase mb-1">Store Name (Unique)</label>
            <Input 
              value={storeName} 
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="e.g. Toko Makmur Elektronik"
              required
              disabled={submittingStore}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-surface-600 uppercase mb-1">Description</label>
            <textarea
              value={storeDesc}
              onChange={(e) => setStoreDesc(e.target.value)}
              placeholder="Describe what you sell..."
              rows={3}
              className="w-full px-4 py-2 border border-surface-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              disabled={submittingStore}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-surface-600 uppercase mb-1">Logo / Banner (Optional)</label>
            <div className="mt-1 flex items-center gap-4">
              {storeLogo && (
                <div className="w-16 h-16 rounded-lg bg-surface-100 overflow-hidden flex-shrink-0 flex items-center justify-center border border-surface-200">
                  <img
                    src={getImageUrl(storeLogo)}
                    alt="Preview Logo"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1472851294608-062f824d296e?w=200';
                    }}
                  />
                </div>
              )}
              <div className="flex-grow">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleStoreLogoUpload}
                  disabled={submittingStore || uploadingLogo}
                  className="w-full text-sm text-surface-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 transition-colors file:cursor-pointer disabled:opacity-50"
                />
                {uploadingLogo && <p className="text-xs text-primary-600 mt-1 animate-pulse">Uploading logo, please wait...</p>}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-200">
            <Button variant="secondary" type="button" onClick={() => setStoreFormOpen(false)} disabled={submittingStore}>
              Cancel
            </Button>
            <Button type="submit" loading={submittingStore}>
              {isEditStore ? 'Save Changes' : 'Create Store'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Product Add / Edit Modal */}
      <Modal isOpen={productModalOpen} onClose={() => setProductModalOpen(false)} title={selectedProduct ? 'Edit Product Details' : 'Add New Product'}>
        <form onSubmit={handleProductSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-surface-600 uppercase mb-1">Product Name</label>
            <Input 
              value={productName} 
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Wireless Noise Canceling Earbuds"
              required
              disabled={submittingProduct}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-surface-600 uppercase mb-1">Description</label>
            <textarea
              value={productDesc}
              onChange={(e) => setProductDesc(e.target.value)}
              placeholder="Detail specifications, warranty, etc..."
              rows={3}
              className="w-full px-4 py-2 border border-surface-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              disabled={submittingProduct}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-surface-600 uppercase mb-1">Price (Rp)</label>
              <Input
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
                type="number"
                placeholder="e.g. 150000"
                required
                min="1"
                disabled={submittingProduct}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-600 uppercase mb-1">Stock</label>
              <Input
                value={productStock}
                onChange={(e) => setProductStock(e.target.value)}
                type="number"
                placeholder="e.g. 50"
                required
                min="0"
                disabled={submittingProduct}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-surface-600 uppercase mb-1">Product Image (Optional)</label>
            <div className="mt-1 flex items-center gap-4">
              {productImage && (
                <div className="w-16 h-16 rounded-lg bg-surface-100 overflow-hidden flex-shrink-0 flex items-center justify-center border border-surface-200">
                  <img
                    src={getImageUrl(productImage)}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400';
                    }}
                  />
                </div>
              )}
              <div className="flex-grow">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={submittingProduct || uploadingImage}
                  className="w-full text-sm text-surface-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 transition-colors file:cursor-pointer disabled:opacity-50"
                />
                {uploadingImage && <p className="text-xs text-primary-600 mt-1 animate-pulse">Uploading image, please wait...</p>}
              </div>
            </div>
          </div>
          {selectedProduct && (
            <div className="flex items-center gap-2 pt-2">
              <input
                id="product-active"
                type="checkbox"
                checked={productActive}
                onChange={(e) => setProductActive(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-surface-350 rounded focus:ring-primary-500 focus:outline-none"
                disabled={submittingProduct}
              />
              <label htmlFor="product-active" className="text-sm text-surface-700 select-none">
                Make this product visible in public catalog
              </label>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-200">
            <Button variant="secondary" type="button" onClick={() => setProductModalOpen(false)} disabled={submittingProduct}>
              Cancel
            </Button>
            <Button type="submit" loading={submittingProduct}>
              {selectedProduct ? 'Save Changes' : 'Add Product'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Product Confirmation Modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirm Product Deletion">
        <div className="pt-2">
          <p className="text-sm text-surface-600 leading-relaxed">
            Are you sure you want to permanently delete the product <strong className="text-surface-950">"{productToDelete?.name}"</strong>? This action is irreversible.
          </p>
          <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-surface-200">
            <Button variant="secondary" type="button" onClick={() => setDeleteModalOpen(false)} disabled={deletingProduct}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteProduct} loading={deletingProduct}>
              Delete Product
            </Button>
          </div>
        </div>
      </Modal>

      {/* ORDER DETAILS MODAL FOR SELLER */}
      <Modal isOpen={orderDetailOpen} onClose={() => setOrderDetailOpen(false)} title="Manage Incoming Order" size="lg">
        {loadingOrderDetails || !selectedOrder ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Spinner size="md" />
            <p className="text-surface-500 text-sm mt-3">Loading order info...</p>
          </div>
        ) : (
          <div className="space-y-6 pt-2 max-h-[80vh] overflow-y-auto pr-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-surface-200">
              <div>
                <p className="text-xs text-surface-400">Order Number</p>
                <p className="font-bold text-surface-900 text-base">{selectedOrder.order_number}</p>
                <p className="text-xs text-surface-400">Placed on {formatDate(selectedOrder.created_at)}</p>
              </div>
              <div>
                <Badge variant={getStatusBadgeVariant(selectedOrder.status)} className="text-sm">
                  {getStatusLabel(selectedOrder.status)}
                </Badge>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <HiOutlineClock size={16} /> Order Timeline Status
              </h4>
              <div className="space-y-4 pl-3 relative border-l border-surface-200 ml-2">
                {selectedOrder.statusHistory.map((hist, i) => (
                  <div key={hist.id} className="relative">
                    <div className={`absolute -left-[19px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${
                      i === selectedOrder.statusHistory.length - 1 ? 'bg-primary-600 scale-110' : 'bg-surface-300'
                    }`} />
                    <div>
                      <p className={`text-xs font-bold capitalize ${
                        i === selectedOrder.statusHistory.length - 1 ? 'text-primary-700' : 'text-surface-600'
                      }`}>
                        {getStatusLabel(hist.status)}
                      </p>
                      {hist.note && <p className="text-xs text-surface-500">{hist.note}</p>}
                      <p className="text-xs text-surface-400">{formatDate(hist.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Shipping Snapshot */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider flex items-center gap-1.5">
                <HiOutlineTruck size={16} /> Customer Destination Address
              </h4>
              <Card className="p-4 bg-surface-50">
                <p className="text-xs text-surface-500 font-semibold mb-1">
                  Recipient Name: <span className="text-surface-800 font-bold">{selectedOrder.delivery_address_snapshot.split(' | ')[0]}</span>
                </p>
                <p className="text-xs text-surface-500 font-semibold mb-0.5">
                  Phone Contact: <span className="text-surface-800 font-bold">{selectedOrder.delivery_address_snapshot.split(' | ')[1]}</span>
                </p>
                <p className="text-xs text-surface-500 font-semibold">
                  Address Details: <span className="text-surface-800 font-normal">{selectedOrder.delivery_address_snapshot.split(' | ')[2]}</span>
                </p>
              </Card>
            </div>

            {/* Order Items */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Order Content</h4>
              <div className="divide-y divide-surface-100">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 py-3">
                    <div className="w-12 h-12 rounded-lg bg-surface-100 overflow-hidden flex-shrink-0 flex items-center justify-center text-surface-400">
                      {item.image_url ? (
                        <img
                          src={getImageUrl(item.image_url)}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400';
                          }}
                        />
                      ) : (
                        <HiOutlineCube size={22} />
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-semibold text-surface-900 truncate">{item.product_name}</p>
                      <p className="text-xs text-surface-500">
                        {item.quantity} x {formatCurrency(item.product_price)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-surface-800">{formatCurrency(item.subtotal)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price breakdown */}
            <div className="pt-4 border-t border-surface-200 text-xs space-y-2">
              <div className="flex justify-between text-surface-500">
                <span>Subtotal</span>
                <span>{formatCurrency(selectedOrder.subtotal)}</span>
              </div>
              {parseFloat(selectedOrder.discount_amount) > 0 && (
                <div className="flex justify-between text-red-600 font-semibold">
                  <span>Discount</span>
                  <span>-{formatCurrency(selectedOrder.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-surface-500">
                <span>Delivery Fee ({selectedOrder.delivery_method})</span>
                <span>{formatCurrency(selectedOrder.delivery_fee)}</span>
              </div>
              <div className="flex justify-between text-surface-500">
                <span>PPN (12%)</span>
                <span>{formatCurrency(selectedOrder.tax_amount)}</span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-surface-200 flex flex-col sm:flex-row gap-3 justify-between items-center">
              <div>
                <p className="text-xs text-surface-400 font-medium">Customer Payment Total</p>
                <p className="text-base font-extrabold text-primary-700">{formatCurrency(selectedOrder.total)}</p>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full sm:w-auto justify-end">
                <Button variant="secondary" onClick={() => setOrderDetailOpen(false)} disabled={processingOrder} className="flex-1 sm:flex-none">
                  Close
                </Button>
                <button
                  onClick={() => handlePrintReceipt(selectedOrder)}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-xl border border-primary-200 bg-primary-50/50 text-primary-700 hover:bg-primary-50 hover:text-primary-800 hover:border-primary-300 transition-all duration-200 cursor-pointer"
                >
                  <HiOutlinePrinter size={18} />
                  Cetak Resi
                </button>
                {selectedOrder.status === 'sedang_dikemas' && (
                  <Button
                    onClick={() => handlePackOrder(selectedOrder.id)}
                    loading={processingOrder}
                    disabled={processingOrder}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-650 hover:to-primary-750"
                  >
                    <HiCheck size={18} />
                    Mark as Packaged
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </main>
  );
}
