import React from 'react';
import ReactDOM from 'react-dom';
import { onSnapshot } from 'mobx-state-tree';

import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Provider, Store } from './models';

const store = Store.create({
    "users": {
        "1": {
            "id": "1",
            "name": "Gabriel"
        },
        "2": {
            "id": "2",
            "name": "Carlo"
        }
    }
});

onSnapshot(store, (snapshot) => {
    console.log(JSON.stringify(snapshot, null, 4));
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
