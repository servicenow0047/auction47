import PlayerRegistration from './pages/PlayerRegistration';
import { ToastProvider } from './components/Toast';

export default function App() {
  return (
    <ToastProvider>
      <PlayerRegistration />
    </ToastProvider>
  );
}
