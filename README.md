# Aura - Magic: The Gathering Collaboration App

A real-time collaboration app for playing Magic: The Gathering with friends using WebRTC and Yjs for peer-to-peer synchronization.

## Features

- **Real-time Collaboration**: Peer-to-peer synchronization using Yjs and y-webrtc
- **Per-Player Resources**: Each player has their own deck, hand, life total, discard pile, and exile pile
- **Private Hands**: Only you can see your hand - opponents cannot
- **Interactive Whiteboard**: Dark-themed canvas for placing and moving cards with automatic perspective transformation
- **Opponent View Transformation**: Cards you play at the bottom of your screen appear at the top for opponents
- **Shared Life Totals**: Anyone can modify any player's life total (visible in top-right corner for opponents)
- **Drag-and-Drop**: Move cards around the whiteboard in real-time
- **Multi-User Support**: Connect with multiple players in the same room

## Architecture

The application follows a modular architecture designed for easy component replacement:

```
src/
├── modules/
│   ├── deck/              # Card deck management (swappable)
│   ├── player/            # Per-player state management
│   ├── gameResourcesDock/ # UI for hand, deck, piles, and life
│   ├── whiteboard/        # Canvas with coordinate transformation
│   └── webrtc/            # P2P connection via Yjs + y-webrtc
├── index.ts               # Application entry point
└── style.css              # UI styling
```

### Module Design

Each module is designed to be independently replaceable:

- **Deck Module**: Swap with different deck implementations, card databases, or shuffle algorithms
- **Player Module**: Replace with different state management solutions
- **GameResourcesDock Module**: Customize UI layout or add new game zones
- **Whiteboard Module**: Replace with canvas-based, WebGL, or other rendering solutions
- **WebRTC Module**: Switch between y-webrtc, PeerJS, socket.io, or other P2P providers

### Key Architectural Decisions

1. **Separate Player States**: Each player has their own Yjs map (`player-{playerId}`) containing:
   - Health/life total
   - Hand (private to owner)
   - Deck card count
   - Discard pile
   - Exile pile

2. **Coordinate Transformation**: Cards are stored with absolute coordinates, but displayed with transformed coordinates for opponents. When you play a card at the bottom of your screen (your playmat area), it appears at the top of your opponent's screen (their view of your playmat).

3. **Shared Whiteboard**: All cards on the battlefield are stored in a shared Yjs map with owner tracking for proper coordinate transformation.

## Prerequisites

Before running the application, you need:

1. **Node.js** (v18 or higher)
2. **STUN/TURN Servers** (optional - defaults are provided, see [WEBRTC_SETUP.md](./WEBRTC_SETUP.md))

## Installation

```bash
npm install
```

## Running the Application

### Development Mode

```bash
npm run dev
```

This starts the Vite development server. Open the URL shown in the terminal (usually `http://localhost:5173`).

### Production Build

```bash
npm run build
npm run preview
```

## How to Use

### Starting a Game

1. Open the application in your browser
2. A unique room ID is automatically generated and added to the URL
3. Share the full URL (including `?room=...`) with other players
4. Other players open the same URL to join your room
5. Connection status shows in the top toolbar

### Playing the Game

#### Your Resources (Bottom Dock)

From left to right:
- **Exile Pile**: Shows count of exiled cards (purple)
- **Discard Pile**: Shows count of cards in graveyard (red)
- **Hand**: Your private hand of cards - click a card to play it to the battlefield (center)
- **Deck**: Shows remaining cards, click "Draw" to draw a card (blue)
- **Life Total**: Your life/health with +/- buttons (green)

#### Battlefield (Center Area)

- **Your Playmat**: Bottom portion of the screen
- **Opponent's Playmat**: Top portion of the screen (automatically transformed)
- **Drag Cards**: Click and drag any card to move it
- **Coordinate Transformation**: Cards you place at the bottom appear at the top for your opponent

#### Opponent Information (Top Right)

- **Opponent Life**: Shows each opponent's life total in red
- Life totals are editable by anyone using the +/- buttons on your own life display
- No other opponent resources are visible (private hand, deck count, etc.)

### Game Flow Example

1. Click "Draw" on your deck to draw a card
2. Card appears in your hand (only you can see it)
3. Click a card in your hand to play it
4. Card appears on the battlefield in your playmat area (bottom)
5. Your opponent sees the same card in their view of your playmat (top of their screen)
6. Either player can drag the card around the battlefield
7. Use +/- buttons to adjust life totals as damage is dealt

### Room Management

- Each session generates a unique room ID: `mtg-xxxxxx`
- Share the complete URL to invite players
- All players in the same room see the same battlefield state
- Each player maintains their own private hand and deck

## Network Requirements

See [WEBRTC_SETUP.md](./WEBRTC_SETUP.md) for detailed network configuration.

### Quick Summary

- **Default STUN servers** are pre-configured (Google, Twilio)
- **Default signaling servers** are pre-configured (Yjs public servers)
- Works out-of-the-box for most home networks
- For production or restrictive networks, set up your own TURN server

## Development

### Project Structure

