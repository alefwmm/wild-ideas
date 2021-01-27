import { useContext, createContext } from "react";
import { types, flow, getParentOfType } from 'mobx-state-tree';
import { computedFn, fromPromise } from 'mobx-utils';

const exampleTodos = (userId) => {
    const todos = [
        {
            name: 'Dentist',
            description: 'Make an appointment',
            done: true,
            createdAt: new Date().toISOString()
        },
        {
            name: 'Lunch',
            description: 'Make lunch',
            createdAt: new Date().toISOString()
        },
        {
            name: 'Birthday',
            description: 'Buy a present',
            createdAt: new Date().toISOString()
        },
    ];

    return todos.map((todo, i) => ({
        ...todo,
        id: `${userId}-${i+1}`,
        userId: userId
    }));
};

const exampleUser = userId => ({
    id: userId,
    name: `User ${userId}`,
    email: `user${userId}@.example.com`
});

const wait = (ms, value) =>
    new Promise((resolve) => setTimeout(() => resolve(value), ms));

const Todo = types.model('Todo', {
    id: types.identifier,
    name: types.string,
    description: types.optional(types.string, ''),
    done: types.optional(types.boolean, false),
    createdAt: types.string
}).actions(self => {
    return {
        toggle() {
            self.done = !self.done
        }
    };
});

const User = types.model('User', {
    id: types.identifier,
    name: types.string,
    email: types.string
}).views(self => ({
    get avTodos() {
        return getParentOfType(self, Store).avTodosByUserId(self.id);
    },

    get avTodosAmount() {
        return getParentOfType(self, Store).avTodosAmountByUserId(self.id)
    }
}));

const asyncView = (fn) => (...args) => {
    const value = fn(...args);
    if (value instanceof Promise) return fromPromise(value);
    return fromPromise.resolve(value);
};

const makeAsyncViews = (views) => (
    Object.keys(views).map((key) => {
        const descriptor = Object.getOwnPropertyDescriptor(views, key);

        if ("get" in descriptor)
            descriptor.get = asyncView(descriptor.get);
        else
            descriptor.value = computedFn(asyncView(descriptor.value));

        return [key, descriptor];
    }).reduce((acc, [key, descriptor]) => {
        Object.defineProperty(acc, key, descriptor);
        return acc;
    }, {})
);

const asyncAction = (fn) => (...args) => fromPromise(fn(...args));

const makeAsyncActions = (actions) => (
    Object.entries(actions).reduce(
        (acc, [key, func]) => ({...acc, [key]: asyncAction(func)}),
        {}
    )
);

const Store = types.model('Store', {
    todos: types.map(Todo),
    users: types.map(User),
    todosByUserId: types.map(types.array(types.safeReference(Todo)))
}).actions(self => ({
    ...makeAsyncActions({
        loadUserById(userId) {
            const oldUser = self.users.get(userId);
            if (oldUser) self.users.delete(userId);
            return wait(2000, exampleUser(userId)).then(self.setUser);
        },

        loadTodosByUserId: flow(function* (userId) {
            const oldTodos = self.todosByUserId.get(userId);
            if (oldTodos) {
                oldTodos.forEach(todo => self.todos.delete(todo.id));
                self.todosByUserId.delete(userId);
            }

            let todos = yield wait(5000, exampleTodos(userId));

            self.todosByUserId.set(userId, todos.map(todo => self.todos.put(todo)));
            return self.todosByUserId.get(userId);
        }),
    }),

    setUser(userSnapshot) {
        return self.users.put(userSnapshot);
    }
})).views(self => {
    return {
        ...makeAsyncViews({
            avUserById(userId) {
                if (self.users.has(userId)) return self.users.get(userId);
                return self.loadUserById(userId);
            },

            avTodosByUserId(userId) {
                if (self.todosByUserId.has(userId))
                    return self.todosByUserId.get(userId);
                return self.loadTodosByUserId(userId);
            },

            avTodosAmountByUserId(userId) {
                return self.avTodosByUserId(userId).then(todos => todos.length);
            }
        }),

        get userList() {
            return [...self.users.values()];
        },

        get todoList() {
            return [...self.todos.values()];
        }
    }
});

const RootStoreContext = createContext(null);
const Provider = RootStoreContext.Provider;
const useStore = () => {
    const store = useContext(RootStoreContext);
    return store;
}

export { Store, Todo, Provider, useStore };
