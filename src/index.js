import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Provider, Store } from './wild';
import { onSnapshot, onAction, onPatch } from 'mobx-state-tree';
import { autorun, observable } from 'mobx';

const store = Store.create(
    {
        "users": {
            "1": {
                "id": "1",
                "name": "User 1",
                "email": "user1@.example.com"
            },
            "2": {
                "id": "2",
                "name": "User 2",
                "email": "user2@.example.com"
            }
        }
    }
);

let action = observable.box();

setTimeout(() => {
    action.set(store.loadTodosByUserId('2'));
}, 5000);

autorun(() => {
    console.log(action.get());
    const promise = action.get();
    if (promise) console.log(promise.state);
});


ReactDOM.render(
    <React.StrictMode>
        <Provider value={store}>
            <App />
        </Provider>
    </React.StrictMode>,
    document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
