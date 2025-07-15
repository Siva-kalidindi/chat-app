import {useContext,useEffect,useState} from "react";
import {chatContext} from '../chatReducer';
import {useNavigate} from 'react-router-dom';

export default function Welcome() {
    const {state, dispatch} = useContext(chatContext);
    const [userName, setUserName] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const storedName = localStorage.getItem('userName');
        if (storedName || state.userName) {
            setUserName(storedName || state.userName);
            dispatch({type: 'SET_USERNAME', payload: storedName || state.userName});
            navigate('/Home');
        }
    }, [state.userName, dispatch, navigate]);

    const handleSubmit = (e) => {
        e.preventDefault();
        localStorage.setItem('userName', userName);
        setUserName('');
        dispatch({type: 'SET_USERNAME', payload: userName});
    }
    return(
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-gray-100">
      <h1 className="text-4xl font-bold mb-8">
        Welcome {userName && <span className="text-blue-400">{userName}</span>}
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6 bg-gray-800 p-8 rounded-xl shadow-lg">
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Enter your name"
          className="border-none bg-gray-700 text-gray-100 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 w-64"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold transition"
        >
          Enter
        </button>
      </form>
    </div>
  );
}
