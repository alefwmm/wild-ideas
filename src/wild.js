import { useContext, createContext } from "react";
import { types, flow } from 'mobx-state-tree';
import { computedFn, fromPromise } from 'mobx-utils';
import { computed, runInAction } from 'mobx';

const wait = (ms, value) =>
    new Promise((resolve) => setTimeout(() => resolve(value), ms));

const Todo = types.model('Todo', {
    id: types.identifierNumber,
    name: types.string,
    description: types.optional(types.string, ''),
    done: types.optional(types.boolean, false)
}).actions(self => {
    return {
        toggle() {
            self.done = !self.done
        }
    };
})

const exampleTodos = [
    {
        id: 1,
        name: 'Dentist',
        description: 'Make an appointment',
        done: true
    },
    {
        id: 2,
        name: 'Lunch',
        description: 'Make lunch'
    },
    {
        id: 3,
        name: 'Birthday',
        description: 'Buy a present'
    },
];

const Store = types.model('Store', {
    todoMap: types.map(Todo),
    todoList: types.array(types.safeReference(Todo))
}).actions(self => {
    return {
        loadTodos: flow(function* () {
            if (self.todoList.length !== 0) return;
            const todos = yield wait(2000, exampleTodos);
            self.todoList = todos.map(todo => self.todoMap.put(todo));
        }),
        loadTodosSync() {
            self.todoList = exampleTodos.map(todo => self.todoMap.put(todo));
        },
        getById: flow(function* (id) {
            yield self.loadTodos();
            return yield wait(5000, self.todoMap.get(id));
        })
    };
}).views(self => {
    return {
        get todos() {
            return fromPromise(self.loadTodos().then(() => self.todoList));
        },
        byId: computedFn((id) => {
            return fromPromise(self.todos.then(() => self.getById(id)))
        }),
        byIdName: computedFn((id) => {
            return fromPromise(self.byId(id).then(todo => todo ? todo.name : 'Não existe'))
        })
    }
});

const RootStoreContext = createContext(null);
const Provider = RootStoreContext.Provider;
const useStore = () => {
    const store = useContext(RootStoreContext);
    return store;
}

export { Store, Todo, Provider, useStore };
