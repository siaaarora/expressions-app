import React, { useState } from 'react';
import axios from 'axios';
import './Login.css'
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner'

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Please fill in all fields');
      return;
    }
  
    try {
      const response = await axios.post('http://localhost:8000/login', {
        email,
        password
      });
      console.log('Login response:', response.data);
  
      if (response.data) {
        localStorage.setItem('user', response.data.userId);
        localStorage.setItem('name', response.data.name);
        setEmail('');
        setPassword('');
        toast.success('Login successful!')
        navigate('/profile');
      } else {
        toast.error('Incorrect email or password.');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      toast.error('Login failed. Please try again.')
    }
  };

  const handleGoogleLogin = async () => {
    try {
      window.open('http://localhost:8000/auth/google');
    } catch (error) {
      console.error('Error initiating Google login:', error);
    }
  };

  const handleSignUpRedirect = () => {
    window.location.href = '/signup';
  };

  return (
    <div className="login-container">
      <Toaster richColors position="top-center"/>
      <h1>Log In</h1>
      <div>
        <label>email</label>
        <input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label>password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <a href='/forgot-password'>forgot password</a>
      <button className='google-button' onClick={handleGoogleLogin}>Sign in with Google</button>
      <div className='login-buttons-container'>
        <button className='login-button' onClick={handleLogin}>login</button>
        <button className='sign-up-button' onClick={handleSignUpRedirect}>sign up</button>
      </div>
    </div>
  );
}

export default Login;
