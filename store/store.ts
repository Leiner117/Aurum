import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  createTransform,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import accountsReducer from "./slices/accountsSlice";
import categoriesReducer from "./slices/categoriesSlice";
import expensesReducer from "./slices/expensesSlice";
import budgetsReducer from "./slices/budgetsSlice";
import recurringReducer from "./slices/recurringSlice";
import reportsReducer from "./slices/reportsSlice";
import currencyReducer from "./slices/currencySlice";

// Reset transient loading/error state on rehydration so spinners never get stuck
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const resetLoadingState = createTransform<any, any>(
  (state) => state,
  (state) => ({
    ...state,
    isLoading: false,
    isSummaryLoading: false,
    isProcessing: false,
    isLoadingRates: false,
    error: null,
  })
);

const rootReducer = combineReducers({
  accounts: accountsReducer,
  categories: categoriesReducer,
  expenses: expensesReducer,
  budgets: budgetsReducer,
  recurring: recurringReducer,
  reports: reportsReducer,
  currency: currencyReducer,
});

// Persist stable slices — expenses and reports are excluded because they
// depend on user-controlled filters/pagination that should always be fresh
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const persistedReducer = persistReducer(
  {
    key: "aurum-v1",
    storage,
    whitelist: ["accounts", "categories", "currency", "budgets", "recurring"],
    transforms: [resetLoadingState],
  },
  rootReducer as any
);

export const store = configureStore({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reducer: persistedReducer as any,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

// RootState is derived from rootReducer (not persistedReducer) so the _persist
// key doesn't pollute the type used in selectors
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
