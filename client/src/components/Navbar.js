import './Navbar.css';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUserInfo } from './authUtils';

function Navbar() {
  const [loggedIn, setLoggedIn] = useState(!!getUserInfo());

  useEffect(() => {
    setLoggedIn(!!getUserInfo());
  }, []);

  return (
    <nav className='nav'>
      <p><a href='/'>BoilerNow</a></p>
      <ul>
        <li><a href="/about">About</a></li>
        <li><a href="/posts">Posts</a></li>
        <li><a href="/events">Events</a></li>
        <li><a href="/orgs">Orgs</a></li>
      </ul>
      <div className='nav-buttons'>
        {loggedIn ? (
          <Link to="/profile"><button className="login">Profile</button></Link>
        ) : (
          <Link to="/login"><button className="login">Login</button></Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;