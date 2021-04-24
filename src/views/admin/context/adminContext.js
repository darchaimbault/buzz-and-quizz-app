import React from 'react';

export const AdminContext = React.createContext({
  games: [],
  selectedGame: null,
  activeGame: null,
  setGames: () => {},
  setSelectedGame: () => {},
  setActiveGame: () => {}
});