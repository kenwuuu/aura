import React, {useState} from 'react';
import {YjsNetworkProvider} from "@/modules/yjs-networking/YjsNetworkFactory";

interface ConnectionStatusProps {
  yjsNetworkProvider: YjsNetworkProvider,
}

export const RoomConnectionStatus: React.FC<ConnectionStatusProps> = ({yjsNetworkProvider}) => {
  const getConnectedString = 'Connected';
  const notConnectedString = 'Waiting for players...';

  const [connected, setConnected] = useState(false);

  yjsNetworkProvider.on('status', event => {
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