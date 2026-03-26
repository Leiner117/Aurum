import { configureStore } from "@reduxjs/toolkit";
import accountsReducer from "./slices/accountsSlice";
import categoriesReducer from "./slices/categoriesSlice";
import expensesReducer from "./slices/expensesSlice";
import budgetsReducer from "./slices/budgetsSlice";
import recurringReducer from "./slices/recurringSlice";
import reportsReducer from "./slices/reportsSlice";
import currencyReducer from "./slices/currencySlice";

export const store = configureStore({
  reducer: {
    accounts: accountsReducer,
    categories: categoriesReducer,
    expenses: expensesReducer,
    budgets: budgetsReducer,
    recurring: recurringReducer,
    reports: reportsReducer,
    currency: currencyReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
