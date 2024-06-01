import React, { useState } from 'react';
import './CreateEventForm.css';
import axios from 'axios';
import { Toaster, toast } from 'sonner'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons';

function CreateOrgForm() {
  const userId = localStorage.getItem('user');

  const [orgData, setOrgData] = useState({
    createdBy: userId,
    name: '',
    shorthand: '',
    bio: '',
    email: '',
    twitter: '',
    discord: '',
    phoneNumber: '',
    orgImg: '',
    bannerImg: ''
  });

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (files && name === 'orgImg') {
      setOrgData(prevOrgData => ({ ...prevOrgData, orgImg: files[0] }));
    } else if (files && name === 'bannerImg') {
      setOrgData(prevOrgData => ({ ...prevOrgData, bannerImg: files[0] }));
    } else {
      setOrgData(prevOrgData => ({ ...prevOrgData, [name]: value }));
    }
    console.log(orgData);
  };
  
  const handleSubmit = async(e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(orgData).forEach(key => {
      formData.append(key, orgData[key]);
    });
    
    try {
      const response = await axios.post('http://localhost:8000/orgs/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
  
      toast.success('Org created successfully!', {
        action: {
          label: 'View',
          onClick: () => window.location.href = '/org/' + response.data
        }
      });
      console.log('Successfully created the org!', response.data);
    } catch (error) {
      console.error('Error during org creation', error);
    }
  };
  
  return (
    <div className="create-event-form-container">
      <Toaster richColors position="top-center"/>
      <h1>Create Organization</h1>
      <form onSubmit={handleSubmit}>
        <label>
          organization name <FontAwesomeIcon icon={faCircleExclamation} className='required-icon'/>
          <input
            type="text"
            name="name"
            value={orgData.name}
            onChange={handleInputChange}
            required
          />
        </label>
        <label>
          shorthand <FontAwesomeIcon icon={faCircleExclamation} className='required-icon'/>
          <input
            type="text"
            name="shorthand"
            value={orgData.shorthand}
            onChange={handleInputChange}
            required
          />
        </label>
        <label>
          bio <FontAwesomeIcon icon={faCircleExclamation} className='required-icon'/>
          <textarea
            name="bio"
            value={orgData.bio}
            onChange={handleInputChange}
            required
          />
        </label>
        <label>
          email <FontAwesomeIcon icon={faCircleExclamation} className='required-icon'/>
          <input
            type="text"
            name="email"
            value={orgData.email}
            onChange={handleInputChange}
            required
          />
        </label>
        <label>
          twitter (optional)
          <input
            type="text"
            name="twitter"
            value={orgData.twitter}
            onChange={handleInputChange}
          />
        </label>
        <label>
          discord (optional)
          <input
            type="text"
            name="discord"
            value={orgData.discord}
            onChange={handleInputChange}
          />
        </label>
        <label>
          phone number (optional)
          <input
            type="text"
            name="phoneNumber"
            value={orgData.phoneNumber}
            onChange={handleInputChange}
          />
        </label>
        <label>
          organization picture <FontAwesomeIcon icon={faCircleExclamation} className='required-icon'/>
          <input
            type="file"
            name="orgImg"
            onChange={handleInputChange}
            accept="image/*"
          />
        </label>
        <label>
          organization banner <FontAwesomeIcon icon={faCircleExclamation} className='required-icon'/>
          <input
            type="file"
            name="bannerImg"
            onChange={handleInputChange}
            accept="image/*"
          />
        </label>
        <button type="submit" className="submit-button">submit</button>
      </form>
    </div>
  );
}

export default CreateOrgForm;