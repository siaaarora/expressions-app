import React, { useEffect, useState } from 'react';
import './CreateEventForm.css';
import axios from 'axios';
import { Toaster, toast } from 'sonner'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons';

function CreateEventForm() {
  const userId = localStorage.getItem('user');
  const userName = localStorage.getItem('name');

  const [orgs, setOrgs] = useState([])

  useEffect(() => {
    async function fetchOrgs() {
      try {
        const orgResponse = await axios.get(`http://localhost:8000/orgs/owner/${userId}`);
        console.log(orgResponse.data)
        setOrgs(orgResponse.data);
      } catch (error) {
        console.log(error);
      }
    }
    fetchOrgs();
  }, []);

  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    eventStartDatetime: '',
    eventEndDatetime: '',
    category: 'Academic',
    location: '',
    capacity: 1,
    visibility: "Public",
    ageRequirement: 0,
    createdBy: userId,
    createdByName: userName,
    usersInterested: [],
    usersInterestedNames: [],
    images: [],
    ageRequirement: 0,
    belongsToOrg: ''
  });

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "belongsToOrg") {
      setEventData({ ...eventData, [name]: value });
    } else if (files) {
      setEventData({ ...eventData, images: [...files] });
    } else {
      setEventData({ ...eventData, [name]: value });
    }
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(eventData).forEach(key => {
      if (key === 'images') {
        [...eventData.images].forEach(file => {
          formData.append('images', file);
        });
      } else if (Array.isArray(eventData[key]) || typeof eventData[key] === 'object') {
        formData.append(key, JSON.stringify(eventData[key]));
      } else {
        formData.append(key, eventData[key]);
      }
    });
    
    try {
      const response = await axios.post('http://localhost:8000/events/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Event created successfully!', {
        action: {
          label: 'Undo',
          onClick: () => window.location.href = '/events'
        }
      })
      console.log('Successfully created the event', response.data);
    } catch (error) {
      console.error('Error during event creation', error);
    }
  };

  return (
    <div className="create-event-form-container">
      <Toaster richColors position="top-center"/>
      <h1>Create Event</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Event Title <FontAwesomeIcon icon={faCircleExclamation} className='required-icon'/>
          <input
            type="text"
            name="title"
            value={eventData.title}
            onChange={handleInputChange}
            required
          />
        </label>
        <label>
          Description <FontAwesomeIcon icon={faCircleExclamation} className='required-icon'/>
          <textarea
            name="description"
            value={eventData.description}
            onChange={handleInputChange}
            required
          />
        </label>
        <label>
          Age Requirement
          <input
            type="number"
            name="ageRequirement"
            min="0"
            autocomplete="off"
            value={eventData.ageRequirement}
            onChange={handleInputChange}
          />
        </label>
        <label>
          Start Date <FontAwesomeIcon icon={faCircleExclamation} className='required-icon'/>
          <input
            type="datetime-local"
            name="eventStartDatetime"
            value={eventData.eventStartDatetime}
            onChange={handleInputChange}
            required
          />
        </label>
        <label>
          End Date <FontAwesomeIcon icon={faCircleExclamation} className='required-icon'/>
          <input
            type="datetime-local"
            name="eventEndDatetime"
            value={eventData.eventEndDatetime}
            onChange={handleInputChange}
            required
          />
        </label>
        <label>
          Location <FontAwesomeIcon icon={faCircleExclamation} className='required-icon'/>
          <input
            type="text"
            name="location"
            autocomplete="off"
            value={eventData.location}
            onChange={handleInputChange}
            required
          />
        </label>
        <label>
          Event Image
          <input
            type="file"
            name="images"
            onChange={handleInputChange}
            multiple
            accept="image/*"
          />
        </label>
        <div className='last-row-container'>
          <div className='category-container'>
            Category
            <label>
              <input
                type="radio"
                name="category"
                value="Academic"
                checked={eventData.category === 'Academic'}
                onChange={handleInputChange}
              />
              Academic
            </label>
            <label>
              <input
                type="radio"
                name="category"
                value="Social"
                checked={eventData.category === 'Social'}
                onChange={handleInputChange}
              />
              Social
            </label>
            <label>
              <input
                type="radio"
                name="category"
                value="Other"
                checked={eventData.category === 'Other'}
                onChange={handleInputChange}
              />
              Other
            </label>
          </div>
          <div className='category-container'>
            Capacity
            <label>
              <input
                type="number"
                name="capacity"
                min="1"
                value={eventData.capacity}
                onChange={handleInputChange}
              />
            </label>
          </div>
          <div className='category-container'>
            Visibility
            <label>
              <input
                type="radio"
                name="visibility"
                value="Public"
                checked={eventData.visibility === 'Public'}
                onChange={handleInputChange}
              />
              Public
            </label>
            <label>
              <input
                type="radio"
                name="visibility"
                value="Private"
                checked={eventData.visibility === 'Private'}
                onChange={handleInputChange}
              />
              Private
            </label>
          </div>
          <label>
            Assign to Organization: <FontAwesomeIcon icon={faCircleExclamation} className='required-icon'/>
            <select
              name="belongsToOrg"
              value={eventData.belongsToOrg}
              onChange={handleInputChange}
              required
            >
              <option value="">Select an Organization</option>
              {orgs.map((org) => (
                <option key={org._id} value={org._id}>{org.name}</option>
              ))}
            </select>
          </label>
        </div>
        
        <button type="submit" className="submit-button">submit</button>
      </form>
    </div>
  );
}

export default CreateEventForm;
