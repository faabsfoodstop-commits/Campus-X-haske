import { useNavigate } from 'react-router-dom';
import GamesHub from '../components/GamesHub';

export default function GamesHubPage() {
  const navigate = useNavigate();

  const handleSelectGame = (gameId) => {
    if (gameId === 'typing-master') {
      navigate('/games/typing-master');
    } else if (gameId === 'quickfire-trivia') {
      navigate('/games/quickfire-trivia');
    }
  };

  return <GamesHub onSelectGame={handleSelectGame} />;
}
