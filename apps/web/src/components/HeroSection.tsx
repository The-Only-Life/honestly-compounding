import "../styles/HeroSection.css";
import logoImage from "../assets/Logo.png"

export default function HeroSection() {
  return (
    <section id="philosophy" className="hero-section">
      <header className="hero-header">
        <div className="hero-logo-container">
          <img 
            src={logoImage} 
            alt="Company Logo" 
            className="hero-logo"
          />
          <span className="hero-company-name"></span>
        </div>
      </header>

      <div className="hero-wrapper">
        <div className="hero-content">
          <div className="hero-container">
            <h1 className="hero-heading">
              Built for Long Term{" "}
              <span className="hero-highlight">Investors.</span>
            </h1>
            <h2 className="hero-subheading">Reserved for a Select Few.</h2>
            <p className="hero-description">
              An invite-only platform offering honest, research driven investment
              guidance.
            </p>
          </div>
        </div>

        <div className="hero-video-container">
          <video
            className="hero-video"
            autoPlay
            muted
            loop
            playsInline
          >
            <source src="/your-video.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </section>
  );
}