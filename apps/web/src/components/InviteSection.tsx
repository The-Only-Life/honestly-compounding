import { useState } from "react";
import "../styles/InviteSection.css";
import InviteImage from "../assets/Invitation-Card.jpg";
import { useJoinWaitlist } from "@/hooks/use-waitlist-api";

export default function InviteSection() {
  const joinWaitlist = useJoinWaitlist();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await joinWaitlist.mutateAsync({
        email: formData.email,
        name: formData.name,
        phone: formData.phone,
      });
      setSubmitted(true);
    } catch {
      // error toast handled inside the hook
    }
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
              Honestly is an <br />
              <span className="invite-highlight"> invite-only</span> platform.
            </h2>

            <p className="invite-subtext">
              Access is shared through existing members.
            </p>

            {submitted ? (
              <p className="invite-success">
                You're on the list! We'll be in touch soon.
              </p>
            ) : (
              <form className="invite-form" onSubmit={handleSubmit}>
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

                <button
                  type="submit"
                  className="invite-button"
                  disabled={joinWaitlist.isPending}
                >
                  {joinWaitlist.isPending ? "Submitting..." : "Request Invite"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
