import React from "react";
import "../../assets/css/SuccessOverlay.css"; // Import the CSS file for styling

const SuccessOverlay = ({ show, message, buttonText, onClose }) => {
  if (!show) return null;

  return (
    <div className="overlay">
      <div className="overlay-card">
        <h2>{message}</h2>
        <button onClick={onClose}>{buttonText}</button>
      </div>
    </div>
  );
};

export default SuccessOverlay;
