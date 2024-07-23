import React, { useState } from 'react';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../database/config';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import './Register.scss';

const Register = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [registrationEmail, setRegistrationEmail] = useState('');
    const [registrationPassword, setRegistrationPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const notifySuccess = (message) => {
        toast.success(message, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
        });
    };

    const notifyError = (message) => {
        toast.error(message, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
        });
    };

    const handleSignup = async () => {
        if (!firstName || !lastName || !registrationEmail || !registrationPassword) {
            notifyError('All fields are required');
            return;
        }

        try {
            setLoading(true);

            const userCredential = await createUserWithEmailAndPassword(auth, registrationEmail, registrationPassword);
            const user = userCredential.user;

            const db = getFirestore();
            const userDocRef = doc(db, 'users', user.uid);

            await setDoc(userDocRef, {
                firstName: firstName,
                lastName: lastName,
                email: registrationEmail,
            });

            notifySuccess('User Registered Successfully');
            setLoading(false);
            setFirstName('');
            setLastName('');
            setRegistrationEmail('');
            setRegistrationPassword('');
            setError('');
        } catch (error) {
            setLoading(false);
            setError(error.message);
            notifyError(error.message);
        }
    };

    return (
        <>
            <div className="register-page">
                <div className='auth-title'><h1>Registration</h1></div>
                {error && <p className="error-message">{error}</p>}
                <input
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={registrationEmail}
                    onChange={(e) => setRegistrationEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={registrationPassword}
                    onChange={(e) => setRegistrationPassword(e.target.value)}
                />
                <button onClick={handleSignup} disabled={loading}>
                    {loading ? 'Loading...' : 'Register'}
                </button>
                <p>
                    Already have an account?{' '}
                    <a href="/login" className='login-link'>
                        Log in here
                    </a>
                </p>
            </div>
        </>
    );
};

export default Register;
