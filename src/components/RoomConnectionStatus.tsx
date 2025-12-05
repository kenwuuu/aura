import React, {useState} from 'react';
import {WebsocketProvider} from "y-websocket";

interface ConnectionStatusProps {
  webrtcProvider: WebsocketProvider,
}

export const RoomConnectionStatus: React.FC<ConnectionStatusProps> = ({webrtcProvider}) => {
  const getConnectedString = 'Connected';
  const notConnectedString = 'Waiting for players...';

  const [connected, setConnected] = useState(false);

  webrtcProvider.on('status', event => {
    console.log('WebSocket status changed:', event.status); // Logs "connected" or "disconnected"

    if (event.status === 'connected') {
      setConnected(true);
    } else if (event.status === 'disconnected') {
      setConnected(false);
    }
  });

  return (
    <div style={{ color: connected ? '#4ade80' : '#facc15' }}>
      {connected ?
        getConnectedString :
        notConnectedString}
    </div>
  )
  return (<></>)
}