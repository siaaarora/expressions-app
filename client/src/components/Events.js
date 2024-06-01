import React, {useState, useEffect} from 'react';
import './Events.css';
import EventCard from './EventCard';
import { Link } from 'react-router-dom';
import axios from 'axios'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faList, faSearch } from '@fortawesome/free-solid-svg-icons';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const categories = ['all', 'Social', 'Academic', 'Other'];

const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
};

const getLastDayOfMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDay();
};
    
const calculateEmptySlotsAfterLastDay = (lastDayOfWeek) => {
    return lastDayOfWeek === 6 ? 0 : 7 - lastDayOfWeek - 1;
};

function Events() {
    const currentDate = new Date();
    const [events, setEvents] = useState([])
    const [year, setYear] = useState(currentDate.getFullYear());
    const [month, setMonth] = useState(currentDate.getMonth());
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    const lastDayOfMonth = getLastDayOfMonth(year, month);
    const emptySlotsAfterLastDay = calculateEmptySlotsAfterLastDay(lastDayOfMonth);
    const emptySlotsAtStart = Array(firstDayOfMonth).fill(null);
    const daySlots = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const emptySlotsAtEnd = Array(emptySlotsAfterLastDay).fill(null);
    const userStr = localStorage.getItem('user');
    const [viewMode, setViewMode] = useState('calendar');
    const [filterKeywords, setFilterKeywords] = useState([]);
    const [sortOption, setSortOption] = useState('soon');
    const [hidePastEvents, setHidePastEvents] = useState(false);

    const handleMonthNext = () => {
        if (month === 11) {
            setMonth(0);
            setYear(year + 1);
        } else {
            setMonth(month + 1);
        }
    };

    const handleMonthPrev = () => {
        if (month === 0) {
            setMonth(11);
            setYear(year - 1);
        } else {
            setMonth(month - 1);
        }
    };

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
 
    const [eventsData, setEventsData] = useState({});
    const [selectedCategory, setSelectedCategory] = useState('all');
    
    const handleCategoryChange = (e) => {
        setSelectedCategory(e.target.value);
    };

    const isNewEvent = (eventStartDatetime) => {
        const eventDate = new Date(eventStartDatetime);
        const now = new Date();
        const hoursDiff = (now - eventDate) / (1000 * 60 * 60);
        return hoursDiff <= 24;
    };

    const handleEnterKeypress = (event) => {
        if (event.keyCode === 13) {
            event.preventDefault();
            filterEvents();
        }
    };

    const filterEvents = () => {
        const filterString = document.getElementById("filterTerms").value;

        let keywords = filterString.split(";").map(keyword => keyword.trim());
        setFilterKeywords(keywords);
    };

    const handleHidePastEvents = () => {
        setHidePastEvents(!hidePastEvents);
    };

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await axios.get('http://localhost:8000/events', {
                    params: { year: year, month: month }
                });
                const sortedEvents = sortEvents(response.data, sortOption);
                setEvents(sortedEvents);
                const eventsRes = response.data;
                const eventsMappedByDay = {};

                eventsRes.forEach(event => {
                    const dayOfMonth = new Date(event.eventStartDatetime).getDate();
                    if (!eventsMappedByDay[dayOfMonth]) {
                        eventsMappedByDay[dayOfMonth] = [];
                    }
                    eventsMappedByDay[dayOfMonth].push(event);
                });

                setEventsData(eventsMappedByDay);
            } catch (error) {
                console.error('Error fetching events', error);
            }
        };
        fetchEvents();
    }, [sortOption]);

    const handleSortChange = (event) => {
        setSortOption(event.target.value);
    };

    const sortEvents = (events, option) => {
        return events.sort((a, b) => {
          const dateA = new Date(a.eventStartDatetime);
          const dateB = new Date(b.eventStartDatetime);
          const dateC = new Date(a.createdDatetime);
          const dateD = new Date(b.createdDatetime);

          if (option === 'late') {
            return dateB - dateA;
          } else if (option === 'oldest') {
            return dateC - dateD;
          } else if (option === 'latest') {
            return dateD - dateC;
          } else {
            return dateA - dateB;
          }
        });
    };

    return (
        <div className="calendar-container">
            <div className='options-container'>    
                <div className="filter">
                    <div className="filter-text">Filter:</div>
                    <input type="text" className="filterTerms" id="filterTerms" placeholder="keyword1; keyword2; ..." onKeyDown={(e) => handleEnterKeypress(e)}></input>
                    <button type="submit" class="filterButton" onClick={filterEvents}>
                        <FontAwesomeIcon icon={faSearch} />
                    </button>
                </div>            
                <div className="filters">
                    {categories.map((category) => (
                        <label key={category}>
                            <input
                                type="radio"
                                name="category"
                                value={category}
                                checked={selectedCategory === category}
                                onChange={handleCategoryChange}
                            />
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                        </label>
                    ))}
                </div>
                {viewMode === 'list' ? (
                    <div className="sort-options">
                        <label>Sort by:</label>
                        <select onChange={handleSortChange} value={sortOption}>
                        <option value="soon">Soon</option>
                        <option value="late">Late</option>
                        <option value="oldest">Oldest</option>
                        <option value="latest">Latest</option>
                        </select>
                    </div>
                ) : (<></>)}
                <div className="hide-past-events">
                    <label>Hide Past Events:</label>
                    <>
                        <label className="switch" id="switch">
                            <input type="checkbox" onClick={handleHidePastEvents}></input>
                            <span className="slider"></span>
                        </label>
                    </>
                </div>
                <div className="view-mode-toggle">
                    <button className={`toggle-button ${viewMode === 'calendar' ? 'active' : ''}`} onClick={() => setViewMode('calendar')} >
                        <FontAwesomeIcon icon={faCalendar} />
                    </button>
                    <button className={`toggle-button ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} >
                        <FontAwesomeIcon icon={faList} />
                    </button>
                </div>
            </div>
            {viewMode === 'calendar' ? (
                <div className="month-view">
                    <div className="month-header">
                        <h2>{`${monthNames[month]} ${year}`}</h2>
                        <div className="month-navigation">
                            <button onClick={handleMonthPrev}>←</button>
                            <button onClick={handleMonthNext}>→</button>
                        </div>
                    </div>
                    <div className="days-of-week">
                        {daysOfWeek.map(day => (
                            <div key={day} className="week-day">{day}</div>
                        ))}
                    </div>
                    <div className="days-grid">
                        {console.log(eventsData)}
                        {emptySlotsAtStart.concat(daySlots).concat(emptySlotsAtEnd).map((day, index) => (
                            <div key={index} className={`day-cell ${(day === new Date().getDate() 
                                                                 && (month === new Date().getMonth())
                                                                 && (year === new Date().getFullYear())) ? "current-day" : ""}`}>
                                {day && <div className="day-number">{day}</div>}
                                {day && eventsData[day] && eventsData[day].filter((event) => (selectedCategory === 'all' || event.category === selectedCategory) 
                                                                                          && ((event.visibility === 'Public') || userStr)
                                                                                          && (filterKeywords.some(keyword => event.title.toLowerCase().includes(keyword.toLowerCase())) || !filterKeywords.length)
                                                                                          && (new Date(event.eventStartDatetime).getMonth() == month)
                                                                                          && (new Date(event.eventStartDatetime).getFullYear() == year)
                                                                                          && (!hidePastEvents || new Date(event.eventStartDatetime) >= new Date())).map((event, idx) => (
                                    <Link key={event._id} to={`/event/${event._id}`}>
                                        <div className={`event ${event.category} ${new Date(event.eventStartDatetime) < new Date() ? "pastEvent" : "futureEvent"}`}>
                                            {isNewEvent(event.createdDatetime) && <span className="new-event-indicator">🔥</span>}
                                            {event.title}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="list-view">
                    {console.log(events)}
                    {events.length ? events.filter((event) => (selectedCategory === 'all' || event.category === selectedCategory) 
                                                           && ((event.visibility === 'Public') || userStr) 
                                                           && ((filterKeywords.some(keyword => event.title.toLowerCase().includes(keyword.toLowerCase()))) || !filterKeywords.length)
                                                           && (!hidePastEvents || new Date(event.eventStartDatetime) >= new Date())).map((event, idx) => (
                        <EventCard key={event._id} event={event} />
                    )) : <div className='no-orgs-text'>There are no events to display.</div>}
                </div>
            )}
        </div>
    );
}

export default Events;
