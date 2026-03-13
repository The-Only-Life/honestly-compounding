import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/Navbar.css";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Navbar() {
  const [activeLink, setActiveLink] = useState("philosophy");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: "philosophy", label: "Philosophy" },
    { id: "approach", label: "Approach" },
    { id: "research", label: "Research" },
  ];

  useEffect(() => {
    navLinks.forEach((link) => {
      ScrollTrigger.create({
        trigger: `#${link.id}`,
        start: "top 60%",
        end: "bottom 40%",

        onEnter: () => {
          setActiveLink(link.id);
          setMobileMenuOpen(false);
        },
        onEnterBack: () => {
          setActiveLink(link.id);
          setMobileMenuOpen(false);
        },
      });
    });

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, []);

  // Close mobile menu when a link is clicked
  const handleLinkClick = (linkId) => {
    setActiveLink(linkId);
    setMobileMenuOpen(false);
  };

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-content">
                  <div className="navbar-logo">
          <a href="#philosophy">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="white"
              stroke="Black"
              strokeWidth="2"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </a>
        </div>
          
          <ul className="navbar-menu">
            {navLinks.map((link) => (
              <li key={link.id}>
                <a
                  href={`#${link.id}`}
                  className={`navbar-link ${
                    activeLink === link.id ? "active" : ""
                  }`}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          
          <div className="navbar-actions">
            <Link to="/auth" className="navbar-link navbar-signin">
              Sign In
            </Link>
            <a href="#invite" className="navbar-button">
              Request Invite
            </a>
          </div>

          {/* Hamburger Menu Button */}
          <button
            className={`navbar-hamburger ${mobileMenuOpen ? "open" : ""}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`mobile-menu-overlay ${mobileMenuOpen ? "open" : ""}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? "open" : ""}`}>
        <ul className="mobile-menu-links">
          {navLinks.map((link) => (
            <li key={link.id}>
              <a
                href={`#${link.id}`}
                className={`mobile-menu-link ${
                  activeLink === link.id ? "active" : ""
                }`}
                onClick={() => handleLinkClick(link.id)}
              >
                {link.label}
              </a>
            </li>
          ))}
          
          {/* Sign In in Mobile Menu */}
          <li>
            <Link
              to="/auth"
              className="mobile-menu-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign In
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
}