import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PostCard from './PostCard';
import './Posts.css';

function Posts() {
  const [posts, setPosts] = useState([]);
  const [sortOption, setSortOption] = useState('mostRecent');

  useEffect(() => {
    async function fetchPosts() {
      try {
        const response = await axios.get('http://localhost:8000/posts');
        const sortedPosts = sortPosts(response.data, sortOption);
        setPosts(sortedPosts);
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    }
    fetchPosts();
  }, [sortOption]);

  const sortPosts = (posts, option) => {
    return posts.sort((a, b) => {
      const dateA = new Date(a.postedDatetime);
      const dateB = new Date(b.postedDatetime);
      return option === 'soon' ? dateB - dateA : dateA - dateB;
    });
  };

  const handleSortChange = (event) => {
    setSortOption(event.target.value);
  };

  return (
    <div className="posts-outer-container">
      <div className="sort-options">
        <label>Sort by:</label>
        <select onChange={handleSortChange} value={sortOption}>
          <option value="mostRecent">Most Recent</option>
          <option value="oldest">Latest</option>
        </select>
      </div>
      <div className="posts-inner-container">
        {posts.map(post => (
          <PostCard key={post._id} post={post} />
        ))}
      </div>
    </div>
  );
}

export default Posts;
