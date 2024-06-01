import React, { useEffect, useState } from 'react';
import './CreateEventForm.css';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Toaster, toast } from 'sonner'

function EditOrgForm() {
  const { id } = useParams();
  const userId = localStorage.getItem('user');

  const [orgData, setOrgData] = useState({
    name: '',
    shorthand: '',
    bio: '',
    email: '',
    owner: '',
    contactInfo: {
      twitter: '',
      discord: '',
      phoneNumber: ''
    },
    orgImg: null,
    bannerImg: null
  });

  useEffect(() => {
    async function fetchOrg() {
      try {
        const response = await axios.get(`http://localhost:8000/orgs/${id}`);
        console.log(response.data);

        const { name, shorthand, bio, owner, contactInfo, orgImg, bannerImg } = response.data;
       
        setOrgData({
          name,
          shorthand,
          bio,
          email: contactInfo.email,
          owner,
          contactInfo: {
            twitter: contactInfo.twitter,
            discord: contactInfo.discord,
            phoneNumber: contactInfo.phoneNumber
          },
          orgImg,
          bannerImg
        });
      } catch (error) {
        console.error(error);
      }
    }
    fetchOrg();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setOrgData({ ...orgData, [name]: value });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setOrgData({ ...orgData, [name]: files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(orgData).forEach(key => {
      formData.append(key, orgData[key]);
    });
    try {
      const response = await axios.patch(`http://localhost:8000/orgs/update/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Org updated successfully!', {
        action: {
          label: 'View',
          onClick: () => window.location.href = '/org/' + response.data
        }
      });      
      window.location.href = `/org/${id}`;
      console.log('Successfully updated the organization', response.data);
    } catch (error) {
      console.error('Error during organization update', error);
    }
  };
  

  const isOwner = orgData.owner === userId;

  return (
    <div className="create-event-form-container">
      <h1>Edit Organization</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Organization Name
          <input
            type="text"
            name="name"
            value={orgData.name}
            onChange={handleInputChange}
          />
        </label>
        <label>
          Shorthand
          <input
            type="text"
            name="shorthand"
            value={orgData.shorthand}
            onChange={handleInputChange}
          />
        </label>
        <label>
          Bio
          <textarea
            name="bio"
            value={orgData.bio}
            onChange={handleInputChange}
          />
        </label>
        <label>
          Email
          <input
            type="text"
            name="email"
            value={orgData.email}
            onChange={handleInputChange}
          />
        </label>
        <label>
          Twitter
          <input
            type="text"
            name="contactInfo.twitter"
            value={orgData.contactInfo.twitter}
            onChange={handleInputChange}
          />
        </label>
        <label>
          Discord
          <input
            type="text"
            name="contactInfo.discord"
            value={orgData.contactInfo.discord}
            onChange={handleInputChange}
          />
        </label>
        <label>
          Phone Number
          <input
            type="text"
            name="contactInfo.phoneNumber"
            value={orgData.contactInfo.phoneNumber}
            onChange={handleInputChange}
          />
        </label>
        <label>
          Organization Picture
          <input
            type="file"
            name="orgImg"
            accept="image/*"
            onChange={handleFileChange}
            />
          </label>
          <label>
            Organization Banner
            <input
              type="file"
              name="bannerImg"
              accept="image/*"
              onChange={handleFileChange}
            />
          </label>
          <button type="submit" className="submit-button" disabled={!isOwner}>
            Submit
          </button>
        </form>
      </div>
    );
  }
  
  export default EditOrgForm;
  
