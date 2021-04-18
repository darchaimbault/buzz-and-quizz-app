import { useEffect, useCallback, useState, useMemo } from 'react';
import axios from 'axios';
import queryString from 'query-string';
import { socket } from '../core/services/socket';
import { Menubar } from 'primereact/menubar';
import { TieredMenu } from 'primereact/tieredmenu';
import omit from 'lodash/omit';

import './styles/admin.scss';

function Admin() {
  const [isPodiumOpen, setIsPodiumOpen] = useState(false);
  const [isRankingOpen, setIsRankingOpen] = useState(false);
  const [currentGame, setCurrentGame] = useState();
  const [currentPlayers, setCurrentPlayers] = useState([]);

  const fetchCurrentGame = useCallback(async () => {
    const { data } = await axios.get(queryString.stringifyUrl({ url: '/games/active', query: { withPlayers: true } }));

    if (data) {
      setCurrentPlayers(data.users.map(user => ({
        ...user,
        isFrozen: false
      })));
      setCurrentGame(omit(data, ['users']));
    }
  }, []);

  useEffect(() => {
    socket.auth = { admin: true };
    socket.open();

    fetchCurrentGame();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    await axios.put(queryString.stringifyUrl({ url: '/games/1/start' }));

    fetchCurrentGame();
  }, [fetchCurrentGame]);

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

  const menuButtons = useMemo(() => {
    return [
      {
        label: 'Display QRCode',
        command: handleClickToggleQRCode
      },
      {
        label: 'Start Game',
        command: handleClickStartGame
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
      }
    ]
  }, [handleClickToggleQRCode, handleClickStartGame, isPodiumOpen, isRankingOpen, handleClickTogglePodium, handleClickToggleRanking]);

  const playersMenu = useMemo(() => {
    const playerItems = currentPlayers.map(player => {
      return {
        label: player.nickname,
        items: [
          {
            label: player.isFrozen ? 'Unfreeze' : 'Freeze',
            command: () => handleClickPlayerToggleFreeze(player)
          },
          {
            label: 'Disconnect',
            command: () => handleClickPlayerDisconnect(player)
          }
        ]
      }
    });

    return [
      ...playerItems,
      {
        separator: true
      },
      {
        label: 'Freeze all'
      }
    ]
  }, [currentPlayers, handleClickPlayerDisconnect, handleClickPlayerToggleFreeze]);
  
  return (
    <div className="admin p-d-flex p-flex-column p-ai-start">
      <div className="admin-content p-d-flex p-flex-row">
        {
          !!currentGame && <TieredMenu model={playersMenu} />
        }
        <div className="admin-body">

        </div>
      </div>
      <Menubar model={menuButtons} />
    </div>
  );
};

export default Admin;
