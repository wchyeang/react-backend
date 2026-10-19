import { configureStore } from '@reduxjs/toolkit';
import settingsReducer from './slices/settingsSlice';
import authReducer from './slices/authSlice';
import trailReducer from './slices/trailSlice';

export const store = configureStore({
  reducer: {
    settings: settingsReducer,
    auth: authReducer,
    trail: trailReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
