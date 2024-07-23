import { useState } from 'react';
import { signInWithEmailAndPassword, getAuth, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import './Login.scss';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            if (!email.trim() && !password.trim()) {
                toast.error('Please enter your email and password');
                return;
            } else if (!email.trim()) {
                toast.error('Please enter your email');
                return;
            } else if (!password.trim()) {
                toast.error('Please enter your password');
                return;
            }

            setLoading(true);

            const auth = getAuth();
            await setPersistence(auth, browserSessionPersistence);

            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const db = getFirestore();
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnapshot = await getDoc(userDocRef);

            if (userDocSnapshot.exists()) {
                console.log('Successfully logged in');
                navigate('/welcome');
            } else {
                console.log('User not registered. Please register first.');
            }
        } catch (error) {
            toast.error('Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className='auth-title '>
                <h1>Login</h1>
            </div>
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={handleLogin} disabled={loading}>
                {loading ? 'Loading...' : 'Login'}
            </button>
            <p>
                Don't have an account?{' '}
                <a href="/register" className="register-link">
                    Register here
                </a>
            </p>
        </div>
    );
}

export default Login;
