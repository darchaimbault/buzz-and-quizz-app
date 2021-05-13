import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import queryString from 'query-string';
import { Card } from 'primereact/card';
import { Dialog } from 'primereact/dialog';
import QRCode from 'react-qr-code';
import {
  useHistory,
  Route
} from "react-router-dom";
import { socket } from '../../core/services/socket';
import omit from 'lodash/omit';
import classnames from 'classnames';

import Podium from './podium';
import Ranking from './ranking';
import ModalRoute from '../../core/components/modalRoute';

import './styles/monitor.scss';

function PlayerComponent(props) {
  const { player, buzzedPlayer, isRight, isFalse, nbPlayers } = props;
  const isBuzzed = useMemo(() => {
    return buzzedPlayer && (player.id === buzzedPlayer.id);
  }, [player, buzzedPlayer]);

  return (
    <Card
      footer={player.nickname}
      className={classnames('p-m-2', `nb-players-${nbPlayers}`, {
        'is-buzzed': isBuzzed,
        'disabled': !isBuzzed && buzzedPlayer,
        'is-right': isRight,
        'is-false': isFalse
      })}
    >
      <div className="score">{player.score.value}</div>
      <div className="pi pi-check-circle addPoint" />
      <div className="pi pi-ban false" />
    </Card>
  );
}

function Monitor() {
  const [isDisplayQrCode, setIsDisplayQrCode] = useState(false);
  const [isFalse, setIsFalse] = useState(false);
  const [isRight, setIsRight] = useState(false);
  const [activeGame, setActiveGame] = useState(null);
  const [currentPlayers, setCurrentPlayers] = useState([]);
  const [buzzedPlayer, setBuzzedPlayer] = useState(null);
  const history = useHistory();

  const fetchActiveGame = useCallback(() => {
    axios.get(queryString.stringifyUrl({ url: '/games/active', query: { withPlayers: true } }))
      .then(({ data, status }) => {
        if (data && status === 200) {
          setCurrentPlayers(data.users.map(user => ({
            ...user,
            isFrozen: false
          })));
          setActiveGame(omit(data, ['users']));
        }
      })
      .catch(error => {
        console.log(error);
      })
  }, []);

  const fetchPlayers = useCallback(() => {
    axios.get(queryString.stringifyUrl({ url: '/users', query: { forActiveGame: true } }))
      .then(({ data, status }) => {
        if (data && status === 200) {
          const newPlayers = data.map(player => {
            return {
              ...omit(player, ['games']),
              score: player.games[0].score
            };
          });
          setCurrentPlayers(newPlayers);
        }
      })
      .catch(error => {
        console.log(error);
      })
  }, []);

  const closePodium = useCallback(() => {
    history.goBack();
  }, [history]);

  const openPodium = useCallback(() => {
    history.push('/monitor/podium');
  }, [history]);

  const closeRanking = useCallback(() => {
    history.goBack();
  }, [history]);

  const openRanking = useCallback(() => {
    history.push('/monitor/ranking');
  }, [history]);

  useEffect(() => {
    fetchActiveGame();

    socket.auth = { monitor: true };
    socket.open();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    socket.on('monitor:game:score', () => {
      fetchPlayers();
      setIsRight(true);
      setTimeout(() => {
        setIsRight(false);
        setBuzzedPlayer(null);
      }, 1000);
    });
  }, [fetchPlayers]);

  useEffect(() => {
    socket.on('monitor:game:start', () => {
      fetchActiveGame();
    });
  }, [fetchActiveGame]);

  useEffect(() => {
    socket.on('player:players:unavailable', () => {
      fetchActiveGame();
    });
  }, [fetchActiveGame]);

  useEffect(() => {
    socket.on('monitor:show:join-qr-code', () => {
      setIsDisplayQrCode(!isDisplayQrCode);
    });
  }, [isDisplayQrCode]);

  useEffect(() => {
    socket.on('monitor:game:buzz', ({ userId }) => {
      setBuzzedPlayer(currentPlayers.find(player => player.id === userId));
    });
  }, [currentPlayers]);

  useEffect(() => {
    socket.on('monitor:game:false', () => {
      setIsFalse(true);
      setTimeout(() => {
        setIsFalse(false);
        setBuzzedPlayer(null);
      }, 1000);
    });
  }, []);

  useEffect(() => {
    socket.on('monitor:game:cancel', () => {
      setBuzzedPlayer(null);
    });
  }, []);

  useEffect(() => {
    socket.on('monitor:podium:open', () => {
      openPodium();
    });
  }, [openPodium]);

  useEffect(() => {
    socket.on('monitor:podium:close', () => {
      closePodium();
    });
  }, [closePodium]);

  useEffect(() => {
    socket.on('monitor:ranking:open', () => {
      openRanking();
    });
  }, [openRanking]);

  useEffect(() => {
    socket.on('monitor:ranking:close', () => {
      closeRanking();
    });
  }, [closeRanking]);

  useEffect(() => {
    socket.on('monitor:game:stop', () => {
      document.location.reload();
    });
  }, []);
  
  return (
    <div className="monitor p-d-flex p-flex-row p-flex-wrap p-ai-center p-jc-center">
      {
        !activeGame && 
          <div>No Game</div>
      }
      {activeGame && currentPlayers.map(player => {
        return (
          <PlayerComponent
            player={player}
            buzzedPlayer={buzzedPlayer}
            key={player.id}
            isFalse={isFalse}
            isRight={isRight}
            nbPlayers={currentPlayers.length}
          />
        )
      })}

      <Dialog
        visible={isDisplayQrCode}
        closeOnEscape={false}
        closable={false}
        draggable={false}
        resizable={false}
        onHide={() => {}}
      >
        <QRCode value={window.location.origin + '/player'} size={512} />
      </Dialog>

      <Route path="/monitor/podium">
        <ModalRoute>
          <Podium />
        </ModalRoute>
      </Route>
      <Route path="/monitor/ranking">
        <ModalRoute>
          <Ranking />
        </ModalRoute>
      </Route>
    </div>
  );
};

export default Monitor;
