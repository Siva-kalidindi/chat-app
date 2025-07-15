import React,{useEffect, useContext,useState} from 'react';
import {chatContext} from '../chatReducer';
import {useNavigate} from 'react-router-dom';
import socket from '../Socket';


export const Home = () => {

    const {state, dispatch} = useContext(chatContext);
    const [roomId, setRoomId] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (!state.userName) {
            navigate('/');
        }
    }, [state.userName, navigate]);

    useEffect(() => {
        socket.on('room-join-error', (msg) => {
            setError(msg);
        });
        socket.on('room-joined', ({ roomId }) => {
            dispatch({type: 'JOIN_ROOM', payload: roomId});
            dispatch({type: 'SET_IS_LEADER', payload: false});
            navigate(`/chat/${roomId}`);
        });
        socket.on('room-created', (roomId) => {
            dispatch({type: 'JOIN_ROOM', payload: roomId});
            dispatch({type:'SET_IS_LEADER', payload: true});
            navigate(`/chat/${roomId}`);
        });
        socket.on('room-exists', (roomId) => {
            setError('Room already exists. Try joining or use a different name.');
        });
        return () => {
            socket.off('room-join-error');
            socket.off('room-joined');
            socket.off('room-created');
            socket.off('room-exists');
        };
    }, [dispatch, navigate]);

    const handleCreateRoom = () => {
        const newRoomId = `hehe-${Math.random().toString(36).substring(2, 15)}`;
        setRoomId(newRoomId);
        setError('');
        socket.emit('create-room', {roomId: newRoomId, userName: state.userName});
    }

    const handleJoinRoom = () => {
        if (roomId) {
            setError('');
            socket.emit('join-room', {roomId, userName: state.userName});
        }
    }   

    return (
      <div className="h-screen flex flex-col items-center justify-center gap-8 bg-gray-900 text-gray-100">
        <h1 className="text-3xl font-bold mb-4">
          Welcome, <span className="text-blue-400">{state.userName}</span>
        </h1>

        <button
          onClick={handleCreateRoom}
          className="bg-gradient-to-r from-green-500 to-green-700 text-white px-6 py-3 rounded-lg shadow-lg hover:from-green-600 hover:to-green-800 font-semibold transition"
        >
          Create Room
        </button>

        <div className="flex gap-4 items-center bg-gray-800 p-6 rounded-xl shadow-lg">
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="bg-gray-700 text-gray-100 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 w-64 border-none outline-none transition"
          />
          <button
            onClick={handleJoinRoom}
            className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-5 py-2 rounded-lg shadow hover:from-blue-700 hover:to-blue-900 font-semibold transition"
          >
            Join
          </button>
        </div>
        {error && <div className="text-red-400 font-semibold mt-2">{error}</div>}
      </div>
    );
};

export default Home;