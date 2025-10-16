# Aura - Magic: The Gathering Collaboration App

A real-time collaboration app for playing Magic: The Gathering with friends using WebRTC and Yjs for peer-to-peer synchronization.

## Features

- **Real-time Collaboration**: Peer-to-peer synchronization using Yjs and y-webrtc
- **Interactive Whiteboard**: Dark-themed canvas for placing and moving cards
- **Card Deck Management**: Modular deck system with draw and shuffle functionality
- **Drag-and-Drop**: Move cards around the whiteboard
- **Multi-User Support**: Connect with multiple players in the same room

## Architecture

The application follows a modular architecture with three main components:

```
src/
├── modules/
│   ├── deck/           # Card deck management (easily swappable)
│   ├── whiteboard/     # Canvas for card placement and interaction
│   └── webrtc/         # P2P connection handling via Yjs
```

Each module is designed to be replaceable:
- **Deck Module**: Can be swapped with different deck implementations or card databases
- **Whiteboard Module**: Can be replaced with canvas-based or other rendering solutions
- **WebRTC Module**: Abstracted to allow switching between different P2P providers

## Prerequisites

Before running the application, you need to set up:

1. **Node.js** (v18 or higher)
2. **STUN/TURN Servers** (for WebRTC connectivity)

## Installation

```bash
npm install
```

## Running the Application

### Development Mode

```bash
npm run dev
```

This will start the Vite development server. Open the URL shown in the terminal (usually `http://localhost:5173`).

### Production Build

```bash
npm run build
npm run preview
```

## WebRTC Setup

### Default Configuration

The app comes with default public STUN servers configured:

- Google STUN: `stun:stun.l.google.com:19302`
- Twilio STUN: `stun:global.stun.twilio.com:3478`

And default signaling servers:
- `wss://signaling.yjs.dev`
- `wss://y-webrtc-signaling-eu.herokuapp.com`
- `wss://y-webrtc-signaling-us.herokuapp.com`

### Setting Up Your Own STUN/TURN Server (Recommended for Production)

For better reliability and privacy, you should set up your own STUN/TURN server:

#### Option 1: Using Coturn (Self-Hosted)

1. Install Coturn on your server:
```bash
# Ubuntu/Debian
sudo apt-get install coturn

# Enable the service
sudo systemctl enable coturn
```

2. Configure `/etc/turnserver.conf`:
```
listening-port=3478
fingerprint
lt-cred-mech
use-auth-secret
static-auth-secret=YOUR_SECRET_KEY
realm=yourdomain.com
total-quota=100
bps-capacity=0
stale-nonce=600
cert=/path/to/cert.pem
pkey=/path/to/key.pem
```

3. Start the service:
```bash
sudo systemctl start coturn
```

4. Update `src/modules/webrtc/WebRTCProvider.ts` with your server:
```typescript
iceServers: [
  {
    urls: 'stun:yourdomain.com:3478'
  },
  {
    urls: 'turn:yourdomain.com:3478',
    username: 'username',
    credential: 'password'
  }
]
```

#### Option 2: Using Twilio (Managed Service)

1. Sign up for Twilio: https://www.twilio.com/stun-turn
2. Get your credentials from the Twilio console
3. Update the configuration in your code

#### Option 3: Using Cloudflare Calls (Managed Service)

1. Sign up for Cloudflare: https://developers.cloudflare.com/calls/
2. Use Cloudflare's TURN infrastructure

### Custom Signaling Server (Optional)

For production, you may want to set up your own y-webrtc signaling server:

1. Clone the y-webrtc signaling server:
```bash
git clone https://github.com/yjs/y-webrtc
cd y-webrtc/bin
```

2. Start the signaling server:
```bash
PORT=4444 node server.js
```

3. Update `src/modules/webrtc/WebRTCProvider.ts`:
```typescript
signalingServers: ['ws://your-server.com:4444']
```

## How to Use

### Starting a Game

1. Open the application in your browser
2. Share the URL (including the `?room=` parameter) with other players
3. Other players open the same URL to join your room

### Playing

- **Draw Card**: Click "Draw Card" to draw a card from the deck to the center of the board
- **Move Cards**: Click and drag cards around the whiteboard
- **Shuffle Deck**: Click "Shuffle Deck" to randomize the deck order
- **Connection Status**: Check the top-right corner for connection status and peer count

### Room Management

- Each session generates a unique room ID in the URL
- Share this URL with other players to collaborate in the same room
- To create a new game, open the app without a room parameter or generate a new URL

## Network Requirements

### Firewall Configuration

If you're behind a corporate firewall, you may need to open:

- **UDP ports 3478-3479** for STUN
- **TCP/UDP port 443** for TURN over TLS
- **WebSocket ports** for signaling servers (e.g., 4444)

### NAT Traversal

- **STUN**: Works for most home networks with standard NAT
- **TURN**: Required for symmetric NAT or restrictive firewalls (requires authentication)

## Troubleshooting

### Peers Not Connecting

1. Check browser console for errors
2. Verify STUN/TURN servers are reachable
3. Check firewall settings
4. Try using a TURN server if STUN alone doesn't work

### Cards Not Syncing

1. Ensure all peers are in the same room (check URL)
2. Check network connectivity
3. Verify WebRTC connection status in the UI

### Performance Issues

1. Limit the number of cards on the board
2. Reduce the number of simultaneous peers
3. Use a dedicated TURN server closer to your region

## Development

### Project Structure

```
aura/
├── src/
│   ├── modules/
│   │   ├── deck/          # Deck management
│   │   │   ├── Deck.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── whiteboard/    # Whiteboard canvas
│   │   │   ├── Whiteboard.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   └── webrtc/        # WebRTC provider
│   │       ├── WebRTCProvider.ts
│   │       ├── types.ts
│   │       └── index.ts
│   ├── index.ts           # Application entry point
│   └── style.css          # Global styles
├── index.html
├── package.json
└── tsconfig.json
```

### Extending the Application

#### Switching Deck Implementation

Replace `src/modules/deck/Deck.ts` with your implementation:

```typescript
export interface DeckAdapter {
  getCards(): Card[];
  drawCard(): Card | null;
  shuffleDeck(): void;
  getCardCount(): number;
}
```

#### Switching WebRTC Provider

Replace `src/modules/webrtc/WebRTCProvider.ts` with another solution (e.g., PeerJS, socket.io):

```typescript
export interface RTCAdapter {
  onStatusChange(callback: (status: ConnectionStatus) => void): void;
  getConnectionStatus(): ConnectionStatus;
  destroy(): void;
}
```

## License

Private project

## Contributing

This is a private project. For questions or issues, contact the development team.