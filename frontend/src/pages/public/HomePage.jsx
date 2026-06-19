import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineShoppingBag, HiOutlineTruck, HiOutlineBuildingStorefront, HiOutlineShieldCheck, HiArrowRight, HiStar, HiChevronLeft, HiChevronRight } from 'react-icons/hi2';
import { productService, reviewService } from '../../services';
import ProductCard from '../../components/shared/ProductCard';
import RatingStars from '../../components/shared/RatingStars';
import { Button, Input, Spinner, Modal } from '../../components/ui';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

// React Bits animation components
import { SplitText, BlurText, ScrollReveal, ScrollFloat, FadeContent } from '../../components/reactbits';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ averageRating: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const carouselRef = useRef(null);

  // Review form state
  const [reviewForm, setReviewForm] = useState({ reviewerName: '', rating: 0, comment: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prodRes, revRes] = await Promise.all([
        productService.getProducts({ limit: 8 }),
        reviewService.getReviews({ limit: 6 }),
      ]);
      setProducts(prodRes.data.data.products);
      setReviews(revRes.data.data.reviews);
      setReviewStats({
        averageRating: revRes.data.data.averageRating,
        total: revRes.data.data.pagination.total,
      });
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewForm.reviewerName || !reviewForm.rating || !reviewForm.comment) {
      toast.error('Please fill all fields and select a rating.');
      return;
    }
    setSubmitting(true);
    try {
      await reviewService.createReview(reviewForm);
      toast.success('Thank you for your review!');
      setReviewForm({ reviewerName: '', rating: 0, comment: '' });
      setIsReviewModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const scroll = (direction) => {
    if (carouselRef.current) {
      const { scrollLeft, clientWidth } = carouselRef.current;
      const scrollTo = direction === 'left' 
        ? scrollLeft - clientWidth / 2 
        : scrollLeft + clientWidth / 2;
      carouselRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const features = [
    { icon: HiOutlineShoppingBag, title: 'Easy Shopping', desc: 'Browse and buy products from verified stores with transparent pricing and real-time stock updates.' },
    { icon: HiOutlineBuildingStorefront, title: 'Store Management', desc: 'Open your own store, list products, track orders, and monitor your monthly sales performance.' },
    { icon: HiOutlineTruck, title: 'Integrated Shipping', desc: 'Real-time routing for drivers with choices between Instant, Next Day, and Regular shipping modes.' },
    { icon: HiOutlineShieldCheck, title: 'Secure Checkouts', desc: 'In-app wallet system with compliant tax calculations and transparent transactions for all parties.' },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 text-white">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 flex flex-col items-center justify-center text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6 tracking-tight flex flex-col items-center">
            <SplitText
              text="Integrated Multi-Role E-Commerce"
              delay={0.05}
              duration={0.6}
              ease="easeOut"
              splitBy="words"
              from={{ opacity: 0, y: 30, filter: 'blur(4px)' }}
              to={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              tag="span"
              className="block text-center w-full"
            />
            <span className="block mt-2">
              <FadeContent delay={0.3} duration={0.5} blur>
                <span className="text-primary-300">Marketplace Platform</span>
              </FadeContent>
            </span>
          </h1>

          <div className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            <BlurText
              text="SEAPEDIA bridges buyers, store owners, and delivery drivers in a single, unified marketplace system. Purchase items, manage stores, and fulfill deliveries seamlessly."
              delay={0.03}
              duration={0.4}
              animateBy="words"
            />
          </div>

          <FadeContent delay={0.6} duration={0.5} blur>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/products">
                <Button size="lg" className="px-8 shadow-sm">
                  Explore Products
                  <HiArrowRight size={18} />
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="outline" size="lg" className="!border-slate-700 !text-white hover:!bg-white/10 px-8">
                  Get Started
                </Button>
              </Link>
            </div>
          </FadeContent>
        </div>

      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <ScrollFloat className="text-center mb-14" threshold={0.3}>
          <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 mb-3 tracking-tight">Built for Everyone in the Ecosystem</h2>
          <p className="text-surface-500 max-w-xl mx-auto">A robust e-commerce suite featuring modular dashboard management.</p>
        </ScrollFloat>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {features.map((f, i) => (
            <ScrollReveal
              key={i}
              delay={i * 0.08}
              duration={0.5}
              origin="bottom"
              distance={40}
              blur
              threshold={0.1}
            >
              <div className="flex items-start gap-5 p-6 rounded-2xl border border-primary-100/50 bg-white/70 hover:bg-white hover:border-primary-300 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary-50/80 text-primary-600">
                  <f.icon size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-surface-900 mb-1.5 text-lg">{f.title}</h3>
                  <p className="text-sm text-surface-500 leading-relaxed font-medium">{f.desc}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-white py-20 border-t border-b border-surface-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollFloat className="flex items-end justify-between mb-10" threshold={0.3}>
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 tracking-tight">Featured Products</h2>
              <p className="text-surface-500 mt-2">Discover quality products listed by our verified store owners.</p>
            </div>
            <Link to="/products" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors px-4 py-2 rounded-lg hover:bg-primary-50">
              View All Catalog <HiArrowRight size={16} />
            </Link>
          </ScrollFloat>

          {loading ? (
            <Spinner className="py-20" />
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {products.map((product, idx) => (
                <ScrollReveal
                  key={product.id}
                  delay={idx * 0.05}
                  duration={0.4}
                  origin="bottom"
                  distance={20}
                  threshold={0.05}
                >
                  <ProductCard product={product} />
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <HiOutlineShoppingBag className="mx-auto text-surface-300 mb-4" size={48} />
              <p className="text-surface-500">No products available yet. Check back soon!</p>
            </div>
          )}

          <div className="sm:hidden text-center mt-8">
            <Link to="/products">
              <Button variant="outline" className="w-full">View All Products</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 overflow-hidden">
        <ScrollFloat className="text-center mb-12" threshold={0.3}>
          <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 mb-4 tracking-tight">User Feedback</h2>
          <div className="flex items-center justify-center gap-3">
            <RatingStars rating={Math.round(reviewStats.averageRating)} size={18} />
            <span className="text-sm text-surface-500">
              {reviewStats.averageRating} / 5 rating from {reviewStats.total} reviews
            </span>
          </div>
        </ScrollFloat>

        <div className="relative group max-w-7xl mx-auto px-4">
          {/* Left Navigation Button */}
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 p-2.5 rounded-full bg-white shadow-md text-surface-600 hover:text-primary-600 hover:shadow-lg transition-all duration-200 cursor-pointer hidden md:flex items-center justify-center border border-surface-150"
            aria-label="Scroll Left"
          >
            <HiChevronLeft size={20} />
          </button>

          {/* Carousel Viewport */}
          <div
            ref={carouselRef}
            className="overflow-x-auto flex gap-6 pb-6 pt-2 px-2 scroll-smooth scrollbar-none snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {reviews.length > 0 ? (
              reviews.map((review, idx) => (
                <div
                  key={review.id}
                  className="flex-shrink-0 w-full sm:w-[calc((100%-24px)/2)] lg:w-[calc((100%-48px)/3)] snap-start"
                >
                  <ScrollReveal
                    delay={idx * 0.05}
                    duration={0.4}
                    origin="bottom"
                    distance={20}
                    threshold={0.05}
                  >
                    <div className="p-6 rounded-2xl bg-white border border-surface-100 hover:border-surface-200 hover:shadow-sm transition-all duration-200 h-full flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                              {review.reviewer_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-surface-900 text-sm">{review.reviewer_name}</p>
                              <p className="text-xs text-surface-400 font-medium">{formatDate(review.created_at)}</p>
                            </div>
                          </div>
                          <RatingStars rating={review.rating} size={14} />
                        </div>
                        <p className="text-sm text-surface-600 leading-relaxed italic">"{review.comment}"</p>
                      </div>
                    </div>
                  </ScrollReveal>
                </div>
              ))
            ) : (
              <div className="w-full text-center py-16 px-4 bg-gradient-to-br from-primary-50/20 via-white to-indigo-50/20 rounded-2xl border border-primary-100/40 shadow-sm flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center text-primary-500 mb-4 animate-pulse">
                  <HiStar size={26} />
                </div>
                <h4 className="text-lg font-bold text-surface-900 mb-1">No reviews yet</h4>
                <p className="text-sm text-surface-500 max-w-sm">Be the first to share your experience using SEAPEDIA with the community!</p>
              </div>
            )}
          </div>

          {/* Right Navigation Button */}
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 p-2.5 rounded-full bg-white shadow-md text-surface-600 hover:text-primary-600 hover:shadow-lg transition-all duration-200 cursor-pointer hidden md:flex items-center justify-center border border-surface-150"
            aria-label="Scroll Right"
          >
            <HiChevronRight size={20} />
          </button>
        </div>

        {/* Action Button & Modal trigger */}
        <div className="text-center mt-10">
          <ScrollReveal
            delay={0.1}
            duration={0.4}
            origin="bottom"
            distance={20}
            threshold={0.05}
          >
            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 shadow-md hover:shadow-lg hover:shadow-primary-600/10 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 hover:-translate-y-0.5 active:bg-primary-800 transition-all duration-300 cursor-pointer"
            >
              Write a Review
            </button>
          </ScrollReveal>
        </div>
      </section>

      {/* WRITE REVIEW MODAL */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Share Your Experience"
      >
        <p className="text-sm text-surface-500 mb-6 leading-relaxed">
          We value your feedback! Tell us about your experience using SEAPEDIA.
        </p>
        <form onSubmit={handleReviewSubmit} className="space-y-5">
          <Input
            label="Your Name"
            placeholder="Enter your name"
            value={reviewForm.reviewerName}
            onChange={(e) => setReviewForm({ ...reviewForm, reviewerName: e.target.value })}
            required
            disabled={submitting}
          />
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Rating</label>
            <RatingStars
              rating={reviewForm.rating}
              size={32}
              interactive
              onChange={(r) => setReviewForm({ ...reviewForm, rating: r })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Comment</label>
            <textarea
              className="w-full rounded-xl border border-surface-200 bg-white px-4 py-3 text-sm text-surface-800 placeholder:text-surface-400 transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none hover:border-surface-300 min-h-[120px] resize-none"
              placeholder="Tell us about your experience..."
              value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              required
              disabled={submitting}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setIsReviewModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting}
              disabled={submitting}
              className="hover:shadow-lg hover:shadow-primary-600/10 hover:-translate-y-0.5 transition-all duration-300"
            >
              Submit Review
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
