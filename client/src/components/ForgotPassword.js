import React, { useState } from 'react';
import axios from 'axios';
import './Login.css'

function ForgotPassword() {
  const [email, setEmail] = useState('');

  const handleForgot = async () => {
    if (!email) {
      alert('Please fill email field');
      return;
    }

    try {
      alert('Link sent');
      const response = await axios.post('http://localhost:8000/forgotPassword', { email });
      setEmail('');
    } catch (error) {
      console.error('Error sending reset link:', error);
      alert('Failed to send reset link. Please try again later.');
    }
  };

  return (
    <div className="login-container">
      <h1>Forgot Password</h1>
      <div>
        <label>email</label>
        <input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <button className='google-button' onClick={handleForgot} >Send reset link</button>
    </div>
  );
}

export default ForgotPassword;
