import React, {useState} from 'react';
import {YjsNetworkProvider} from "@/modules/yjs-networking/YjsNetworkFactory";

interface ConnectionStatusProps {
  webrtcProvider: YjsNetworkProvider,
}

export const RoomConnectionStatus: React.FC<ConnectionStatusProps> = ({webrtcProvider}) => {
  const getConnectedString = 'Connected';
  const notConnectedString = 'Waiting for players...';

  const [connected, setConnected] = useState(false);


  return (
    <div style={{ color: connected ? '#4ade80' : '#facc15' }}>
      {connected ?
        getConnectedString :
        notConnectedString}
    </div>
  )
  return (<></>)
}