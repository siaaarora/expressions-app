import React, { useState, useEffect } from 'react';
import axios from 'axios';
import OrgCard from './OrgCard';
import './Orgs.css';

function Orgs() {
  const [orgs, setOrgs] = useState([]);

  useEffect(() => {
    async function fetchOrgs() {
      try {
        const response = await axios.get('http://localhost:8000/orgs');
        console.log(response.data)
        setOrgs(response.data);
      } catch (error) {
        console.error('Error fetching orgs:', error);
      }
    }
    fetchOrgs();
  }, []);

  return (
    <div className="orgs-outer-container">
      <div className="orgs-inner-container">
        {orgs.map(org => (
          <OrgCard key={org._id} org={org} />
        ))}
      </div>
    </div>
  );
}

export default Orgs;
