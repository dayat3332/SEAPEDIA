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
import { SplitText, BlurText, GradientText, ScrollReveal, ScrollFloat, FadeContent } from '../../components/reactbits';

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
    { icon: HiOutlineShoppingBag, title: 'Easy Shopping', desc: 'Browse thousands of products from verified sellers across the marketplace.' },
    { icon: HiOutlineBuildingStorefront, title: 'Sell With Confidence', desc: 'Open your own store, manage products, and track your income effortlessly.' },
    { icon: HiOutlineTruck, title: 'Fast Delivery', desc: 'Choose from Instant, Next Day, or Regular shipping to fit your schedule.' },
    { icon: HiOutlineShieldCheck, title: 'Secure Transactions', desc: 'Wallet-based checkout with PPN-compliant tax calculation and order tracking.' },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-surface-900 via-primary-900 to-surface-900">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-30" />
          <div className="absolute top-20 -left-20 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-600/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 flex flex-col items-center justify-center text-center">
          {/* Animated Hero Title with SplitText */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] mb-6 tracking-tight flex flex-col items-center">
            <SplitText
              text="Shop. Sell. Deliver."
              delay={0.08}
              duration={0.7}
              ease="easeOut"
              splitBy="words"
              from={{ opacity: 0, y: 50, filter: 'blur(6px)' }}
              to={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              tag="span"
              className="block"
            />
            {/* Animated Gradient Accent Line */}
            <span className="block mt-2">
              <FadeContent delay={0.4} duration={0.6} blur>
                <GradientText
                  colors={['#a5b4fc', '#e0e7ff', '#c4b5fd', '#e879f9', '#a5b4fc']}
                  animationSpeed={5}
                  className="text-4xl sm:text-5xl lg:text-6xl font-extrabold"
                >
                  All in One Page.
                </GradientText>
              </FadeContent>
            </span>
          </h1>

          {/* Animated Subtitle with BlurText */}
          <div className="text-lg text-surface-300 mb-10 max-w-xl mx-auto leading-relaxed">
            <BlurText
              text="SEAPEDIA connects buyers, sellers, and drivers in a seamless multi-role marketplace experience. Start your journey today."
              delay={0.04}
              duration={0.5}
              animateBy="words"
            />
          </div>

          {/* CTA Buttons with FadeContent */}
          <FadeContent delay={0.8} duration={0.6} blur>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/products">
                <Button size="lg">
                  Explore Products
                  <HiArrowRight size={18} />
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="outline" size="lg" className="!border-white/30 !text-white hover:!bg-white/10">
                  Create Account
                </Button>
              </Link>
            </div>
          </FadeContent>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-[1px]">
          <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block">
            <path d="M0 100L60 91.7C120 83.3 240 66.7 360 58.3C480 50 600 50 720 54.2C840 58.3 960 66.7 1080 70.8C1200 75 1320 75 1380 75L1440 75V100H1380C1320 100 1200 100 1080 100C960 100 840 100 720 100C600 100 480 100 360 100C240 100 120 100 60 100H0Z" fill="var(--color-surface-50)" stroke="var(--color-surface-50)" strokeWidth="2"/>
          </svg>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <ScrollFloat className="text-center mb-14" threshold={0.3}>
          <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-2">Why SEAPEDIA</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 mb-3 tracking-tight">Everything You Need in One Platform</h2>
          <p className="text-surface-500 max-w-xl mx-auto">A complete marketplace ecosystem designed for everyone.</p>
        </ScrollFloat>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <ScrollReveal
              key={i}
              delay={i * 0.12}
              duration={0.6}
              origin="bottom"
              distance={50}
              blur
              threshold={0.1}
            >
              <div className="group p-6 rounded-2xl bg-white shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 h-full">
                <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-5 group-hover:bg-primary-600 group-hover:text-white group-hover:shadow-glow transition-all duration-300">
                  <f.icon size={24} />
                </div>
                <h3 className="font-semibold text-surface-900 mb-2 text-base">{f.title}</h3>
                <p className="text-sm text-surface-500 leading-relaxed">{f.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollFloat className="flex items-end justify-between mb-10" threshold={0.3}>
            <div>
              <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-2">Catalog</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 tracking-tight">Featured Products</h2>
              <p className="text-surface-500 mt-2">Discover trending items from our top sellers.</p>
            </div>
            <Link to="/products" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors px-4 py-2 rounded-lg hover:bg-primary-50">
              View All <HiArrowRight size={16} />
            </Link>
          </ScrollFloat>

          {loading ? (
            <Spinner className="py-20" />
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {products.map((product, idx) => (
                <ScrollReveal
                  key={product.id}
                  delay={idx * 0.08}
                  duration={0.5}
                  origin="bottom"
                  distance={30}
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
              <Button variant="outline">View All Products</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 overflow-hidden">
        <ScrollFloat className="text-center mb-12" threshold={0.3}>
          <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-2">Testimonials</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 mb-4 tracking-tight">What People Say About SEAPEDIA</h2>
          <div className="flex items-center justify-center gap-3">
            <RatingStars rating={Math.round(reviewStats.averageRating)} size={20} />
            <span className="text-sm text-surface-500">
              {reviewStats.averageRating} / 5 from {reviewStats.total} reviews
            </span>
          </div>
        </ScrollFloat>

        <div className="relative group max-w-7xl mx-auto px-4">
          {/* Left Navigation Button */}
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 p-2.5 rounded-full bg-white shadow-md text-surface-600 hover:text-primary-600 hover:shadow-lg transition-all duration-200 cursor-pointer hidden md:flex items-center justify-center"
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
                    delay={idx * 0.08}
                    duration={0.6}
                    origin="bottom"
                    distance={30}
                    blur
                    scale
                    threshold={0.05}
                  >
                    <div className="p-6 rounded-2xl bg-white shadow-card hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-300 h-full flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-semibold text-sm shadow-sm flex-shrink-0">
                              {review.reviewer_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-surface-900 text-sm">{review.reviewer_name}</p>
                              <p className="text-[10px] text-surface-400 font-medium">{formatDate(review.created_at)}</p>
                            </div>
                          </div>
                          <RatingStars rating={review.rating} size={14} />
                        </div>
                        <p className="text-sm text-surface-650 leading-relaxed italic">"{review.comment}"</p>
                      </div>
                    </div>
                  </ScrollReveal>
                </div>
              ))
            ) : (
              <div className="w-full text-center py-12 bg-white rounded-2xl shadow-sm">
                <HiStar className="mx-auto text-surface-300 mb-3 animate-pulse" size={40} />
                <p className="text-surface-500">No reviews yet. Be the first to share your experience!</p>
              </div>
            )}
          </div>

          {/* Right Navigation Button */}
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 p-2.5 rounded-full bg-white shadow-md text-surface-600 hover:text-primary-600 hover:shadow-lg transition-all duration-200 cursor-pointer hidden md:flex items-center justify-center"
            aria-label="Scroll Right"
          >
            <HiChevronRight size={20} />
          </button>
        </div>

        {/* Action Button & Modal trigger */}
        <div className="text-center mt-10">
          <ScrollReveal
            delay={0.1}
            duration={0.5}
            origin="bottom"
            distance={20}
            blur
            scale
            threshold={0.05}
          >
            <Button
              size="lg"
              onClick={() => setIsReviewModalOpen(true)}
              className="shadow-md hover:shadow-lg hover:shadow-primary-500/10"
            >
              <HiStar className="text-amber-400 animate-pulse mr-2" size={18} />
              <GradientText
                colors={['#ffffff', '#e0e7ff', '#c4b5fd', '#ffffff']}
                animationSpeed={4}
                className="font-semibold"
              >
                Write a Review
              </GradientText>
            </Button>
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
            <Button type="submit" loading={submitting} disabled={submitting}>
              Submit Review
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
