import React, { useState, useEffect } from 'react';
import Users from './images/users.png'
import Orgs from './images/org.png'
import Event from './images/event.png'
import axios from 'axios';
import './About.css'


function About() {
    const [userCount, setUserCount] = useState([]);
    const [avgFollowingOrgs, setAvgFollowingOrgs] = useState([]);
    const [eventCount, setEventCount] = useState([]);
    const [orgCount, setOrgCount] = useState([]);
    const [averageFollowerCount, setAverageFollowerCount] = useState([]);
    const [postCount, setPostCount] = useState([]);
    const [academicCount, setAcademicCount] = useState([]);
    const [socialCount, setSocialCount] = useState([]);
    const [otherCount, setOtherCount] = useState([]);
    const [futureCount, setFutureCount] = useState([]);
    const [pastCount, setPastCount] = useState([]);

    useEffect(() => {
        async function fetchStats() {
            try {
                const response = await axios.get('http://localhost:8000/stats');
                const data = await response.data;
                setEventCount(data.events.totalEventCnt);
                setAvgFollowingOrgs(data.users.avgFollowingOrgsCnt);
                setUserCount(data.users.totalUserCnt);
                setOrgCount(data.orgs.totalOrgCnt);
                setAverageFollowerCount(data.orgs.avgFollowerCnt);
                setPostCount(data.users.totalPostCnt);
                setAcademicCount(data.events.academicCnt);
                setSocialCount(data.events.socialCnt);
                setOtherCount(data.events.otherCnt);
                setFutureCount(data.events.futureCnt);
                setPastCount(data.events.pastCnt);
            } catch (error) {
                console.error(error);
            }
        };
        fetchStats();
    }, []);


    return (
      <div>
        <br />
        <br />
        <h4>
            ASU students and event organizers today often struggle to discover and seamlessly organize events respectively, leading to scheduling conflicts and missed opportunities for campus/club engagement. The existing method for event coordination (ASUEvents) is often overlooked as it is rudimentary, very unintuitive to use, and lacks many trending features that would allow for seamless communication between organizers and attendees. 
        </h4>
        <h4>
            To solve this huge need for sundevils, we want to bring to life an application that, unlike ASUEvents, will incorporate features like a real-time feed of events in and around ASU, instant updates and notification by organizers to their respective events, as well as interaction with event feeds in the form of likes and comments. Furthermore, we will develop a fully functional calendar view of all events on campus with their respective details (time, location, host, etc.), allowing for a simple and seamless user experience.
        </h4>

        <br />

        <div className='stats-container'>
          <div className='individual-stat-container'>
          <img id="events" src={Event} alt="event img" />
            <span>{eventCount} Events</span>
            <br />
            <span>{Math.floor((postCount*10)/eventCount)/10} average posts per event</span>
            <br />
            <span>{academicCount} "Academic" Events</span>
            <br />
            <span>{socialCount} "Social" Events</span>
            <br />
            <span>{otherCount} "Other" Events</span>
            <br />
            <span>{futureCount} Future Events</span>
            <br />
            <span>{pastCount} Past Events</span>
          </div>
          <div className='individual-stat-container'>
            <img id="users" src={Users} alt="users img" />
            <span>{userCount} Users</span>
            <br />
            <span>{postCount} total user posts</span>
            <br />
            <span>{Math.floor(avgFollowingOrgs)} average orgs followed by a user</span>
          </div>
          <div className='individual-stat-container'>
            <img id="orgs" src={Orgs} alt="org img" />
            <span>{orgCount} Organizations</span>
            <br />
            <span>{Math.floor((eventCount*10)/orgCount)/10} average events per org</span>
            <br />
            <span>{Math.floor(averageFollowerCount)} average followers per org</span>
          </div>
        </div>
      </div>
    )
}

export default About