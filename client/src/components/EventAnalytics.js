import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import './EventAnalytics.css'

function EventAnalytics() {
    const { id } = useParams();
    const [category, setCategory] = useState("")
    const [commentCnt, setCommentCnt] = useState(0)
    const [imgCnt, setImgCnt] = useState(0)
    const [usedCapacityPct, setUsedCapacityPct] = useState("")
    const [usersInterestedCnt, setUsersInterestedCnt] = useState(0)
    const [visibility, setVisibility] = useState("")

    useEffect(() => {
        async function fetchEventData() {
          try {
              const response = await axios.get(`http://localhost:8000/stats/event/${id}`);
              console.log(response.data)
              const { category, commentCnt, imgCnt, usedCapacityPct, usersInterestedCnt, visibility } = response.data;

              setCategory(category)
              setCommentCnt(commentCnt)
              setImgCnt(imgCnt)
              setUsedCapacityPct(usedCapacityPct)
              setUsersInterestedCnt(usersInterestedCnt)
              setVisibility(visibility)
              
          } catch (error) {
            console.error(error);
          }
        }
        fetchEventData();
      }, [id]);
    return (
        <div className="event-analytics-container">
            <h2 className="event-analytics-title">Event Analytics</h2>
            <div className="event-analytics-details">
                <div className="analytics-detail-item">
                <span className="analytics-detail-label">Category:</span>
                <span className="analytics-detail-value">{category}</span>
                </div>
                <div className="analytics-detail-item">
                <span className="analytics-detail-label">Comments Count:</span>
                <span className="analytics-detail-value">{commentCnt}</span>
                </div>
                <div className="analytics-detail-item">
                <span className="analytics-detail-label">Images Count:</span>
                <span className="analytics-detail-value">{imgCnt}</span>
                </div>
                <div className="analytics-detail-item">
                <span className="analytics-detail-label">Interested Users:</span>
                <span className="analytics-detail-value">{usersInterestedCnt}</span>
                </div>
                <div className="analytics-detail-item">
                <span className="analytics-detail-label">Used Capacity Percentage:</span>
                <span className="analytics-detail-value">{usedCapacityPct}</span>
                </div>
                <div className="analytics-detail-item">
                <span className="analytics-detail-label">Visibility:</span>
                <span className="analytics-detail-value">{visibility}</span>
                </div>
            </div>
        </div>
    )
}

export default EventAnalytics