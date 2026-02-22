import { useState } from "react";
import "../styles/FeatureSection.css";

const cards = [
  {
    title: "We stay with you.",
    text: "From first investment to long term decisions, we guide every phase not just entry points.",
    color: "#B13BFF",
  },
  {
    title: "Product Over Projections",
    text: "We focus on product strength, adoption, and capability rather than short-term earnings or distant forecasts.",
    color: "#2D78FE",
  },
  {
    title: "A focused set to choose from.",
    text: "A basket of 50+ researched stocks that suits your goals not endless recommendations.",
    color: "#27D8F7",
  },
  {
    title: "Diversification, made visible",
    text: "Stocks spread across industries and risk buckets to help balance desicions.",
    color: "#2BFF4B",
  },
  {
    title: "Portfolio review",
    text: "Annual reviews of equity, debt, gold, and more-at no extra cost.",
    color: "#FFCB3A",
  },
];

export default function FeatureSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

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

  return (
    <section id="research" className="feature-section">
      <div className="feature-container">
        {/* Heading */}
        <h2 className="feature-heading">
          The Structure Behind <br />
          the <span>Simplicity</span>
        </h2>

        <p className="feature-sub">
          We don't hand you reports and walk away. We stay involved through
          decisions, cycles, and time.
        </p>

        {/* Carousel Container */}
        <div className="carousel-wrapper">
          <button
            className="carousel-button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            <svg viewBox="0 0 24 24">
              <path d="M15 18L9 12L15 6" />
            </svg>
          </button>


          {/* Cards */}
          <div className="card-grid">
            {cards.slice(currentIndex, currentIndex + 3).map((card, i) => (
              <div
                key={currentIndex + i}
                className="feature-card"
                style={{ "--accent": card.color } as React.CSSProperties}
              >
                <h4 className="card-title">{card.title}</h4>
                <p className="card-text">{card.text}</p>

                {/* Image placeholder */}
                <div className="card-image" />
              </div>
            ))}
          </div>

            <button
              className="carousel-button"
              onClick={handleNext}
              disabled={currentIndex === cards.length - 3}
            >
              <svg viewBox="0 0 24 24">
                <path d="M9 18L15 12L9 6" />
              </svg>
            </button>

        </div>
      </div>
    </section>
  );
}