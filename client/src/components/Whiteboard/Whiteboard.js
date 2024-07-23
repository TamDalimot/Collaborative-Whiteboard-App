import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import './Whiteboard.scss';
import { SketchPicker } from 'react-color';
import { FaUndo, FaEraser, FaPen, FaTrash, FaRedo, FaSignOutAlt, FaTimes, FaSave, FaCopy } from "react-icons/fa";
import { useNavigate, useParams } from 'react-router-dom';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

const Whiteboard = ({ socket }) => {
    const canvasRef = useRef(null);
    const [context, setContext] = useState(null);
    const [drawing, setDrawing] = useState(false);
    const [color, setColor] = useState('#000');
    const [brushSize, setBrushSize] = useState(2);
    const [prevPos, setPrevPos] = useState({ x: 0, y: 0 });
    const [eraseMode, setEraseMode] = useState(false);
    const [history, setHistory] = useState([]);
    const [redoHistory, setRedoHistory] = useState([]);
    const [userCount, setUserCount] = useState(0);
    const [toolbarOpen, setToolbarOpen] = useState(false);
    const [initialLoad, setInitialLoad] = useState(false);

    const navigate = useNavigate();
    const { roomId, userId } = useParams();


    // Setup Firestore
    const db = getFirestore();

    // Setup socket event listeners
    useEffect(() => {
        socket.on('userCount', (count) => {
            setUserCount(count);
        });

        socket.on('canvasStateFromServer', (data) => {
            // Handle canvas state updates
            const { state } = data;
            const img = new Image();
            img.src = state;
            img.onload = () => {
                context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                context.drawImage(img, 0, 0);
            };
        });

        socket.on('draw', (data) => {
            // Handle drawing events
            if (!canvasRef.current || !data) return;
            const { offsetX, offsetY, color: drawColor } = data;
            const ctx = canvasRef.current.getContext('2d');
            ctx.beginPath();
            ctx.strokeStyle = drawColor;
            ctx.lineWidth = brushSize
            ctx.stroke();
            setPrevPos({ x: offsetX, y: offsetY });
        });

        return () => {
            socket.off('userCount');
            socket.off('canvasStateFromServer');
            socket.off('draw');
        };
    }, [socket, context, prevPos]);

    // Setup canvas context
    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        // Check if it's the initial load
        if (!initialLoad) {
            // Clear the canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Set canvas background to white
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Set initial load to true
            setInitialLoad(true);
        }

        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        setContext(ctx);

        return () => {
            // Clean up context if needed
        };
    }, [brushSize, color, initialLoad]);


    useEffect(() => {
        const sendCanvasState = () => {
            socket.emit('canvasState', { roomId, userId, state: canvasRef.current.toDataURL() });
        };

        const changeListeners = ['brushSize', 'color', 'history', 'redoHistory'];
        changeListeners.forEach((listener) => {
            const state = eval(listener);
            if (Array.isArray(state)) {
                if (state.length > 0) {
                    sendCanvasState();
                }
            } else {
                if (state !== null && typeof state === 'object') {
                    if (Object.keys(state).length > 0) {
                        sendCanvasState();
                    }
                }
            }
        });

        return () => {
        };
    }, [brushSize, color, history, redoHistory, roomId, socket, userId]);

    const startDrawing = (e) => {
        setDrawing(true);
        const { offsetX, offsetY } = e.nativeEvent;
        // Reset the drawing path
        context.beginPath();
        setPrevPos({ x: offsetX, y: offsetY });
        // Emit start drawing event with updated brushSize
        socket.emit('startDrawing', { roomId, userId, color, offsetX, offsetY, brushSize });
    };

    const endDrawing = () => {
        setDrawing(false);
        socket.emit('endDrawing', { roomId, userId });
        // Emit canvas state to the server
        socket.emit('canvasState', { roomId, userId, state: canvasRef.current.toDataURL() });
        setHistory([...history, context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)]);
    };

    const draw = (e) => {
        if (!drawing || !context) return; // Add a check for context
        const { offsetX, offsetY } = e.nativeEvent;
        context.beginPath();
        context.moveTo(prevPos.x, prevPos.y);
        context.lineTo(offsetX, offsetY);
        context.stroke();
        setPrevPos({ x: offsetX, y: offsetY });
        // Emit drawing data
        socket.emit('draw', { roomId, color, userId, offsetX, offsetY });
    };

    const undo = () => {
        socket.emit('undo', { roomId, userId });
        if (history.length > 0) {
            // Remove the last item from the history
            const lastState = history[history.length - 1];
            setHistory(history.slice(0, -1));
            // Push the undone state to redoHistory
            setRedoHistory([...redoHistory, lastState]);

            // Clear the canvas
            context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            // Redraw the history (excluding the last item)
            history.slice(0, -1).forEach((imageData) => context.putImageData(imageData, 0, 0));
        }
    };

    const redo = () => {
        socket.emit('redo', { roomId, userId });
        if (redoHistory.length > 0) {
            // Pop the last undone state from redoHistory
            const nextState = redoHistory.pop();
            setRedoHistory([...redoHistory]);

            // Add the popped state to history
            setHistory([...history, nextState]);

            // Clear the canvas
            context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            // Redraw the popped state
            context.putImageData(nextState, 0, 0);
        }
    };

    const clear = () => {
        socket.emit('clear', { roomId, userId });
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHistory([]);
    };

    const toggleEraseMode = () => {
        // Emit erase mode toggle event
        socket.emit('toggleEraseMode', { roomId, userId, eraseMode: !eraseMode });
        setEraseMode(!eraseMode);
        setColor(eraseMode ? '#000' : '#fff');
    };

    const handleExitRoom = (e) => {
        e.preventDefault();
        const roomData = { roomId, userId };
        navigate(`/welcome`);
        socket.emit("leaveRoom", roomData);
        setUserCount(prevCount => Math.max(0, prevCount - 1));
        toast.success('Exited room successfully');
    };

    const saveImage = async () => {
        const canvas = canvasRef.current;
        const dataURL = canvas.toDataURL('image/jpeg');
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = 'whiteboard.jpg';
        link.click();
        toast.success('Image saved locally');

        try {
            const canvas = canvasRef.current;
            const dataURL = canvas.toDataURL('image/png');
            await setDoc(doc(db, 'whiteboards', roomId), { image: dataURL });
            console.log('Whiteboard saved in Firestore');
            toast.success('Whiteboard saved in Firestore');
        } catch (error) {
            console.error('Error saving whiteboard in Firestore:', error);
            toast.error('Failed to save whiteboard in Firestore');
        }
    };


    const copyRoomIdToClipboard = () => {
        navigator.clipboard.writeText(roomId);
        toast.success('Room ID copied to clipboard');
    };

    return (
        <div className='whiteboard-page'>
            <h1>
                Room ID: {roomId}
                <button onClick={copyRoomIdToClipboard} className="copy-btn"><FaCopy /></button>
            </h1>
            <div className="user-count">Users in the room: {userCount}</div>
            <div className="whiteboard-container">
                <canvas
                    ref={canvasRef}
                    className="whiteboard"
                    width={800}
                    height={600}
                    onMouseDown={startDrawing}
                    onMouseUp={endDrawing}
                    onMouseMove={draw}
                />
                <button className={`tool-btn ${toolbarOpen ? 'toolbar-open' : ''}`} onClick={() => setToolbarOpen(!toolbarOpen)}>Tools</button>

                <div className={`toolbar ${toolbarOpen ? 'open' : ''}`}>
                    <button className="close-btn" onClick={() => setToolbarOpen(false)}><FaTimes /></button>
                    <div className="tool">
                        {!eraseMode && <SketchPicker color={color} onChange={(e) => setColor(e.hex)} />}
                    </div>
                    <div className="tool">
                        <input type="range" min="1" max="50" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="slider" />
                    </div>
                    <div className="tool">
                        <button onClick={() => toggleEraseMode()} className={eraseMode ? "erase-btn active" : "erase-btn"}>{eraseMode ? <FaPen /> : <FaEraser />}</button>
                    </div>
                    <div className="tool">
                        <button onClick={undo} className="undo-btn"><FaUndo /></button>
                    </div>
                    <div className="tool">
                        <button onClick={redo} className="redo-btn"><FaRedo /></button>
                    </div>
                    <div className="tool">
                        <button onClick={clear} className="clear-btn"><FaTrash /></button>
                    </div>
                </div>
                <div className='exit-room'>
                    <button onClick={handleExitRoom} className="exit-btn"><FaSignOutAlt /> Exit ChatRoom </button>
                </div>
                <div className="save-btn">
                    <button onClick={saveImage} className="save-local-btn"><FaSave /> Save whiteboard</button>
                </div>
            </div>
        </div>
    );
}

export default Whiteboard;
