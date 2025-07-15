import React from 'react';

export const chatContext = React.createContext();


const initialState ={
    userName: '',
    messages: [],
    roomId: '',
    isConnected: false,
    isLeader: false,
    leaderLeft: false,
};

export const chatReducer = (state, action) => {
    switch(action.type){
        case 'SET_USERNAME': return{...state, userName: action.payload};
        case 'JOIN_ROOM': return{...state, roomId: action.payload};
        case 'ADD_MESSAGE': return{...state, messages: [...state.messages, action.payload]};
        case 'ROOM_CLOSED': return{...state, messages: [], roomId: '', isConnected: false, isLeader: false};
        case 'SET_IS_LEADER': return{...state, isLeader: action.payload};
        case 'LOAD_MESSAGES': return{...state, messages: action.payload};
        case 'SET_IS_CONNECTED': return{...state, isConnected: action.payload};
        case 'RESET' : return initialState;
        default: return state;
    }
}

export const ChatProvider = ({children}) => {
    const [state, dispatch] = React.useReducer(chatReducer, initialState);
    return (
        <chatContext.Provider value={{state, dispatch}}>
            {children}
        </chatContext.Provider>
    );
}