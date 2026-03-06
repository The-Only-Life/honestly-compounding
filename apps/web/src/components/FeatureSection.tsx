import { useState, useRef, useEffect } from "react";
import "../styles/FeatureSection.css";

// Import images from assets
import image1 from "../assets/card1.png";
import image2 from "../assets/card2.png";
import image3 from "../assets/card3.png";
import image4 from "../assets/card4.png";
import image5 from "../assets/card5.png";

const cards = [
  {
    title: "We stay with you.",
    text: "From first investment to long term decisions, we guide every phase not just entry points.",
    color: "#B13BFF",
    image: image1,
  },
  {
    title: "Product Over Projections",
    text: "We focus on product strength, adoption, and capability rather than short-term earnings or distant forecasts.",
    color: "#2D78FE",
    image: image2,
  },
  {
    title: "A focused set to choose from.",
    text: "A basket of 50+ researched stocks that suits your goals not endless recommendations.",
    color: "#27D8F7",
    image: image3,
  },
  {
    title: "Diversification, made visible",
    text: "Stocks spread across industries and risk buckets to help balance desicions.",
    color: "#2BFF4B",
    image: image4,
  },
  {
    title: "Portfolio review",
    text: "Annual reviews of equity, debt, gold, and more-at no extra cost.",
    color: "#FFCB3A",
    image: image5,
  },
];

export default function FeatureSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const cardGridRef = useRef<HTMLDivElement>(null);

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    handleSwipe();
  };

  const handleSwipe = () => {
    const swipeThreshold = 50; // Minimum distance for swipe
    const diff = touchStartX.current - touchEndX.current;

    // Swiped left - next card
    if (diff > swipeThreshold && currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }

    // Swiped right - previous card
    if (diff < -swipeThreshold && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Handle desktop buttons
  const handleNext = () => {
    if (currentIndex < cards.length - 3) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Go to specific slide
  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // For mobile: 1 card, for desktop: 3 cards
  const displayCount = isMobile ? 1 : 3;

  return (
    <section id="research" className="feature-section">
      <div className="feature-container">
        <h2 className="feature-heading">
          The Structure Behind <br />
          the <span>Simplicity</span>
        </h2>

        <p className="feature-sub">
          We don't hand you reports and walk away. We stay involved through
          decisions, cycles, and time.
        </p>

        <div className="carousel-wrapper">
          {/* Desktop buttons (hidden on mobile via CSS) */}
          <button
            className="carousel-button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            aria-label="Previous card"
          >
            <svg viewBox="0 0 24 24">
              <path d="M15 18L9 12L15 6" />
            </svg>
          </button>

          {/* Card Grid with Swipe Support */}
          <div
            className="card-grid"
            ref={cardGridRef}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            role="region"
            aria-label="Card carousel"
          >
            {cards
              .slice(currentIndex, currentIndex + displayCount)
              .map((card, i) => (
                <div
                  key={currentIndex + i}
                  className="feature-card"
                  style={{ "--accent": card.color } as React.CSSProperties}
                >
                  <h4 className="card-title">{card.title}</h4>
                  <p className="card-text">{card.text}</p>

                  {card.image && (
                    <img
                      src={card.image}
                      alt={card.title}
                      className="card-image"
                    />
                  )}
                </div>
              ))}
          </div>

          {/* Desktop buttons (hidden on mobile via CSS) */}
          <button
            className="carousel-button"
            onClick={handleNext}
            disabled={currentIndex === cards.length - displayCount}
            aria-label="Next card"
          >
            <svg viewBox="0 0 24 24">
              <path d="M9 18L15 12L9 6" />
            </svg>
          </button>
        </div>

        {/* Indicator Dots - Visible on mobile only */}
        <div className="carousel-indicators">
          {cards.map((_, index) => (
            <button
              key={index}
              className={`indicator-dot ${
                index === currentIndex ? "active" : ""
              }`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to card ${index + 1}`}
              aria-current={index === currentIndex ? "true" : "false"}
            />
          ))}
        </div>
      </div>
    </section>
  );
}