```
aura/
├── src/
│   ├── modules/
│   │   ├── deck/              # Deck management
│   │   │   ├── Deck.ts        # Core deck logic
│   │   │   ├── types.ts       # Card and config types
│   │   │   └── index.ts       # Module exports
│   │   ├── player/            # Player state management
│   │   │   ├── Player.ts      # Player state with Yjs sync
│   │   │   ├── types.ts       # Player state types
│   │   │   └── index.ts       # Module exports
│   │   ├── gameResourcesDock/ # UI for player resources
│   │   │   ├── GameResourcesDock.ts          # Main dock UI
│   │   │   ├── OpponentHealthDisplay.ts      # Opponent life display
│   │   │   ├── types.ts                      # Dock config types
│   │   │   └── index.ts                      # Module exports
│   │   ├── whiteboard/        # Battlefield canvas
│   │   │   ├── Whiteboard.ts  # Canvas with coordinate transform
│   │   │   ├── types.ts       # Card and config types
│   │   │   └── index.ts       # Module exports
│   │   └── webrtc/            # WebRTC provider
│   │       ├── WebRTCProvider.ts  # Yjs + y-webrtc wrapper
│   │       ├── types.ts           # Connection types
│   │       └── index.ts           # Module exports
│   ├── index.ts               # Application entry point
│   └── style.css              # Global styles
├── index.html                 # HTML entry point
├── package.json
├── tsconfig.json
├── vite.config.ts
├── README.md                  # This file
└── WEBRTC_SETUP.md           # Detailed WebRTC setup guide
```

### Code Organization Principles

1. **Module Independence**: Each module can be developed and tested independently
2. **Clear Interfaces**: All modules export typed interfaces
3. **Yjs Integration**: State synchronization is encapsulated within modules
4. **Event-Driven**: Modules communicate via events (e.g., `playCard` event)

### Extending the Application

#### Adding New Card Zones

1. Update `PlayerState` in `src/modules/player/types.ts`
2. Add methods to `Player.ts` to manage the new zone
3. Add UI components in `GameResourcesDock.ts`
4. Style the new zone in `style.css`

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

Example: Integrate with Scryfall API, load from JSON, or use a custom format.

#### Switching Rendering Engine

Replace `src/modules/whiteboard/Whiteboard.ts`:

```typescript
export interface RenderAdapter {
  addCard(card: Card, ownerId: string): void;
  updateCardPosition(cardId: string, x: number, y: number): void;
  removeCard(cardId: string): void;
  destroy(): void;
}
```

Example: Use Pixi.js, Three.js, or HTML5 Canvas.

#### Switching P2P Provider

Replace `src/modules/webrtc/WebRTCProvider.ts`:

```typescript
export interface RTCAdapter {
  onStatusChange(callback: (status: ConnectionStatus) => void): void;
  getConnectionStatus(): ConnectionStatus;
  getRoomName(): string;
  destroy(): void;
}
```

Example: Use PeerJS, socket.io with WebRTC, or a custom signaling solution.

### Understanding Coordinate Transformation

The whiteboard uses a mirroring transformation so each player sees their playmat at the bottom:

```typescript
// In Whiteboard.ts
private transformCoordinates(card: WhiteboardCard): { x: number; y: number } {
  if (card.ownerId === this.config.localPlayerId) {
    // Your cards: no transformation
    return { x: card.x, y: card.y };
  } else {
    // Opponent's cards: mirror horizontally and vertically
    return {
      x: this.config.width - card.x - 63,   // Flip X axis
      y: this.config.height - card.y - 88,  // Flip Y axis
    };
  }
}
```

**Key Insight**: Stored coordinates are absolute. Display coordinates are transformed per-viewer.

## Troubleshooting

### Cards Disappearing

**Fixed**: The bug where cards disappeared when drawing was caused by non-synced `maxZIndex`. Now `maxZIndex` is updated from Yjs observations to stay consistent across all clients.

### Peers Not Connecting

1. Check browser console for WebRTC errors
2. Verify firewall allows WebSocket connections
3. Try using a TURN server (see [WEBRTC_SETUP.md](./WEBRTC_SETUP.md))

### Cards Not Syncing

1. Ensure all peers are in the same room (check URL)
2. Verify WebRTC connection status in toolbar
3. Check browser console for Yjs errors

### Hand Not Showing

1. Hands are private - you only see your own hand
2. Check that you've drawn cards from your deck
3. Verify `playerId` is correctly set

### Opponent Life Not Visible

1. Opponent health appears after they join the room
2. Check top-right corner for the red health display
3. Takes ~1 second to discover new peers

## Performance Tips

- Limit cards on the battlefield to < 100 for smooth performance
- Use fewer simultaneous peers (2-4 players recommended)
- Close other browser tabs to free resources
- Use a modern browser (Chrome, Firefox, Edge)

## Contributing

This is a private project. For questions or feature requests, contact the development team.

### Development Workflow

1. Create a feature branch
2. Make changes with clear commit messages
3. Test with multiple clients (open multiple browser windows)
4. Update documentation if adding new features
5. Submit a pull request

## Future Enhancements

Potential features to add:

- **Card Images**: Integrate with Scryfall API to show real MTG cards
- **Tap/Untap Animation**: Visual feedback for tapped cards
- **Card Search**: Search and add cards from a database
- **Token Creation**: Generate token creatures
- **Counters**: Add +1/+1 counters or other markers to cards
- **Chat**: Text chat between players
- **Turn Management**: Track whose turn it is
- **Phase Indicators**: Show current game phase
- **Dice Roller**: Built-in dice for random effects
- **Replay System**: Record and replay games

## License

Private project

## Support

For bugs or questions:
1. Check this README and [WEBRTC_SETUP.md](./WEBRTC_SETUP.md)
2. Search existing issues in the project repository
3. Contact the development team

---

**Quick Start Checklist:**
- [ ] Run `npm install`
- [ ] Run `npm run dev`
- [ ] Open the URL in your browser
- [ ] Share the URL with friends to play together
- [ ] Read [WEBRTC_SETUP.md](./WEBRTC_SETUP.md) if you encounter connection issues