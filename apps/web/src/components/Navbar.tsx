import { useState, useEffect } from "react";
import "../styles/Navbar.css";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Navbar() {
  const [activeLink, setActiveLink] = useState("philosophy");

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

        onEnter: () => setActiveLink(link.id),
        onEnterBack: () => setActiveLink(link.id),
      });
    });

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-content">

        
        <div className="navbar-logo">
          <a href="#philosophy">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="white"
              stroke="currentColor"
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

        
        <a href="#invite" className="navbar-button">
          Request Invite
        </a>

      </div>
    </nav>
  );
}
