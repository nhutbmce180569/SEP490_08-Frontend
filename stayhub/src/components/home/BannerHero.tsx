import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination, Navigation, Autoplay } from 'swiper/modules';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import type { Swiper as SwiperType } from 'swiper';
import type { ReadBannerDTO } from '../../features/content/types/banner';

interface HeroSectionProps {
    banners?: ReadBannerDTO[];
    customLeftContent?: React.ReactNode;
}

const PARTICLE_STYLES = [...Array(20)].map(() => ({
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 5}s`,
    animationDuration: `${2 + Math.random() * 3}s`
}));

const HeroSection: React.FC<HeroSectionProps> = ({ banners = [], customLeftContent }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const swiperRef = useRef<any>(null);
    const { t } = useTranslation();

    // Memoized filtered banners
    const activeBanners = useMemo(() =>
        banners.filter(banner => banner?.isActive !== false),
        [banners]
    );

    const enableLoop = activeBanners.length >= 3;
    const activeBanner = activeBanners[activeIndex] || activeBanners[0];

    // Background with active banner image
    const backgroundStyle = useMemo(() => ({
        backgroundImage: activeBanner
            ? `linear-gradient(135deg, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0.4) 50%, rgba(0, 0, 0, 0.8) 100%), url(${activeBanner.imageUrl})`
            : 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 58, 138, 0.9) 50%, rgba(15, 23, 42, 0.95) 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    }), [activeBanner]);

    // Callback handlers
    const handleSlideChange = useCallback((swiper: SwiperType) => {
        setActiveIndex(swiper.realIndex);
    }, []);

    const handlePrevClick = useCallback(() => {
        swiperRef.current?.slidePrev();
    }, []);

    const handleNextClick = useCallback(() => {
        swiperRef.current?.slideNext();
    }, []);

    if (!activeBanners.length) {
        return null;
    }

    return (
        <section
            className="relative min-h-[550px] flex items-center overflow-hidden transition-all duration-1000 pt-6"
            style={backgroundStyle}
        >
            {/* Background overlay with animated particles */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/60" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

            {/* Animated background particles */}
            <div className="absolute inset-0 opacity-30">
                {PARTICLE_STYLES.map((style, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                        style={style}
                    />
                ))}
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-center">
                    {/* Featured Banner Info */}
                    {activeBanner && (
                        <div className="space-y-4 order-2 lg:order-1 text-center lg:text-left">
                            {customLeftContent ? customLeftContent : (
                                <>
                                    {/* Title */}
                                    {activeBanner.title && (
                                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
                                            <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent drop-shadow-2xl">
                                                {activeBanner.title}
                                            </span>
                                        </h1>
                                    )}

                                    {/* Action Buttons */}
                                    {activeBanner.targetUrl && (
                                        <div className="lg:justify-start">
                                            <Link
                                                to={activeBanner.targetUrl}
                                                className="inline-flex items-center px-6 py-3 bg-brand hover:bg-brand/90 text-white text-sm font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-brand/30"
                                            >
                                                {t("HOME.MORE_INFO", "More Info")}
                                            </Link>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* Swiper Carousel */}
                    <div className="relative order-1 lg:order-2">
                        <Swiper
                            effect="coverflow"
                            grabCursor={true}
                            centeredSlides={true}
                            loop={enableLoop}
                            slidesPerView="auto"
                            spaceBetween={15}
                            coverflowEffect={{
                                rotate: 15,
                                stretch: 0,
                                depth: 150,
                                modifier: 1.8,
                                slideShadows: true,
                            }}
                            autoplay={{
                                delay: 4000,
                                disableOnInteraction: false,
                                pauseOnMouseEnter: true,
                            }}
                            pagination={{
                                clickable: true,
                                dynamicBullets: true,
                                renderBullet: (index: number, className: string) => {
                                    return `<span class="${className} !w-3 !h-3 !bg-white/50 !transition-all !duration-300 hover:!bg-white/70"></span>`;
                                }
                            }}
                            navigation={{
                                nextEl: '.hero-nav-next',
                                prevEl: '.hero-nav-prev',
                            }}
                            modules={[EffectCoverflow, Pagination, Navigation, Autoplay]}
                            className="!pb-12 !overflow-hiden"
                            onSlideChange={handleSlideChange}
                            onSwiper={(swiper: SwiperType) => (swiperRef.current = swiper)}
                            breakpoints={{
                                320: { slidesPerView: 1, spaceBetween: 10 },
                                640: { slidesPerView: 2, spaceBetween: 12 },
                                1024: { slidesPerView: 3, spaceBetween: 15 },
                            }}
                        >
                            {activeBanners.map((banner, index) => (
                                <SwiperSlide
                                    key={banner.id}
                                    className="h-auto max-w-[300px]"
                                >
                                    <div className={`group relative transform transition-all duration-700 ${index === activeIndex
                                        ? 'scale-95 z-20 shadow-2xl shadow-brand/30'
                                        : 'scale-80 opacity-60 hover:scale-95 hover:opacity-80'
                                        }`}>
                                        <Link
                                            to={banner.targetUrl || "#"}
                                            className={`block backdrop-blur-xl rounded overflow-hidden transition-all duration-500 no-underline ${index === activeIndex
                                                ? 'bg-white/20 border-brand/60 shadow-2xl shadow-brand/25 ring-2 ring-brand/50'
                                                : 'bg-white/10 border-white/20 hover:bg-white/15 hover:border-white/40'
                                                }`}
                                        >
                                            {/* Banner Image */}
                                            <div className="relative aspect-video overflow-hidden">
                                                <img
                                                    src={banner.imageUrl}
                                                    alt={banner.title}
                                                    className={`w-full h-full object-cover transition-transform duration-700 ${index === activeIndex
                                                        ? 'scale-105 brightness-110'
                                                        : 'group-hover:scale-110'
                                                        }`}
                                                    loading="lazy"
                                                />

                                                {/* Active indicator */}
                                                {index === activeIndex && (
                                                    <div className="absolute top-4 right-4 w-4 h-4 bg-brand rounded-full animate-pulse shadow-lg shadow-brand/50 ring-2 ring-white/50" />
                                                )}

                                                {/* Overlay on hover */}
                                                <div className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${index === activeIndex
                                                    ? 'opacity-20'
                                                    : 'opacity-0 group-hover:opacity-60'
                                                    }`} />
                                            </div>

                                            {/* Banner Info */}
                                            <div className="p-4 space-y-2 z-3">
                                                <h3 className={`text-lg font-bold line-clamp-2 transition-colors duration-300 no-underline ${index === activeIndex
                                                    ? 'text-brand drop-shadow-lg'
                                                    : 'text-white group-hover:text-brand'
                                                    }`}>
                                                    {banner.title}
                                                </h3>

                                                {/* Active banner special indicator */}
                                                {index === activeIndex && (
                                                    <div className="flex items-center gap-2 pt-2">
                                                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-brand to-transparent" />
                                                        <Star size={14} className="text-brand fill-brand animate-pulse" />
                                                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-brand to-transparent" />
                                                    </div>
                                                )}
                                            </div>
                                        </Link>
                                    </div>
                                </SwiperSlide>
                            ))}
                        </Swiper>

                        {/* Custom Navigation Buttons */}
                        {activeBanners.length > 1 && (
                            <>
                                <button
                                    className="hero-nav-prev absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 z-20 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300"
                                    onClick={handlePrevClick}
                                    aria-label="Previous banner"
                                >
                                    <ChevronLeft size={18} />
                                </button>

                                <button
                                    className="hero-nav-next absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 z-20 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300"
                                    onClick={handleNextClick}
                                    aria-label="Next banner"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Decorative floating elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-16 h-16 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-xl animate-pulse"
                        style={{
                            left: `${10 + (i % 3) * 30}%`,
                            top: `${20 + (i % 2) * 60}%`,
                            animationDelay: `${i * 2}s`,
                            animationDuration: `${4 + i}s`
                        }}
                    />
                ))}
            </div>

            {/* Custom styles for swiper */}
            <style>{`
                .swiper-pagination {
                    bottom: 0 !important;
                    display: flex !important;
                    justify-content: center !important;
                    gap: 8px !important;
                }
                .swiper-pagination-bullet {
                    width: 10px !important;
                    height: 10px !important;
                    background: rgba(255, 255, 255, 0.5) !important;
                    border-radius: 50% !important;
                    transition: all 0.3s ease !important;
                    opacity: 1 !important;
                }
                .swiper-pagination-bullet-active {
                    background: #3b82f670 !important;
                    width: 28px !important;
                    border-radius: 14px !important;
                    box-shadow: 0 0 18px rgba(59, 130, 246, 0.5) !important;
                }
                .swiper-pagination-bullet:hover {
                    background: rgba(255, 255, 255, 0.8) !important;
                    transform: scale(1.1) !important;
                }
                a, a h3, a p, a * {
                    text-decoration: none !important;
                }
                .group a {
                    text-decoration: none !important;
                }
                .no-underline, .no-underline * {
                    text-decoration: none !important;
                }
                a:hover, a:active, a:visited {
                    text-decoration: none !important;
                }
            `}</style>
        </section>
    );
};

export default HeroSection;