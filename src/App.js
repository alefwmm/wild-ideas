import { Component } from 'react';
import { observer } from 'mobx-react';
import { useStore, RootStoreContext } from './models';

import Styles from './App.module.css';

class AwaitComponent extends Component {
    static defaultProps = {
        pending: () => 'Loading...',
        rejected: ({ error }) => { throw error; },
    };

    renderOrCall(ElementTypeOrFunction, props) {
        const isComponent = (
            typeof ElementTypeOrFunction !== 'function' ||
            ElementTypeOrFunction.prototype instanceof Component
        );

        if (isComponent)
            return <ElementTypeOrFunction {...props} />;

        return ElementTypeOrFunction(props);
    }

    render() {
        const { resolved, rejected, pending, children, views} = this.props;
        const render = resolved || children;

        const promises = Object.values(views);

        if (promises.some(promise => promise.state === 'pending'))
            return this.renderOrCall(pending, {});

        const errors = promises.filter(promise => promise.state === 'rejected');
        if (errors.length > 0)
            return this.renderOrCall(rejected, { error: errors[0].value });

        const props = Object.entries(views).reduce((acc, [key, promise]) => {
            acc[key] = promise.value;
            return acc;
        }, {});

        if (render) return this.renderOrCall(render, props);

        throw new TypeError('No `children` or `resolved` prop provided.');
    }
}

const Await = observer(AwaitComponent);

// const Stats = observer(() => {
//     const store = useStore();

//     return (
//         <div>
//             <h3>Loaded Users ({store.userList.length})</h3>
//             <h3>Loaded Todos ({store.todoList.length})</h3>
//         </div>
//     );
// });

// const UserTodoList = observer(({ todos }) => (
//     <ul>
//         { todos.map(todo => (
//             <li
//                 key={todo.id}
//                 className={todo.done ? Styles.done : ''}
//                 onClick={todo.toggle}
//             >
//                 {todo.name} - {todo.description} - {todo.createdAt}
//             </li>
//         )) }
//     </ul>
// ));

// const UserTodos = observer(({ user, userId }) => (
//     <Await
//         views={{
//             todos: userId
//                 ? useStore().avTodosByUserId(userId)
//                 : user.avTodos
//         }}
//         resolved={UserTodoList}
//     />
// ));

// const UserItem = observer(({ user }) => (
//     <div>
//         <h3>{user.name}</h3>
//         <p>{user.email}</p>
//         <h4>
//             Todos amount:
//             { user.avTodosAmount.case({
//                 fulfilled: amount => amount,
//                 pending: () => 'Loading'
//             }) }
//         </h4>
//         <UserTodos user={user} />
//     </div>
// ));

// const User = observer(({ userId }) => (
//     <Await views={{user: useStore().avUserById(userId)}} resolved={UserItem} />
// ));

const Todo = observer(({ todo }) => (
    <p
        className={todo.done ? Styles.done : ''}
        onClick={todo.toggle}
    >
        {todo.description}
        - from <Await views={{user: todo.user}}
        resolved={({ user }) => <span>{ user.name }</span>} />
    </p>
));

const TodoListComponent = observer(({ todos }) => (
    <section>
        <h3>Todos ({todos.length})</h3>
        { todos.map(todo => <Todo key={todo.id} todo={todo} />) }
    </section>
));

const TodoList = observer(({ user, userId }) => (
    <Await
        views={{ todos: user ? user.todos : useStore().todosByUserId(userId) }}
        resolved={TodoListComponent} />
));

const UserItem = observer(({ user }) => (
    <section>
        <h1>User {user.name}</h1>
        <TodoList user={user} />
    </section>
));

const User = observer(({ userId }) => (
    <Await
        views={{ user: useStore().userById(userId) }}
        resolved={UserItem}
        rejected={({error}) => <p>Something went wrong: {error.message}</p>} />
));

const App = () => {
    return (
        <div className={Styles.container}>
            <h1>The great TODO example</h1>
            <h2>Using async view pattern</h2>
            <TodoList userId="2" />
            <User userId="2" />
            <User userId="1" />
            <User userId="3" />
        </div>
    );
};

export default App;
