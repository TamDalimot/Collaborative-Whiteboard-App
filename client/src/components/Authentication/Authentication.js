import React from 'react';
import "./Authentication.scss";
import { useNavigate } from 'react-router-dom';

function Authentication() {
    const navigate = useNavigate();

    const handleLoginClick = () => {
        navigate('/login'); // Navigate to the login page
    };

    const handleRegisterClick = () => {
        navigate('/register'); // Navigate to the register page
    };

    return (
        <>
            <div className="auth-container">
                <div className="title-card">
                    <h1 className="auth-title">Welcome to my <br />Collaborative Whiteboard App</h1>
                    <p className="app-description">
                        Collaborate in real-time with others on a digital whiteboard.
                        Express your ideas, brainstorm, and work together seamlessly.
                    </p>
                </div>

                <button onClick={handleLoginClick}>
                    Login
                </button>

                <button onClick={handleRegisterClick}>
                    Register
                </button>
            </div>

        </>
    );
}

export default Authentication;
