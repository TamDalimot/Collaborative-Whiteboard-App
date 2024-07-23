import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Welcome.scss'; // Import your CSS file for styling
import { getAuth, signOut, onAuthStateChanged, setPersistence, browserSessionPersistence } from 'firebase/auth'; // Import Firebase authentication methods
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify';



const Welcome = ({ socket, setUser }) => {
    const [firstName, setFirstName] = useState('');
    const [userId, setUserId] = useState('');
    const [roomId, setRoomId] = useState('');
    const navigate = useNavigate(); // Hook for navigation

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                console.log('User is logged in:', user);
            } else {
                console.log('User is not logged in');
            }
        });

        return () => {
            // Cleanup function
            unsubscribe();
        };
    }, []); // Empty dependency array to run the effect only once when the component mounts

    const fetchUserInfo = async () => {
        try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (user) {
                const db = getFirestore();
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnapshot = await getDoc(userDocRef);

                if (userDocSnapshot.exists()) {
                    const userData = userDocSnapshot.data();
                    setFirstName(userData.firstName);
                    setUserId(user.uid);
                }
            }
        } catch (error) {
            console.error('Error fetching user information: ', error);
        }
    };

    useEffect(() => {
        fetchUserInfo();
    }, []);

    const handleJoinRoom = async (e) => {
        e.preventDefault();

        try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (user) {
                // Check if the room exists
                const db = getFirestore();
                const roomRef = doc(db, 'rooms', roomId);
                console.log(roomRef)
                const roomDocSnapshot = await getDoc(roomRef);

                if (roomDocSnapshot.exists()) {
                    // Room exists, navigate to the room
                    const roomData = {
                        roomId,
                        userId
                    };
                    navigate(`/whiteboard/${roomId}`);
                    setUser(roomData);
                    socket.emit("joinRoom", roomData);

                    // Show success toast
                    toast.success('Joined room successfully!', {
                        position: "top-right",
                        autoClose: 3000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                } else {
                    // Room does not exist, display an error toast
                    toast.error('Room does not exist!', {
                        position: "top-right",
                        autoClose: 3000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                }
            }
        } catch (error) {
            console.error('Error joining room:', error);
            // Display an error toast
            toast.error('Error joining room. Please try again later.', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        }
    };


    const generateRoomId = () => {
        // Generate a UUID v4
        const uuid = uuidv4();

        // Truncate the UUID to 5 characters
        const truncatedUuid = uuid.replace(/-/g, '').substring(0, 5);

        return truncatedUuid;
    };

    const handleCreateRoom = async (e) => {
        e.preventDefault();

        try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (user) {
                // Generate room ID
                const roomId = generateRoomId();
                await setPersistence(auth, browserSessionPersistence);
                // Create room document in Firestore
                const db = getFirestore();
                const roomRef = doc(db, 'rooms', roomId);
                await setDoc(roomRef, { roomId, createdBy: user.uid });

                // Update user document with room reference
                const userRef = doc(db, 'users', user.uid);
                await updateDoc(userRef, { rooms: arrayUnion(roomId) });

                // Navigate to the room
                navigate(`/whiteboard/${roomId}`);
                setUser({ roomId, userId: user.uid });
                socket.emit("joinRoom", { roomId, userId: user.uid });
            }
        } catch (error) {
            console.error('Error creating room:', error);
        }
    };
    const handleLogout = () => {
        const auth = getAuth();
        signOut(auth)
            .then(() => {
                // Logout successful, navigate to the login page
                navigate('/');
            })
            .catch((error) => {
                // Handle logout error
                console.error('Logout error:', error);
            });
    };

    return (
        <div className="welcome-page">
            <h1 className="welcome-title">Welcome, {firstName}!</h1>
            <div className="join-container">
                <h2 className='join-title'>Join Room</h2>
                <div className="input-container">
                    <input
                        className="room-input"
                        type="text"
                        placeholder="Enter room ID"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                    />
                    <button className="join-button" onClick={handleJoinRoom}>Join Room</button>
                </div>
            </div>
            <div className="create-room-container">
                <h2 className="create-room-title">Create Room</h2>
                <button className="create-room-button" onClick={handleCreateRoom}>Create Room</button>
            </div>
            <div className="logout-container">
                <button className="logout-button" onClick={handleLogout}>Logout</button>
            </div>
        </div>
    );
}

export default Welcome;
