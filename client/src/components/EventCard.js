import React from 'react';
import './EventCard.css';
import { Link } from 'react-router-dom';

function EventCard({ event }) {
  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const isNewEvent = (eventStartDatetime) => {
    const eventDate = new Date(eventStartDatetime);
    const now = new Date();
    const hoursDiff = (now - eventDate) / (1000 * 60 * 60);
    return hoursDiff <= 24;
};

  return (
    <div className={`event-card ${new Date(event.eventStartDatetime) < new Date() ? "pastEventList" : "futureEventList"}`}>
      {event.images && event.images.length > 0 && (
        <img src={`http://localhost:8000/${event.images[0]}`} alt={event.title} className="event-card-image" />
      )}
      <div className="event-card-content">
        <div className="event-card-header">
          <h3 className="event-card-title">{event.title}</h3>
          <div>
            {new Date(event.eventStartDatetime) < new Date() && <span>Event Passed</span>}
            {isNewEvent(event.createdDatetime) && <span className="new-event-indicator-list">🔥</span>}
          </div>
        </div>
        <p className="event-card-description">{event.description}</p>
        <div className="event-card-details">
          <span className="event-card-category">{event.category}</span>
          <span className="event-card-location">{event.location}</span>
        </div>
        <div className="event-card-timing">
          <span>{formatDate(event.eventStartDatetime)} -</span>
          <span>{formatDate(event.eventEndDatetime)}</span>
        </div>
        <div className="event-card-footer">
          <span className="event-card-capacity">Capacity: {event.capacity}</span>
          <span className="event-card-interested">{event.usersInterested.length} interested</span>
          {event.ageRequirement && <span className="event-card-age">Age: {event.ageRequirement}+</span>}
        </div>
        <Link to={`/event/${event._id}`} className="event-card-link">Learn more</Link>
      </div>
    </div>
  );
}

export default EventCard;
