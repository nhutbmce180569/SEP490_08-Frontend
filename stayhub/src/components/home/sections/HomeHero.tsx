import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  X,
  ChevronDown,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PATH } from "../../../config/routes/route";
import { HOME_CONTAINER, getFreeApiImage } from "./shared";
import { useTranslation } from "../../../contexts/LocaleContext";
import { getTrendPrediction } from "../../../features/ai/services/trend.service";

const HERO_IMAGE = getFreeApiImage("vietnam-ha-long-bay-cruise", 1920, 1080);

const removeVietnameseTones = (str: string) => {
  if (!str) return str;
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
};

export const HomeHero: React.FC = () => {
  const { t, locale } = useTranslation();
  const navigate = useNavigate();

  // Active Tour Category Tab
  const [activeTab, setActiveTab] = useState("ALL");

  // Search filter states
  const [departureLocation, setDepartureLocation] = useState("All");
  const [selectedDestination, setSelectedDestination] = useState("ALL");
  const [searchDate, setSearchDate] = useState("");

  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const [destSearchInput, setDestSearchInput] = useState("");
  const destDropdownRef = useRef<HTMLDivElement>(null);

  const [quickDestinations, setQuickDestinations] = useState<string[]>([]);

  const popularDestinations = [
    { id: "ALL", name: t("hero.allDestinations"), province: t("hero.allNationwide"), code: "ALL" },
    { id: "SGN", name: "TP. Hồ Chí Minh", province: locale === "en" ? "Southern Region" : "Khu vực Miền Nam", code: "SGN" },
    { id: "HAN", name: "Hà Nội", province: locale === "en" ? "Capital City" : "Thủ đô Ngàn năm", code: "HAN" },
    { id: "DAD", name: "Đà Nẵng", province: locale === "en" ? "Central Coastal City" : "Thành phố Biển Miền Trung", code: "DAD" },
    { id: "PQC", name: "Phú Quốc", province: locale === "en" ? "Pearl Island" : "Đảo Ngọc Kiên Giang", code: "PQC" },
    { id: "CXR", name: "Nha Trang", province: locale === "en" ? "Khanh Hoa Bay" : "Vịnh biển Khánh Hòa", code: "CXR" },
    { id: "VDO", name: "Hạ Long", province: locale === "en" ? "Quang Ninh Wonder" : "Kỳ quan Quảng Ninh", code: "VDO" },
    { id: "DLI", name: "Đà Lạt", province: locale === "en" ? "City of Eternal Spring" : "Thành phố Sương mù Lâm Đồng", code: "DLI" },
    { id: "HOI", name: "Hội An", province: locale === "en" ? "Ancient Town" : "Phố cổ Di sản Quảng Nam", code: "HOI" },
    { id: "SPA", name: "Sa Pa", province: locale === "en" ? "Lao Cai Highlands" : "Vùng cao Lào Cai", code: "SPA" },
    { id: "HUI", name: "Huế", province: locale === "en" ? "Imperial City" : "Cố đô Thừa Thiên Huế", code: "HUI" },
    { id: "NBI", name: "Ninh Bình", province: locale === "en" ? "Trang An Scenic Landscape" : "Tràng An Tuyệt cảnh", code: "NBI" },
  ];

  useEffect(() => {
    const fetchHotDestinations = async () => {
      try {
        const res = await getTrendPrediction();
        if (res.provinceForecasts && res.provinceForecasts.length > 0) {
          const topDest = res.provinceForecasts.slice(0, 6).map((p) => p.province);
          setQuickDestinations(topDest);
        } else {
          setQuickDestinations(["Đà Nẵng", "Hội An", "Đà Lạt", "Hạ Long", "Phú Quốc", "Sa Pa"]);
        }
      } catch (error) {
        console.error("Failed to fetch hot destinations:", error);
        setQuickDestinations(["Đà Nẵng", "Hội An", "Đà Lạt", "Hạ Long", "Phú Quốc", "Sa Pa"]);
      }
    };
    fetchHotDestinations();
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (destDropdownRef.current && !destDropdownRef.current.contains(e.target as Node)) {
        setShowDestDropdown(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);
  // Scroll to section on the home page
  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Map tab IDs to home page section IDs
  const tabSectionMap: Record<string, string> = {
    HOT: "home-hot-tours",
    SALE: "home-sale-tours",
    UPCOMING: "home-upcoming-tours",
  };

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (tabSectionMap[tabId]) {
      scrollToSection(tabSectionMap[tabId]);
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedDestination && selectedDestination !== "ALL") {
      params.append("searchTerm", selectedDestination);
    }
    if (searchDate) params.append("startDate", searchDate);
    if (departureLocation && departureLocation !== "All") {
      params.append("departure", departureLocation);
    }
    navigate(`${PATH.PUBLIC.TOUR_SEARCH}?${params.toString()}`);
  };

  const serviceTabs = [
    { id: "ALL", label: t("hero.tabAllTours") },
    { id: "HOT", label: t("hero.tabHotTours") },
    { id: "SALE", label: t("hero.tabSaleTours") },
    { id: "UPCOMING", label: t("hero.tabUpcoming") },
  ];

  const getDisplayDestName = () => {
    if (selectedDestination === "ALL") return t("hero.allDestinations");
    return selectedDestination;
  };

  const filteredDestinations = popularDestinations.filter((item) =>
    item.name.toLowerCase().includes(destSearchInput.toLowerCase()) ||
    item.province.toLowerCase().includes(destSearchInput.toLowerCase()) ||
    item.code.toLowerCase().includes(destSearchInput.toLowerCase())
  );

  return (
    <section className="hero-section">
      {/* Background */}
      <div className="hero-bg">
        <img
          src={HERO_IMAGE}
          alt={t("home.heroImageAlt")}
          className="hero-bg__img"
          fetchPriority="high"
        />
        <div className="hero-bg__overlay" />
        <div className="hero-bg__vignette" />
      </div>

      <div className={`${HOME_CONTAINER} relative z-10 hero-content`}>
        {/* Title */}
        <div className="hero-heading">
          <h1 className="hero-heading__title">
            <span className="hero-heading__line1">{t("hero.titlePrefix")}</span>
            <span className="hero-heading__line2">{t("hero.titleSuffix")}</span>
          </h1>
          <p className="hero-heading__sub">{t("hero.subtitle")}</p>
        </div>

        {/* Search Card */}
        <div id="tour-search-box" className="hero-search">
          {/* Tabs */}
          <div className="hero-tabs">
            {serviceTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabClick(tab.id)}
                  className={`hero-tab ${isActive ? "hero-tab--active" : ""}`}
                >
                  {tab.label}
                  {isActive && <span className="hero-tab__indicator" />}
                </button>
              );
            })}
          </div>

          {/* Search Fields */}
          <div className="hero-fields">
            {/* Field 1: Departure */}
            <div className="hero-field">
              <div className="hero-field__inner">
                <span className="hero-field__label">{t("hero.departureLocation")}</span>
                <div className="hero-field__value-row">
                  <span className="hero-field__value">
                    {departureLocation === "All" ? t("hero.allDestinations") : departureLocation}
                  </span>
                  {departureLocation !== "All" && (
                    <button
                      type="button"
                      onClick={() => setDepartureLocation("All")}
                      className="hero-field__clear"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="hero-field__divider" />

            {/* Field 2: Destination */}
            <div className="hero-field hero-field--dest" ref={destDropdownRef}>
              <div
                onClick={() => setShowDestDropdown(!showDestDropdown)}
                className="hero-field__inner hero-field__inner--clickable"
              >
                <span className="hero-field__label">{t("hero.destination")}</span>
                <div className="hero-field__value-row">
                  <span className="hero-field__value">{getDisplayDestName()}</span>
                  <ChevronDown
                    size={14}
                    className={`hero-field__chevron ${showDestDropdown ? "hero-field__chevron--open" : ""}`}
                  />
                </div>
              </div>

              {/* Dropdown */}
              {showDestDropdown && (
                <div className="hero-dropdown">
                  <div className="hero-dropdown__search">
                    <Search size={14} className="hero-dropdown__search-icon" />
                    <input
                      type="text"
                      value={destSearchInput}
                      onChange={(e) => setDestSearchInput(e.target.value)}
                      placeholder={t("hero.searchPlaceholder")}
                      className="hero-dropdown__search-input"
                      autoFocus
                    />
                  </div>

                  {/* Trending chips */}
                  {!destSearchInput && (
                    <div className="hero-dropdown__trending">
                      <span className="hero-dropdown__trending-label">
                        <TrendingUp size={12} />
                        {t("hero.trendingDestinations")}
                      </span>
                      <div className="hero-dropdown__chips">
                        {quickDestinations.map((dest) => (
                          <button
                            key={dest}
                            type="button"
                            onClick={() => {
                              setSelectedDestination(dest);
                              setShowDestDropdown(false);
                            }}
                            className="hero-dropdown__chip"
                          >
                            {locale === "en" ? removeVietnameseTones(dest) : dest}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* List */}
                  <div className="hero-dropdown__list custom-scrollbar">
                    {filteredDestinations.map((item) => {
                      const isSelected =
                        (selectedDestination === "ALL" && item.code === "ALL") ||
                        selectedDestination === item.name;
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => {
                            setSelectedDestination(item.code === "ALL" ? "ALL" : item.name);
                            setShowDestDropdown(false);
                          }}
                          className={`hero-dropdown__item ${isSelected ? "hero-dropdown__item--selected" : ""}`}
                        >
                          <div className="hero-dropdown__item-info">
                            <span className="hero-dropdown__item-name">{item.name}</span>
                            <span className="hero-dropdown__item-province">{item.province}</span>
                          </div>
                          <span className="hero-dropdown__item-code">{item.code}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="hero-field__divider" />

            {/* Field 3: Date */}
            <div className="hero-field">
              <div className="hero-field__inner">
                <span className="hero-field__label">{t("hero.departureDate")}</span>
                <input
                  type="date"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  className="hero-field__date"
                />
              </div>
            </div>

            {/* Search Button — text only, no icons */}
            <button
              type="button"
              onClick={handleSearch}
              className="hero-search-btn"
            >
              {t("hero.search")}
            </button>
          </div>

          {/* Bottom Bar */}
          <div className="hero-bottom">
            <div className="hero-trust">
              <span className="hero-trust__item">{t("hero.bestPriceGuarantee")}</span>
              <span className="hero-trust__dot" />
              <span className="hero-trust__item">{t("hero.instantConfirmation")}</span>
              <span className="hero-trust__dot" />
              <span className="hero-trust__item">{t("hero.flexiblePayment")}</span>
              <span className="hero-trust__dot" />
              <span className="hero-trust__item">{t("hero.support247")}</span>
            </div>

            <div className="hero-hot">
              <span className="hero-hot__label">{t("hero.hotSearchLabel")}</span>
              {quickDestinations.slice(0, 4).map((dest) => (
                <button
                  key={dest}
                  type="button"
                  onClick={() => {
                    setSelectedDestination(dest);
                    navigate(`${PATH.PUBLIC.TOUR_SEARCH}?searchTerm=${encodeURIComponent(dest)}`);
                  }}
                  className="hero-hot__chip"
                >
                  {locale === "en" ? removeVietnameseTones(dest) : dest}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
