import { useNavigate } from 'react-router';
import { NewTradeModal } from '../components/NewTradeModal';

export function NewTradePage() {
  const navigate = useNavigate();

  return (
    <NewTradeModal
      onClose={() => navigate('/trades')}
      onCreated={() => navigate('/trades')}
    />
  );
}
