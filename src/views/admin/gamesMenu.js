import { useMemo, useContext, useCallback, useEffect } from 'react';
import { TieredMenu } from 'primereact/tieredmenu';
import { Button } from 'primereact/button';
import axios from 'axios';
import queryString from 'query-string';
import classnames from 'classnames';

import './styles/gamesMenu.scss';
import { AdminContext } from './context/adminContext';

function GamesMenu(props) {
  const { games, setGames, selectedGame, setSelectedGame, fetchGames } = useContext(AdminContext);

  useEffect(() => {
    fetchGames();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClickCreateGame = useCallback(async () => {
    const currentDate = new Date();
    const { status, data } = await axios.post(queryString.stringifyUrl({ url: '/games' }), { name: 'Game ' + currentDate.getTime() });

    if (status === 201) {
      let currentGames = [...games];
      currentGames.push(data);

      setGames(currentGames);
      setSelectedGame(data);
    }
  }, [games, setGames, setSelectedGame]);

  const handleClickGame = useCallback(game => {
    setSelectedGame(game);
  }, [setSelectedGame]);

  const getMenuItemTemplate = useCallback((item, options, game) => {
    const { className } = options;

    const isSelected = selectedGame && selectedGame.id === game.id;
    const isNew = game.status === 'NEW';
    const isActive = game.status === 'ACTIVE';
    const isFinished = game.status === 'FINISHED';

    return (
      <div
        className={classnames(className, 'menu-item', isSelected && 'item-selected', isActive && 'item-active', isFinished && 'item-finished')}
        onClick={item.command}
      >
        <span className={classnames(options.iconClassName, 'pi', isNew && 'pi-exclamation-circle', isActive && 'pi-info-circle', isFinished && 'pi-check-circle')} />
        <span className={options.labelClassName}>{item.label}</span>
      </div>
    )
  }, [selectedGame]);

  const menuModel = useMemo(() => {
    return games.map(game => {
      return {
        label: game.name,
        command: () => handleClickGame(game),
        template: (item, options) => getMenuItemTemplate(item, options, game)
      }
    });
  }, [games, handleClickGame, getMenuItemTemplate]);

  return (
    <div className="games-menu p-d-flex p-flex-column">
      <TieredMenu model={menuModel} />
      <Button label="Create Game" icon="pi pi-plus-circle" className="create-button" onClick={handleClickCreateGame} />
    </div>
  )
};

export default GamesMenu;