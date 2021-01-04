import { observer } from 'mobx-react';
import { useStore } from './wild';

import Styles from './App.module.css';

const App = observer(() => {
    const store = useStore();

    const loadableTodos = [1, 2, 3];

    return (
        <div className={Styles.App}>
            <h1>{ store.todos.case({ fulfilled: todos => todos.length }) }</h1>
            <h1>{ store.byIdName(1).value }</h1>
            <h1>{ store.byIdName(1).state }</h1>
            { loadableTodos.map(id => store.byId(id).case({ fulfilled: todo => (
                <div
                    className={todo.done ? Styles.done : ''}
                    key={todo.id}
                    onClick={todo.toggle}
                >
                    <strong>{todo.id} - {todo.name}</strong>
                    <p>{todo.description}</p>
                </div>
            )}))}
        </div>
    );
});

export default App;
