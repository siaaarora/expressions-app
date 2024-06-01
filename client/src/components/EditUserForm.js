import React, { useEffect, useState } from 'react';
import './EditUserForm.css';
import axios from 'axios';


function EditUserForm() {
    const userId = localStorage.getItem('user');
    const [dob, setDob] = useState()
    const [name, setName] = useState()

    function parseAge(dob) {
        var today = new Date();
        var birthDate = new Date(dob);
        var age = today.getFullYear()-birthDate.getFullYear();
        var m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        return age;
      }
    

    const handleSubmit = async(e) => {
        e.preventDefault();

        if (isNaN(Date.parse(dob))) {
            alert('Invalid DOB');
            return;
        }

        const age = parseAge(dob);
        
        try {
          const response = await axios.patch(`http://localhost:8000/edit/${userId}`, {
            name: name,
            age: age
          });

          console.log('Successfully edited the user!', response.data);

          window.location.href = `/profile`;

        } catch (error) {
          console.error('Error during user update', error);
        }
      };

    useEffect(() => {
        async function fetchUserData() {
            try {
                const response = await axios.get(`http://localhost:8000/user/${userId}`);
                setName(response.data.name);
            } catch (error) {
                console.error(error);
            }
        }
        fetchUserData();
    }, []);
    

    return (
        <div className="edit-user-container">
          <h1>Edit User</h1>
          <form onSubmit={handleSubmit}>
            <label>
                Name
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}></input>
            </label>
            <label>
                Date of birth (mm/dd/yy)
                <input type="text" value={dob} onChange={(e) => setDob(e.target.value)}></input>
            </label>
            <button type="submit" className="submit-button">submit</button>
          </form>
        </div>
    )
}

export default EditUserForm;