import "../styles/HeroSection.css";
import logoImage from "../assets/Logo.png";
import Background from "../assets/Background.png";
import bgvideo from "../assets/hero-video.mp4";

export default function HeroSection() {
  return (
    <section id="philosophy" className="hero-section">

        <video
        className="hero-background-video"
        autoPlay
        muted
        loop
        playsInline
      >
        {/* Change video to image if required (import from assets) */}
        <source src={bgvideo} type="video/mp4" /> 
      </video>
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
              An invite-only platform offering honest, research driven
            </p>
            <p className = "hero-description2">
              investment guidance
            </p>

            {/* Request Invite Button - Mobile Only */}
            <a href="#invite" className="hero-request-button">
              Request Invite
            </a>
          </div>
        </div>


      </div>
    </section>
  );
}