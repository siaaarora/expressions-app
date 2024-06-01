import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import './Org.css'
import { Toaster, toast } from 'sonner'
import PostCard from './PostCard';
import EventCard from './EventCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar as solidStar } from '@fortawesome/free-solid-svg-icons';
import { faLink } from '@fortawesome/free-solid-svg-icons';
import { faStar as regularStar } from '@fortawesome/free-regular-svg-icons';

function Org() {
  const { id } = useParams();
  const [orgData, setOrgData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [usersFollowed, setUsersFollowed] = useState([])
  const [hasFollowed, setHasFollowed] = useState(false);
  const [orgPosts, setOrgPosts] = useState([])
  const currentUserFromStorage = localStorage.getItem('user');
  const currentUser = currentUserFromStorage ? localStorage.getItem('user') : null;
  const currentUserNameFromStorage = localStorage.getItem('name');
  const currentUserName = currentUserNameFromStorage ? localStorage.getItem('name') : null;
  const [showReportBox, setShowReportBox] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [orgEvents, setOrgEvents] = useState([])
  const [ratings, setRatings] = useState([])
  const [rating, setRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);

  const fetchOrg = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/orgs/${id}`);
      console.log(response.data)

      const { followers, events, ratings } = response.data;

      setOrgData(response.data);
      setUsersFollowed(followers)
      setOrgEvents(events)
      setRatings(ratings)

      if (ratings.length > 0) {
        const totalRating = ratings.reduce((acc, curr) => acc + curr.value, 0);
        const average = totalRating / ratings.length;
        setAverageRating(average);
      } else {
        setAverageRating(0)
      }


      const userRating = ratings.find(rating => rating.ratedBy === currentUser);
      if (userRating) {
        setRating(userRating.value);
      }

      const isFollowing = followers.some(user => user.userId === currentUser);
      setHasFollowed(isFollowing);

      const postsResponse = await axios.get(`http://localhost:8000/posts/orgPosts/${id}`);
      setOrgPosts(postsResponse.data)

      setIsLoading(false);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrg();
  }, [id]);

  const copyUrlToClipboard = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url)
      .then(() => {
        toast.success("URL copied to clipboard!");
      })
      .catch((error) => {
        console.error('Failed to copy URL to clipboard:', error);
        toast.error('Failed to copy URL to clipboard.');
      });
  };

  const handleFollow = async () => {
    try {
      const response = await axios.patch(`http://localhost:8000/orgs/follow/${id}/${currentUser}`);

      setUsersFollowed(prevUsers => [...prevUsers, { userId: currentUser, name: currentUserName }]);
      setHasFollowed(true);

      toast.success("Successfully followed org!")
    } catch (error) {
      toast.error('Error following org.');
    }
  }

  const handleUnfollow = async () => {
    try {
      const response = await axios.patch(`http://localhost:8000/orgs/unfollow/${id}/${currentUser}`);

      setUsersFollowed(prevUsers => prevUsers.filter(userId => userId !== currentUser));
      setHasFollowed(false);

      toast.success("Successfully unfollowed org.");
    } catch (error) {
      toast.error('Error unregistering from event.');
    }
  };

  const handleReport = () => {
    setShowReportBox(!showReportBox);
  };

  const handleChange = (event) => {
    setReportContent(event.target.value);
  };

  const handleReportSubmit = async () => {
    try {
      const url = `http://localhost:8000/reportOrg/${currentUser}/${id}`;

      const response = await axios.post(url, { reason: reportContent });

      toast.success("Successfully submitted report.");

      setReportContent('');
      setShowReportBox(!showReportBox);

    } catch (error) {
      toast.error('Error in submitting report.');
    }
  };

  const handleRateOrg = async (value) => {
    try {
      const response = await axios.patch(`http://localhost:8000/orgs/rate/${id}/${currentUser}`, { value: value });
  
      const updatedRatings = [...ratings];
      const currentUserRatingIndex = updatedRatings.findIndex((rating) => rating.ratedBy === currentUser);
      if (currentUserRatingIndex !== -1) {
        updatedRatings[currentUserRatingIndex].value = value;
      } else {
        updatedRatings.push({ ratedBy: currentUser, value: value });
      }
  
      const newTotalRating = updatedRatings.reduce((sum, rating) => sum + rating.value, 0);
      const newAverageRating = updatedRatings.length > 0 ? newTotalRating / updatedRatings.length : 0;
  
      setRatings(updatedRatings);
      setAverageRating(newAverageRating);
      setRating(value);
  
      toast.success("Successfully rated!")
    } catch (error) {
      console.error('Error rating org:', error);
    }
  };

  const handleUnrateOrg = async () => {
    try {
      await axios.patch(`http://localhost:8000/orgs/unrate/${id}/${currentUser}`);
      setRating(0);
  
      const updatedRatings = ratings.filter(rating => rating.ratedBy !== currentUser);

      const totalRatings = updatedRatings.length;
      const sumOfRatings = updatedRatings.reduce((acc, rating) => acc + rating.value, 0);
      const newAverageRating = totalRatings > 0 ? sumOfRatings / totalRatings : 0;

      setAverageRating(newAverageRating);
  
      toast.success("Successfully unrated!")
    } catch (error) {
      console.error('Error unrated organization:', error);
    }
  };
  

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className='org-page-outer-container'>
      <Toaster richColors position="top-center"/>
      {orgData.bannerImg && <img src={orgData.bannerImg} alt="Banner Image" className='org-banner' />}
      <div className='org-page-inner-container'>
        <div className='org-images'>
          {orgData.orgImg && <img src={orgData.orgImg} alt="Organization Image" id='org-pfp' />}
        </div>
        <div className='org-text-container'>
          <div className='org-text'>
            <div className='name-average-container'>
              <span id='org-name'>{orgData.name}</span>
              <div className='average-container'>
                {[...Array(Number.isInteger(averageRating) ? Math.round(averageRating) : Math.max(0, Math.floor(averageRating)))].map((_, index) => (
                  <FontAwesomeIcon key={index} icon={solidStar} className="star filled" />
                ))}
                {!Number.isInteger(averageRating) && <div className="partialStar" style={{"--rating": (((averageRating % 1) * 66) + 17) + "%"}}>
                  <FontAwesomeIcon icon={regularStar} className="star"/>
                </div>}
                {[...Array(5 - Math.ceil(averageRating))].map((_, index) => (
                  <FontAwesomeIcon key={index} icon={regularStar} className="star" />
                ))}
                <span className="average-rating">({averageRating.toFixed(1)})</span>
              </div>
            </div>
            <span id='org-bio'>{orgData.bio}</span>
          </div>
          <div>
            {currentUser ? (
              <>
                {hasFollowed ? (
                  <>
                    <button className="event-join-button-disabled" disabled>Followed</button>
                    <button className="event-unregister-button" onClick={handleUnfollow}>Unfollow</button>
                  </>
                ) : (
                  <button className="event-join-button" onClick={handleFollow}>Follow</button>
                )}
                <button className="org-share-button" onClick={copyUrlToClipboard}><FontAwesomeIcon icon={faLink}/></button>
                <button className="org-report-button" onClick={handleReport}>Report</button>
                <div className='user-rating-container'>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <FontAwesomeIcon
                      key={value}
                      icon={value <= rating ? solidStar : regularStar}
                      className={value <= rating ? "star filled" : "star"}
                      onClick={() => handleRateOrg(value)}
                    />
                  ))}
                  <button className="unrate-button" onClick={handleUnrateOrg}>Unrate</button>
                </div>
              </>
            ) : (
              <button className="event-join-button-disabled" disabled>Log in to follow</button>
            )}
            
          </div>
        </div>
        {showReportBox && (
          <div className="report-box">
            <textarea
              value={reportContent}
              onChange={handleChange}
              rows={6}
              cols={50}
              placeholder="Enter report reason..."
            />
            <div className="report-content">
              <button 
                disabled={reportContent.trim() === ''} 
                className={reportContent.trim() === '' ? 'report-box-disabled-button' : 'report-box-enabled-button'} 
                onClick={handleReportSubmit}>
                  Submit
              </button>
            </div>
          </div>
        )}
        {currentUser && hasFollowed ? (
          <div className='updates-container'>
            <h2>Updates:</h2>
            <div className="org-posts-container">
              {orgPosts.length ? orgPosts.map(post => (
                <PostCard key={post._id} post={post} />
              )) : <p>No updates</p>}
            </div>
          </div>
        ) : (
          <></>
        )}
        <div className='updates-container'>
          <h2>Events:</h2>
          {orgEvents ? orgEvents.map((event, idx) => (
            <EventCard key={event._id} event={event} />
          )) : <div className='no-orgs-text'>There are no events to display.</div>}
        </div>

        <div className='updates-container'>
          <h2>Members:</h2>
          {usersFollowed ? usersFollowed.map((follower, idx) => (
            <p>{follower.name}</p>
          )) : <div className='no-orgs-text'>There are no members.</div>}
        </div>
        
        {/* <input type="file" accept="image/*" onChange={handleOrgImgClick} />
        <input type="file" accept="image/*" onChange={handleBannerImgClick} /> */}
      </div>
    </div>
  );
}

export default Org;
