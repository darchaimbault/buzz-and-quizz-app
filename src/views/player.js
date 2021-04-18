import { useCallback, useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import queryString from 'query-string';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { socket } from '../core/services/socket';

import './styles/player.scss';

function NotConnectedComponent(props) {
  return (
    <div className="not-connected">
    </div>
  );
};

function ConnectedComponent(props) {
  const { onClick, onClickBuzz, isFrozen } = props;
  return (
    <div className="connected p-d-flex p-flex-column">
      <div className="connected-content p-d-flex p-ai-center p-jc-center">
        <Button
          icon="pi pi-circle-on"
          className="p-button-raised p-button-rounded"
          onClick={onClickBuzz}
          disabled={isFrozen}
        />
      </div>
      <div className="footer p-d-flex p-jc-center">
        <Button label="Disconnect" onClick={onClick} />
      </div>
    </div>
  );
};

function Player() {
  const [isConnected, setIsConnected] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [isDisplayPlayers, setIsDisplayPlayers] = useState(false);
  const [user, setUser] = useState(null);
  const [availablePlayers, setAvailablePlayers] = useState(null);
  const [players, setPlayers] = useState([]);
  const [activeGame, setActiveGame] = useState(null);

  useEffect(() => {
    socket.open();
  }, []);

  const fetchActiveGame = useCallback(() => {
    axios.get(queryString.stringifyUrl({ url: '/games/active' }))
      .then(({ data: activeGame }) => {
        setActiveGame(activeGame);

        axios.get(queryString.stringifyUrl({ url: '/users/' }))
          .then(({ data: players }) => {
            if (!availablePlayers) {
              setAvailablePlayers(players);
            }
            setPlayers(players);
            setIsDisplayPlayers(true);
          })
          .catch(error => {
            console.log(error);
          });
      })
      .catch(error => {
        console.log(error);
      })
  }, [availablePlayers]);

  useEffect(() => {
    fetchActiveGame();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeAvailablePlayer = useCallback(({ playerId }) => {
    let newAvailablePlayers = availablePlayers ? [...availablePlayers] : [];
    newAvailablePlayers = newAvailablePlayers.filter(player => {
      return player.id !== playerId;
    });

    setAvailablePlayers(newAvailablePlayers);
  }, [availablePlayers]);
  
  const addAvailablePlayer = useCallback((playerId) => {
    let newAvailablePlayers = [...availablePlayers];
    let newAvailablePlayer = players.find(player => {
      return player.id === playerId;
    });

    newAvailablePlayers.push(newAvailablePlayer);

    setAvailablePlayers(newAvailablePlayers);
  }, [availablePlayers, players]);

  useEffect(() => {
    socket.on('player:game:start', () => {
      fetchActiveGame();
    });

    socket.on('player:game:freeze', () => {
      setIsFrozen(true);
    });

    socket.on('player:game:unfreeze', () => {
      setIsFrozen(false);
    });

    socket.on('player:players:available', (playerId) => {
      addAvailablePlayer(playerId);
    });

    socket.on('player:players:unavailable', (playerId) => {
      removeAvailablePlayer(playerId);
    });
  });

  const handleClickDisconnect = useCallback(() => {
    if (isConnected) {
      socket.close();
      setIsConnected(false);
      setUser(null);
    }
  }, [isConnected]);

  const handleClickPlayer = useCallback(async (player) => {
    const socketId = socket.id;

    const { data: playerUpdated, status } = await axios.put(queryString.stringifyUrl({ url: '/users/'+player.id+'/join' }), { socketId });

    if (status === 201) {
      setUser(playerUpdated);
      setIsConnected(true);
      setIsDisplayPlayers(false);
    }
  }, []);

  const handleClickBuzz = useCallback(async () => {
    socket.emit('player:game:buzz');
  }, []);

  const title = useMemo(() => {
    if (user) {
      return 'Hello ' + user.nickname;
    }
    return 'New Player'
  }, [user]);

  return (
    <div className="player p-d-flex p-flex-column">
      <div className="title">
        {title}
      </div>
      <div className="body p-d-flex">
        {
          !activeGame &&
            <div>No Game</div>
        }
        {
          (activeGame && !isConnected) &&
            <NotConnectedComponent />
        }
        {
          (activeGame && isConnected) &&
            <ConnectedComponent
              user={user}
              onClickDisconnect={handleClickDisconnect}
              onClickBuzz={handleClickBuzz}
              isFrozen={isFrozen}
            />
        }
      </div>

      <Dialog
        visible={isDisplayPlayers}
        closeOnEscape={false}
        closable={false}
        draggable={false}
        resizable={false}
        className="dialog-display-players"
        style={{width: '75vw'}}
        header="Qui est-tu ?"
        position="top"
        onHide={() => {}}
      >
        <div className="p-d-flex p-flex-wrap p-jc-center">
          { 
            (availablePlayers || []).map(player => {
              return (
                <Button
                  className="p-jc-center"
                  key={player.id}
                  onClick={() => handleClickPlayer(player)}
                >
                  {player.nickname}
                </Button>
              )
            })
          }
        </div>
      </Dialog>
    </div>
  );
};

export default Player;
