import React from 'react';
import './App.css';

import { Router, Route } from "react-router-dom";

import { RoomList } from './components/RoomList';
import { JoinedRoom } from './components/JoinedRoom';

import AppData from './model/AppData';

const appData:AppData = new AppData();

const App = () => {
  return (
    <Router history={appData.history}>
      <Route exact path="/" render={() => (
        <RoomList appData={appData} />)} />
      <Route path="/room/:roomId" render={({ match }) => (
        <JoinedRoom appData={appData} match={match} />)} />
    </Router>      
  );
}

export default App;
