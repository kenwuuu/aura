import React, {useState} from 'react';
import {ConnectionStatus, WebRTCProvider} from "@/modules/webrtc";

interface ConnectionStatusProps {
  webrtcProvider: WebRTCProvider,
}

export const RoomConnectionStatus: React.FC<ConnectionStatusProps> = ({webrtcProvider}) => {
  const getConnectedString = (status: ConnectionStatus) => `Connected (${status.peersCount} player${status.peersCount !== 1 ? 's' : ''})`;
  const notConnectedString = 'Waiting for players...';

  const [connected, setConnected] = useState(false);

  // webrtcProvider.onStatusChange((status) => {
  //    setConnected(status.isConnected)
  // });
  //
  // return (
  //   <div style={{ color: connected ? '#4ade80' : '#facc15' }}>
  //     {connected ?
  //       getConnectedString(webrtcProvider.getConnectionStatus()) :
  //       notConnectedString}
  //   </div>
  // )
  return (<></>)
}