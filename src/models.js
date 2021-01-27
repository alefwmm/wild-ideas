import { destroy, types, flow, getParent, getParentOfType } from 'mobx-state-tree';
import { createContext, useContext } from 'react';
import { fromPromise, computedFn } from 'mobx-utils';

const asyncAction = loadFn => {
    return (...args) => fromPromise(loadFn(...args));
};

const makeAsyncActions = (actions) => (
    Object.entries(actions).reduce(
        (acc, [key, func]) => ({...acc, [key]: asyncAction(func)}),
        {}
    )
);

const asyncView = (fn) => (...args) => {
    const value = fn(...args);
    if (value instanceof Promise) return fromPromise(value);
    return fromPromise.resolve(value);
};

const makeAsyncViews = (views) => (
    Object.keys(views).map((key) => {
        const descriptor = Object.getOwnPropertyDescriptor(views, key);

        if ('get' in descriptor)
            descriptor.get = asyncView(descriptor.get);
        else
            descriptor.value = computedFn(asyncView(descriptor.value));

        return [key, descriptor];
    }).reduce((acc, [key, descriptor]) => {
        Object.defineProperty(acc, key, descriptor);
        return acc;
    }, {})
);

const userTodos = {
    "1": [
        {
            "id": "1",
            "userId": "1",
            "description": "Make coffee"
        },
        {
            "id": "2",
            "userId": "1",
            "description": "Make tea"
        }
    ],
    "2": [
        {
            "id": "3",
            "userId": "2",
            "description": "Run"
        },
        {
            "id": "4",
            "userId": "2",
            "description": "Drink water"
        }
    ]
};

const usersData = {
    "1": {
        "id": "1",
        "name": "Gabriel"
    },
    "2": {
        "id": "2",
        "name": "Carlo"
    }
};

const wait = (ms, value) =>
    new Promise((resolve) => setTimeout(() => resolve(value), ms));

const Todo = types.model('Todo', {
    id: types.identifier,
    userId: types.string,
    description: types.string,
    done: types.optional(types.boolean, false)
}).actions(self => ({
    toggle() {
        self.done = !self.done;
    },

    destroy() {
        destroy(self);
    }
})).views(self => ({
    get user() {
        return getParentOfType(self, Store).userById(self.userId);
    }
}));

const User = types.model('User', {
    id: types.identifier,
    name: types.string
}).actions(self => ({
    loadTodos() {
        return getParentOfType(self, Store).loadTodosByUserId(self.id);
    }
})).views(self => ({
    get todos() {
        return getParentOfType(self, Store).todosByUserId(self.id);
    }
}));

const Store = types.model('Store', {
    users: types.map(User),
    todos: types.map(Todo),
    todosByUser: types.map(types.array(types.safeReference(Todo)))
}).actions(self => ({
    loadTodosByUserId: flow(function* (userId) {
        const todoSnapshots = yield wait(2000, userTodos[userId]);
        const todoInstances = todoSnapshots.map(ts => self.todos.put(ts));
        return self.todosByUser.set(userId, todoInstances);
    }),

    loadUser: flow(function* (id) {
        const user = yield wait(2000, usersData[id]);
        return self.users.put(user);
    })
})).views(self => makeAsyncViews({
    todosByUserId(userId) {
        return self.todosByUser.has(userId)
            ? self.todosByUser.get(userId)
            : self.loadTodosByUserId(userId);
    },

    userById(id) {
        return self.users.has(id) ? self.users.get(id) : self.loadUser(id);
    }
})).views(self => ({
    get userList() {
        return Array.from(self.users.values());
    }
}));

const RootStoreContext = createContext(null);
const Provider = RootStoreContext.Provider;
const useStore = () => {
    const store = useContext(RootStoreContext);
    return store;
};

export { Store, User, Todo, Provider, useStore, RootStoreContext };


