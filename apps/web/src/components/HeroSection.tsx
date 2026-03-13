import "../styles/HeroSection.css";
import logoImage from "../assets/Logo.png"
import HeroImage from "../assets/Hero_Section.png";

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
            <h2 className="hero-subheading">Reserved for a Select <br></br>Few.</h2>

            <p className="hero-description">
              An invite-only platform offering honest, research driven investment
              guidance.
            </p>

            {/* Request Invite Button - Mobile Only */}
            <a href="#invite" className="hero-request-button">
              Request Invite
            </a>
          </div>
        </div>

        <div className="hero-video-container">
          <img src={HeroImage} alt="Hero Image" className="hero-image" />
        </div>
      </div>
    </section>
  );
}