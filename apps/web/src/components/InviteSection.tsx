import { useState } from "react";
import "../styles/InviteSection.css";
import InviteImage from "../assets/Invitation-Card.jpg";

export default function InviteSection() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    // Form submission logic to be added 
  };

  return (
    <section id="invite" className="invite-section">
      <div className="invite-container">
        {/* Left Side - Image */}
        <div className="invite-left">
          <img
            src={InviteImage}
            alt="Invitation"
            className="invite-image"
          />
        </div>

        {/* Right Side - Form */}
        <div className="invite-right">
          <div className="invite-content">
            <h2 className="invite-heading">
              Honestly is an <br></br>
              <span className="invite-highlight"> invite-only</span> platform.
            </h2>

            <p className="invite-subtext">
              Access is shared through existing members.
            </p>

            <form className="invite-form" onSubmit={handleSubmit}>
              {/* Name Field */}
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder=""
                  className="form-input"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Phone Field */}
              <div className="form-group">
                <label className="form-label">Phone number</label>
                <input
                  type="tel"
                  name="phone"
                  placeholder=""
                  className="form-input"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Email Field */}
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder=""
                  className="form-input"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Submit Button */}
              <button type="submit" className="invite-button">
                Request Invite
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}