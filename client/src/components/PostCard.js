import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import './PostCard.css';

function PostCard({ post }) {
  const formattedDate = formatDistanceToNow(new Date(post.postedDatetime), { addSuffix: true }).replace('about ', '');

  return (
    <Link className='post-link' key={post._id} to={`/post/${post.postId}`}>
      <div className="post-card-container">
        {/* <img className="post-pfp" src={post.profilePicture} alt="Profile" /> */}
        <div className="post-card-columns">
          <div className="post-card-column-1">
            <span className="post-card-title">{post.title}</span>
            <span className="post-card-content">{post.content}</span>
          </div>
          <div className="post-card-column-2">
            <span className="post-card-date">{formattedDate}</span>
            {/* <div className="post-card-icons">
              <span className="post-card-heart">&#x2764;</span>
              <span className="post-card-comment-bubble">&#x1f5e9;</span>
            </div> */}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default PostCard;
