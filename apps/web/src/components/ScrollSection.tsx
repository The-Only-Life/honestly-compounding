import { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import "../styles/ScrollSection.css";

gsap.registerPlugin(ScrollTrigger);

export default function ScrollSection() {
  const sectionRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    const paragraph = textRef.current;
    let html = "";

    // Get all child nodes (text nodes and br elements)
    Array.from(paragraph.childNodes).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        // Split text by spaces and filter empty strings
        const words = node.textContent
          .split(/\s+/)
          .filter((w) => w.length > 0);

        html += words
          .map((word) => {
            const cleanWord = word.replace(/[^\w]/g, "").toLowerCase();

            if (cleanWord === "honesty" || cleanWord === "patience") {
              return `<span class="word highlight-word">${word} </span>`;
            }

            return `<span class="word">${word} </span>`;
          })
          .join("");
      } else if (node.tagName === "BR") {
        // Preserve br tags
        html += "<br>";
      }
    });

    paragraph.innerHTML = html;

    const wordElements = paragraph.querySelectorAll(".word");

    gsap.set(wordElements, { opacity: 0.2 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 2,
      },
    });

    wordElements.forEach((word, index) => {
      tl.to(
        word,
        {
          opacity: 1,
          duration: 0.3,
          ease: "power2.out",
        },
        index * 0.12
      );
    });

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, []);

  return (
    <section id="approach" ref={sectionRef} className="scroll-section">
      <div className="scroll-section__container">
        <div className="scroll-section__header">
          FOR THOSE WHO INVEST WITH <span>PATIENCE.</span>
        </div>

        <p ref={textRef} className="scroll-section__text">
          Our work is built around patience.
          <br />
          We offer a carefully chosen basket of stocks
          <br />
          And identify rare short-term opportunities when they appear, While We stay with you through every phase of your investing life.
          <br />
          Your wealth and assets are reviewed each year with clarity and honesty. All for a simple fee and no commissions — your money stays with you.
        </p>
      </div>
    </section>
  );
}