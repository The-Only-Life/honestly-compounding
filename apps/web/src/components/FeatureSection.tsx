import { useState, useRef, useEffect } from "react";
import "../styles/FeatureSection.css";

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
    text: "Stocks spread across industries and risk buckets to help balance decisions.",
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
  const [index, setIndex] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(3);

  const startX = useRef(0);
  const endX = useRef(0);

  useEffect(() => {
    const update = () => {
      setCardsPerView(window.innerWidth < 768 ? 1 : 3);
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const maxIndex = cards.length - cardsPerView;

  const next = () => {
    setIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  const prev = () => {
    setIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    endX.current = e.changedTouches[0].clientX;

    const diff = startX.current - endX.current;

    if (Math.abs(diff) < 50) return;

    if (diff > 0) next();
    else prev();
  };

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
          <button className="carousel-button" onClick={prev} disabled={index === 0}>
            <svg viewBox="0 0 24 24">
              <path d="M15 18L9 12L15 6" />
            </svg>
          </button>

          <div
            className="card-viewport"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="card-track"
              style={{
                transform: `translate3d(-${index * (100 / cardsPerView)}%,0,0)`
              }}
            >
              {cards.map((card, i) => (
                <div
                  key={i}
                  className="feature-card"
                  style={{ "--accent": card.color } as React.CSSProperties}
                >
                  <h4 className="card-title">{card.title}</h4>
                  <p className="card-text">{card.text}</p>

                  <img
                    src={card.image}
                    alt={card.title}
                    className="card-image"
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            className="carousel-button"
            onClick={next}
            disabled={index === maxIndex}
          >
            <svg viewBox="0 0 24 24">
              <path d="M9 18L15 12L9 6" />
            </svg>
          </button>
        </div>

        <div className="carousel-indicators">
          {cards.map((_, i) => (
            <button
              key={i}
              className={`indicator-dot ${i === index ? "active" : ""}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}