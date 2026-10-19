import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type TrailKey = 'none' | 'cursor' | 'pixel' | 'textRain';

interface TrailState {
  active: TrailKey;
}

const initialState: TrailState = {
  active: (localStorage.getItem('trail') as TrailKey) || 'none',
};

const trailSlice = createSlice({
  name: 'trail',
  initialState,
  reducers: {
    setTrail(state, action: PayloadAction<TrailKey>) {
      state.active = action.payload;
      localStorage.setItem('trail', action.payload);
    },
  },
});

export const { setTrail } = trailSlice.actions;
export default trailSlice.reducer;
