import { useCallback, useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import queryString from 'query-string';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { socket } from '../core/services/socket';
import range from 'lodash/range';
import random from 'lodash/random';
import classnames from 'classnames';

import './styles/player.scss';

const colorTintsRange = range(500, 800, 100);
const colorRange = ['blue', 'yellow', 'cyan', 'pink', 'indigo', 'teal', 'orange', 'bluegray', 'purple'];

const playerColorTint = colorTintsRange[random(0, colorTintsRange.length)];
const playerColor = colorRange[random(0, colorRange.length)];
const playerColorValue = `var(--${playerColor}-${playerColorTint})`;

const NotConnectedComponent = () => {
  return (
    <div className="not-connected"/>
  );
};

const ConnectedComponent = (props) => {
  const { onClickDisconnect, onClickBuzz, isFrozen, isBuzzed } = props;
  const classNames = {
    'buzz-frozen': isFrozen,
    'buzz-buzzed': isBuzzed
  };

  return (
    <div className="connected p-d-flex p-flex-column">
      <div className="connected-content p-d-flex p-ai-center p-jc-center">
        <Button
          className={classnames('buzz p-button-raised p-button-rounded', classNames)}
          onClick={onClickBuzz}
          disabled={isFrozen}
        />
      </div>
      <div className="footer p-d-flex p-jc-center">
        <Button label="Disconnect" onClick={onClickDisconnect} />
      </div>
    </div>
  );
};

function Player() {
  const [isConnected, setIsConnected] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [isBuzzed, setIsBuzzed] = useState(false);
  const [isDisplayPlayers, setIsDisplayPlayers] = useState(false);
  const [user, setUser] = useState(null);
  const [availablePlayers, setAvailablePlayers] = useState(null);
  const [players, setPlayers] = useState([]);
  const [activeGame, setActiveGame] = useState(null);

  const fetchActiveGame = useCallback(() => {
    axios.get(queryString.stringifyUrl({ url: '/games/active' }))
      .then(({ data: activeGame }) => {
        setActiveGame(activeGame);
        const socketId = socket.id;

        axios.get(queryString.stringifyUrl({ url: '/users/', query: { socketId } }))
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
    socket.open();

    socket.on('connect', () => {
      fetchActiveGame();
    });
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

  const handleClickDisconnect = useCallback(() => {
    document.location.reload();
  }, []);

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
    setIsBuzzed(true);
  }, []);

  const title = useMemo(() => {
    if (user) {
      return user.nickname;
    }
    return 'New Player'
  }, [user]);

  /**************************************************
   *************** Websocket Handlers ***************
   **************************************************/

  useEffect(() => {
    socket.on('player:game:start', () => {
      fetchActiveGame();
    });
  }, [fetchActiveGame]);

  useEffect(() => {
    socket.on('player:game:stop', () => {
      document.location.reload();
    });
  }, []);

  useEffect(() => {
    socket.on('player:game:freeze', () => {
      setIsFrozen(true);
    });
  }, []);

  useEffect(() => {
    socket.on('players:game:freeze', () => {
      setIsFrozen(true);
    });
  }, [isFrozen]);

  useEffect(() => {
    socket.on('players:game:unfreeze', () => {
      setIsFrozen(false);
    });
  }, [isFrozen]);

  useEffect(() => {
    socket.on('player:game:unfreeze', () => {
      setIsFrozen(false);
    });
  }, []);

  useEffect(() => {
    socket.on('player:players:available', (playerId) => {
      addAvailablePlayer(playerId);
    });
  }, [addAvailablePlayer]);

  useEffect(() => {
    socket.on('player:players:unavailable', (playerId) => {
      removeAvailablePlayer(playerId);
    });
  }, [removeAvailablePlayer]);

  useEffect(() => {
    socket.on('player:game:false', ({ time = 5 }) => {
      setIsBuzzed(false);
      setIsFrozen(true);
      setTimeout(() => {
        setIsFrozen(false);
      }, time * 1000);
    });
  }, []);

  useEffect(() => {
    socket.on('player:game:cancel', () => {
      setIsBuzzed(false);
    });
  }, []);

  useEffect(() => {
    socket.on('player:game:addPoint', ({ point = 1 }) => {
      if (point === 1) {
        setIsFrozen(true);
        setIsBuzzed(false);
        setTimeout(() => {
          setIsFrozen(false);
        }, 1000);
      } else {
        setIsBuzzed(false);
      }
    });
  }, []);

  useEffect(() => {
    socket.on('player:disconnect', () => {
      handleClickDisconnect();
    });
  }, [handleClickDisconnect]);

  /**************************************************
   ********************* Render *********************
   **************************************************/

  return (
    <div className="player p-d-flex p-flex-column">
      <div className="title p-d-flex p-ai-center p-jc-center" style={{ color: playerColorValue }}>
        {title}
      </div>
      <div className="body p-d-flex">
        {
          !activeGame &&
            <div className="no-game p-flex-column p-d-flex p-ai-center p-jc-center">
              <div className="pi pi-ban" />
              No Game
            </div>
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
              isBuzzed={isBuzzed}
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
