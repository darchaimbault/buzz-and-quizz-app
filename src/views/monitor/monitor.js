import { useCallback, useEffect, useState } from 'react';
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

import Podium from './podium';
import Ranking from './ranking';
import ModalRoute from '../../core/components/modalRoute';

import './styles/monitor.scss';

function PlayerComponent(props) {
  const { player } = props;
  return (
    <Card footer={player.nickname} className="p-m-2">
      <div className="score">{player.score.value}</div>
    </Card>
  );
}

function Monitor() {
  const [isDisplayQrCode, setIsDisplayQrCode] = useState(false);
  const [activeGame, setActiveGame] = useState(null);
  const history = useHistory();

  const fetchActiveGame = useCallback(() => {
    axios.get(queryString.stringifyUrl({ url: '/games/active', query: { withPlayers: true } }))
      .then(data => {
        setActiveGame(data);
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
    socket.on('monitor:show:join-qr-code', () => {
      setIsDisplayQrCode(!isDisplayQrCode);
    });

    socket.on('monitor:game:start', () => {
      fetchActiveGame();
    });

    socket.on('monitor:game:score', () => {
      fetchActiveGame();
    });

    socket.on('monitor:podium:open', () => {
      openPodium();
    });

    socket.on('monitor:podium:close', () => {
      closePodium();
    });

    socket.on('monitor:ranking:open', () => {
      openRanking();
    });

    socket.on('monitor:ranking:close', () => {
      closeRanking();
    });
  }, [isDisplayQrCode, fetchActiveGame, openPodium, closePodium, openRanking, closeRanking]);

  const players = [
    {
      "id": 1,
      "firstname": "Connor",
      "lastname": "Davies",
      "nickname": "heavygoose650",
      "socketId": null,
      "createdAt": "2021-04-12T20:56:22.675Z",
      "updatedAt": "2021-04-12T20:56:22.675Z",
      "score": {
          "value": 5
      }
    },
    {
      "id": 2,
      "firstname": "Lilly",
      "lastname": "Clarke",
      "nickname": "bigmeercat739",
      "socketId": "XRxPPbpXlkqjxmNDAAAV",
      "createdAt": "2021-04-12T20:56:22.676Z",
      "updatedAt": "2021-04-12T21:17:27.378Z",
      "score": {
          "value": 3
      }
    }
  ];
  
  return (
    <div className="monitor p-d-flex p-flex-row p-flex-wrap p-ai-start">
      {
        !activeGame && 
          <div>No Game</div>
      }
      {activeGame && players.map(player => {
        return (
          <PlayerComponent player={player} />
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
