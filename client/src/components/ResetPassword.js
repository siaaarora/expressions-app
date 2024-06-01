import React, { useState } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('')

    const token = searchParams.get('token');
    const email = searchParams.get('email');

    const handleReset = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setMessage('Passwords do not match.');
            return;
        }

        try {
            await axios.post('http://localhost:8000/reset-password', { email, password, token });
            setMessage('Password has been successfully reset.');
            navigate('/login');
        } catch (error) {
            setMessage('Failed to reset password.');
            console.error('Reset password error:', error);
        }
    };

    return (
        <div className="login-container">
            <h1>Reset Password</h1>
            <div>
                <label>new password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <label>confirm password</label>
                <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
            </div>
            <button className='google-button' onClick={handleReset} >Reset Password</button>
        </div>
    );
}

export default ResetPassword;
