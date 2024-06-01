import React from 'react';
import './OrgCard.css';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar as solidStar } from '@fortawesome/free-solid-svg-icons';
import { faStar as regularStar } from '@fortawesome/free-regular-svg-icons';

function OrgCard({ org }) {
    const navigate = useNavigate();
    const handleClick = () => {
        navigate(`/org/${org._id}`);
    };

    var averageRating = 0;

    if (org.ratings.length > 0) {
        const totalRating = org.ratings.reduce((acc, curr) => acc + curr.value, 0);
        averageRating = totalRating / org.ratings.length;
    } else {
        averageRating = 0
    }
    return (
        <div className="org-card-container" onClick={handleClick}>
            <img src={org.bannerImg} alt={`${org.name} Banner`} className="org-banner" />
            <div className="org-content">
                <div className="org-header">
                    <img src={org.orgImg} alt={`${org.name} Logo`} className="org-logo" />
                    <h3 className="org-name">{org.name}</h3>
                    <p className="org-shorthand">{org.shorthand}</p>
                </div>
                <div className='bio-rating-container'>
                    <p className="org-bio">{org.bio}</p>
                    <div className='average-container-card'>
                        {[...Array(Number.isInteger(averageRating) ? Math.round(averageRating) : Math.max(0, Math.floor(averageRating)))].map((_, index) => (
                            <FontAwesomeIcon key={index} icon={solidStar} className="star filled" />
                        ))}
                        {!Number.isInteger(averageRating) && <div className="partialStarCard" style={{"--rating": (((averageRating % 1) * 62) + 19) + "%"}}>
                            <FontAwesomeIcon icon={regularStar} className="star"/>
                        </div>}
                        {[...Array(5 - Math.ceil(averageRating))].map((_, index) => (
                            <FontAwesomeIcon key={index} icon={regularStar} className="star" />
                        ))}
                        <span className="average-rating">({averageRating.toFixed(1)})</span>
                    </div>
                </div>
                <div className="org-footer">
                    <span className="org-last-active">Last active: {new Date(org.lastActive).toLocaleDateString()}</span>
                    <span className="org-followers-count">Followers: {org.followers.length}</span>
                </div>
            </div>
        </div>
    );
}

export default OrgCard;
