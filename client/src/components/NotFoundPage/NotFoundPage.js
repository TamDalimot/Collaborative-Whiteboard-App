import React from 'react';
import './NotFoundPage.scss';
import { Link, useNavigate } from 'react-router-dom';

function NotFoundPage() {
    const navigate = useNavigate();

    const goBack = () => navigate(-1); // Go back to the previous page

    return (
        <div className="not-found">
            <h1>Page Not Found</h1>
            <p>The page you are looking for is not available</p>
            <div className='initial-page-button'>
                <button onClick={goBack}>Go back to the previous page</button>
            </div>
        </div>
    );
}

export default NotFoundPage;
