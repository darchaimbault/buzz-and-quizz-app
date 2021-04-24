import { useEffect, useCallback, useState, useMemo } from 'react';
import axios from 'axios';
import queryString from 'query-string';
import { socket } from '../../core/services/socket';
import { Menubar } from 'primereact/menubar';
import omit from 'lodash/omit';
import { Card } from 'primereact/card';

import GamesMenu from './gamesMenu';
import './styles/admin.scss';
import { AdminContext } from './context/adminContext';
import { Button } from 'primereact/button';

const PlayerFooterCard = (props) => {
  const { player } = props;
  return (
    <div className="player-card-footer p-d-flex p-flex-row p-jc-between">
      <Button label="Freeze" />
      <div>{player.score.value}</div>
    </div>
  )
}

const PlayersGrid = (props) => {
  const { players } = props;
  return (
    <div className="players-grid p-d-flex p-flex-row p-flex-wrap p-jc-center">
      {players.map(player => {
        return (
          <Card footer={<PlayerFooterCard player={player} />}>
            {player.nickname}
          </Card>
        )
      })}
    </div>
  )
}

function Admin() {
  const [isPodiumOpen, setIsPodiumOpen] = useState(false);
  const [isRankingOpen, setIsRankingOpen] = useState(false);
  const [activeGame, setActiveGame] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [currentPlayers, setCurrentPlayers] = useState([]);
  const [games, setGames] = useState([]);

  const fetchActiveGame = useCallback(async () => {
    const { data } = await axios.get(queryString.stringifyUrl({ url: '/games/active', query: { withPlayers: true } }));

    if (data) {
      setCurrentPlayers(data.users.map(user => ({
        ...user,
        isFrozen: false
      })));
      setActiveGame(omit(data, ['users']));
    }
  }, []);

  const fetchGames = useCallback(async () => {
    const { data = [], status } = await axios.get(queryString.stringifyUrl({ url: '/games' }));

    if (status === 200) {
      setGames(data);
      if (data.length > 0) {
        setSelectedGame(data[0]);
      }
    }
  }, [setGames]);

  const udpateGame = useCallback(gameToUpdate => {
    const currentGames = [...games].map(game => {
      return game.id === gameToUpdate.id ? gameToUpdate : game
    });

    setGames(currentGames);
  }, [games]);

  useEffect(() => {
    socket.auth = { admin: true };
    socket.open();

    fetchActiveGame();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    socket.on('admin:player:join', () => {
      fetchActiveGame();
    });
  }, [fetchActiveGame]);

  const handleClickToggleQRCode = useCallback(async () => {
    socket.emit('admin:monitor:join-qr-code');
  }, []);

  const handleClickTogglePodium = useCallback(async () => {
    socket.emit('admin:monitor:podium', {
      open: !isPodiumOpen
    });
    setIsPodiumOpen(!isPodiumOpen);
  }, [isPodiumOpen]);

  const handleClickToggleRanking = useCallback(async () => {
    socket.emit('admin:monitor:ranking', {
      open: !isRankingOpen
    });
    setIsRankingOpen(!isRankingOpen);
  }, [isRankingOpen]);

  const handleClickStartGame = useCallback(async () => {
    if (selectedGame) {
      const selectedGameId = selectedGame.id;
      if (activeGame) {
        const { status, data } = await axios.put(queryString.stringifyUrl({ url: `/games/${selectedGameId}/stop` }));
        if (status === 200) {
          setActiveGame(null);
          udpateGame(data);
        }
      } else {
        const { status, data } = await axios.put(queryString.stringifyUrl({ url: `/games/${selectedGameId}/start` }));
        if (status === 200) {
          udpateGame(data);
          fetchActiveGame();
        }
      }
    }
  }, [activeGame, fetchActiveGame, selectedGame, udpateGame]);

  const handleClickPlayerToggleFreeze = useCallback((player) => {
    if (player.isFrozen) {
      socket.emit('admin:player:unfreeze', { playerId: player.id });
    } else {
      socket.emit('admin:player:freeze', { playerId: player.id });
    }
    setCurrentPlayers(prevPlayers => {
      return prevPlayers.map(prevPlayer => {
        return {
          ...prevPlayer,
          isFrozen: prevPlayer.id === player.id ? !prevPlayer.isFrozen : prevPlayer.isFrozen
        };
      });
    });
  }, []);

  const handleClickPlayerDisconnect = useCallback((player) => {
    socket.emit('admin:player:disconnect', { playerId: player.id });
  }, []);

  const disabledStartStopGameButton = useMemo(() => {
    if (selectedGame != null) {
      if (activeGame != null) {
        return selectedGame.id !== activeGame.id;
      } else {
        return selectedGame.status !== 'NEW';
      }
    }

    return true;
  }, [selectedGame, activeGame]);

  const labelStartStopGameButton = useMemo(() => {
    if (selectedGame != null) {
      if (selectedGame.status === 'FINISHED') {
        return 'Already played';
      } else if (activeGame != null) {
        return activeGame.id === selectedGame.id ? 'Stop game' : 'Already in progress';
      } else {
        return 'Start game';
      }
    }

    return 'No selected game';
  }, [selectedGame, activeGame]);

  const menuButtons = useMemo(() => {
    return [
      {
        label: labelStartStopGameButton,
        command: handleClickStartGame,
        disabled: disabledStartStopGameButton
      },
      {
        label: 'Display QRCode',
        command: handleClickToggleQRCode
      },
      {
        label: `${isPodiumOpen ? 'Close' : 'Open'} podium`,
        command: handleClickTogglePodium,
        disabled: isRankingOpen
      },
      {
        label: `${isRankingOpen ? 'Close' : 'Open'} ranking`,
        command: handleClickToggleRanking,
        disabled: isPodiumOpen
      },
      {
        label: 'Freeze All',
        command: handleClickToggleQRCode
      }
    ]
  }, [handleClickToggleQRCode, labelStartStopGameButton, handleClickStartGame, disabledStartStopGameButton, isPodiumOpen, handleClickTogglePodium, isRankingOpen, handleClickToggleRanking]);
  
  return (
    <AdminContext.Provider value={{ games, setGames, activeGame, setActiveGame, selectedGame, setSelectedGame, fetchGames }}>
      <div className="admin p-d-flex p-flex-column">
        <div className="admin-content p-d-flex p-flex-row">
          <GamesMenu />
          <div className="admin-body">
            <PlayersGrid
              players={currentPlayers}
              handleClickPlayerToggleFreeze={handleClickPlayerToggleFreeze}
              handleClickPlayerDisconnect={handleClickPlayerDisconnect}
            />
          </div>
        </div>
        <Menubar model={menuButtons} />
      </div>
    </AdminContext.Provider>
  );
};

export default Admin;
