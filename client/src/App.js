import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Posts from './components/Posts';
import Events from './components/Events';
import Orgs from './components/Orgs';
import Org from './components/Org';
import Navbar from './components/Navbar';
import CreateEventForm from './components/CreateEventForm';
import CreateOrgForm from './components/CreateOrgForm';
import CreatePostForm from './components/CreatePostForm';
import Event from './components/Event';
import Login from './components/Login';
import SignUp from './components/SignUp'
import Profile from './components/Profile';
import EditEventForm from './components/EditEventForm';
import EditOrgForm from './components/EditOrgForm';
import EditUserForm from './components/EditUserForm'
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword'
import About from './components/About';
import EventAnalytics from './components/EventAnalytics';
import Post from './components/Post'

const App = () => {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Posts />} />
        <Route path="/posts" element={<Posts />} />
        <Route path="/post/:id" element={<Post />} />
        <Route path="/create-post" element={<CreatePostForm />} />
        <Route path="/events" element={<Events />} />
        <Route path="/create-event" element={<CreateEventForm />} />
        <Route path="/create-org" element={<CreateOrgForm />} />
        <Route path="/orgs" element={<Orgs />} />
        <Route path="/org/:id" element={<Org />} />
        <Route exact path="/event/:id" element={<Event />} />
        <Route exact path="/edit-event/:id" element={<EditEventForm />} />
        <Route exact path="/edit-org/:id" element={<EditOrgForm />} />
        <Route exact path="/edit/:id" element={<EditUserForm />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/reset-password/:email/:token" element={<ResetPassword />} />
        <Route path="/about" element={<About />} />
        <Route path="/event-analytics/:id" element={<EventAnalytics />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
