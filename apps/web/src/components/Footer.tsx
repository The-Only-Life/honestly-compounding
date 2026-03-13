import "../styles/Footer.css";
import logo from "../assets/Logo.png"; 

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__divider"></div>

        <div className="footer__top">
          <div className="footer__left"></div>

          {/* Footer invite, privacy policy and terms & condition removed for now, use it in future if required (CSS is ready) */}
          {/* <div className="footer__right">
            <a href="#invite" className="footer__button">
              Request Invite
            </a>

            <a href="#" className="footer__link">
              Terms & Conditions
            </a>

            <a href="#" className="footer__link">
              Privacy policy
            </a>
          </div> */}
        </div>

        <div className="footer__bottom">
          <img src={logo} alt="Honestly Logo" className="footer__logo" />
        </div>

      </div>
    </footer>
  );
}