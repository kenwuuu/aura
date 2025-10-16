# WebRTC Setup Guide

This guide covers setting up the necessary infrastructure for WebRTC connectivity in the Aura application.

## Overview

WebRTC requires two types of servers for peer-to-peer connections:

1. **STUN Server**: Helps peers discover their public IP addresses
2. **TURN Server**: Relays traffic when direct P2P connection fails
3. **Signaling Server**: Coordinates the initial connection handshake (provided by y-webrtc)

## Quick Start (Using Public Servers)

The application comes pre-configured with public servers that work for testing:

```typescript
// Default STUN servers (already configured)
{ urls: 'stun:stun.l.google.com:19302' }
{ urls: 'stun:global.stun.twilio.com:3478' }

// Default signaling servers (already configured)
'wss://signaling.yjs.dev'
'wss://y-webrtc-signaling-eu.herokuapp.com'
'wss://y-webrtc-signaling-us.herokuapp.com'
```

**No setup required** - just run `npm run dev` and start testing!

## Production Setup (Recommended)

For production use, you should set up your own servers for better reliability and control.

### Option 1: Self-Hosted TURN Server with Coturn

#### Step 1: Server Requirements

- Ubuntu 20.04+ or similar Linux distribution
- Public static IP address
- Open ports: 3478 (TCP/UDP), 443 (TCP/UDP), 49152-65535 (UDP)
- Domain name (optional but recommended)
- SSL certificate (required for production)

#### Step 2: Install Coturn

```bash
# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install coturn
sudo apt-get install coturn -y

# Enable coturn service
sudo nano /etc/default/coturn
# Uncomment: TURNSERVER_ENABLED=1
```

#### Step 3: Configure Coturn

Edit `/etc/turnserver.conf`:

```bash
# Basic settings
listening-port=3478
tls-listening-port=5349
listening-ip=YOUR_SERVER_IP
external-ip=YOUR_PUBLIC_IP

# Authentication
lt-cred-mech
use-auth-secret
static-auth-secret=GENERATE_A_STRONG_SECRET_HERE
realm=turn.yourdomain.com

# SSL certificates (for production)
cert=/etc/letsencrypt/live/turn.yourdomain.com/cert.pem
pkey=/etc/letsencrypt/live/turn.yourdomain.com/privkey.pem

# Ports for relay
min-port=49152
max-port=65535

# Security
fingerprint
no-multicast-peers
no-cli
no-tlsv1
no-tlsv1_1

# Performance
user-quota=12
total-quota=1200
```

#### Step 4: Get SSL Certificate (Let's Encrypt)

```bash
sudo apt-get install certbot -y
sudo certbot certonly --standalone -d turn.yourdomain.com
```

#### Step 5: Start Coturn

```bash
sudo systemctl restart coturn
sudo systemctl enable coturn
sudo systemctl status coturn
```

#### Step 6: Configure Firewall

```bash
# Allow TURN ports
sudo ufw allow 3478/tcp
sudo ufw allow 3478/udp
sudo ufw allow 5349/tcp
sudo ufw allow 5349/udp
sudo ufw allow 49152:65535/udp
```

#### Step 7: Update Application Code

Edit `src/modules/webrtc/WebRTCProvider.ts`:

```typescript
iceServers: [
  {
    urls: 'stun:turn.yourdomain.com:3478'
  },
  {
    urls: 'turn:turn.yourdomain.com:3478',
    username: 'user',
    credential: 'GENERATE_A_STRONG_SECRET_HERE'
  },
  {
    urls: 'turns:turn.yourdomain.com:5349',
    username: 'user',
    credential: 'GENERATE_A_STRONG_SECRET_HERE'
  }
]
```

#### Step 8: Test Your TURN Server

Use this website to test: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/

### Option 2: Twilio STUN/TURN (Managed Service)

Twilio offers managed TURN servers with pay-as-you-go pricing.

#### Step 1: Sign Up

1. Go to https://www.twilio.com/
2. Sign up for an account
3. Navigate to the TURN service

#### Step 2: Get Credentials

```bash
curl -X POST https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID/Tokens.json \
  --user YOUR_ACCOUNT_SID:YOUR_AUTH_TOKEN
```

#### Step 3: Update Application Code

```typescript
// Example response from Twilio
iceServers: [
  {
    urls: 'stun:global.stun.twilio.com:3478'
  },
  {
    urls: 'turn:global.turn.twilio.com:3478?transport=udp',
    username: 'generated-username',
    credential: 'generated-credential'
  },
  {
    urls: 'turn:global.turn.twilio.com:3478?transport=tcp',
    username: 'generated-username',
    credential: 'generated-credential'
  }
]
```

#### Step 4: Implement Dynamic Credentials

Create a backend endpoint to generate short-lived credentials:

```typescript
// Example: Generate credentials on your backend
async function getTwilioCredentials() {
  const response = await fetch('https://your-backend.com/api/turn-credentials');
  const data = await response.json();
  return data.iceServers;
}

// Use in your app
const iceServers = await getTwilioCredentials();
```

### Option 3: Cloudflare Calls

Cloudflare offers TURN services as part of Cloudflare Calls.

#### Step 1: Enable Cloudflare Calls

1. Sign up at https://dash.cloudflare.com/
2. Enable Calls in your account
3. Get your API credentials

#### Step 2: Update Code

```typescript
iceServers: [
  {
    urls: 'stun:stun.cloudflare.com:3478'
  },
  {
    urls: 'turn:turn.cloudflare.com:3478',
    username: 'your-cloudflare-username',
    credential: 'your-cloudflare-credential'
  }
]
```

## Custom Signaling Server Setup

While y-webrtc provides default signaling servers, you can run your own for better control.

### Step 1: Clone and Setup

```bash
# Clone the y-webrtc repository
git clone https://github.com/yjs/y-webrtc.git
cd y-webrtc/bin

# Install dependencies
npm install
```

### Step 2: Run the Signaling Server

```bash
# Start on port 4444
PORT=4444 node server.js
```

### Step 3: Deploy to Production

Use PM2 for process management:

```bash
# Install PM2
npm install -g pm2

# Start with PM2
PORT=4444 pm2 start server.js --name "y-webrtc-signaling"
pm2 save
pm2 startup
```

### Step 4: Add SSL with Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name signaling.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/signaling.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/signaling.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:4444;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Step 5: Update Application

Edit `src/modules/webrtc/WebRTCProvider.ts`:

```typescript
signalingServers: ['wss://signaling.yourdomain.com']
```

## Testing Your Setup

### Test STUN/TURN Connectivity

Use the Trickle ICE test: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/

1. Enter your TURN server details
2. Click "Gather candidates"
3. Look for "relay" candidates - these confirm TURN is working

### Test the Application

1. Open the app in two different browsers (or incognito mode)
2. Use the same room URL
3. Check the connection status in the UI
4. Try drawing and moving cards - they should sync in real-time

### Debug WebRTC Issues

Check browser console:

```typescript
// Add to WebRTCProvider.ts for debugging
this.provider.on('peers', (event) => {
  console.log('Peers changed:', event);
});

this.provider.room.on('peer', (peer) => {
  console.log('New peer connected:', peer);
});
```

## Network Considerations

### Firewall Rules

**Client-side (Browser):**
- Outbound: UDP/TCP 3478, 5349
- Outbound: UDP 49152-65535 (for media)

**Server-side (TURN Server):**
- Inbound: UDP/TCP 3478, 5349
- Inbound: UDP 49152-65535

### NAT Types and Connectivity

| Your NAT | Peer NAT | STUN Only | TURN Needed |
|----------|----------|-----------|-------------|
| Full Cone | Any | ✓ | ✗ |
| Restricted | Restricted | ✓ | ✗ |
| Port Restricted | Port Restricted | ✓ | ✗ |
| Symmetric | Symmetric | ✗ | ✓ |

### Bandwidth Requirements

- Audio: ~50-100 kbps per peer
- Video (720p): ~1-2 Mbps per peer
- Data only (Aura): ~10-50 kbps per peer

## Cost Estimates

### Self-Hosted (Coturn)

- VPS: $5-20/month (DigitalOcean, Linode, AWS)
- Bandwidth: Usually included up to 1TB
- Domain: $10-15/year
- SSL: Free (Let's Encrypt)

**Total: ~$60-240/year**

### Twilio

- Usage-based pricing
- ~$0.0005 per minute per participant
- 1000 minutes = ~$0.50

**Total: Pay as you grow**

### Cloudflare Calls

- Check current pricing at Cloudflare

## Security Best Practices

1. **Always use TLS/WSS** in production
2. **Rotate credentials** regularly (at least monthly)
3. **Use time-limited credentials** via your backend
4. **Rate limit** signaling server connections
5. **Monitor usage** to detect abuse
6. **Implement authentication** for room access

## Troubleshooting

### "Waiting for peers..." Never Resolves

- Check if signaling servers are reachable
- Verify firewall allows WebSocket connections
- Try different signaling servers

### Peers Connect But Don't Sync

- Check browser console for Yjs errors
- Verify both clients are on the same Yjs document
- Check network tab for failed WebRTC connections

### Connection Drops Frequently

- Use TURN server (not just STUN)
- Check network stability
- Verify TURN server has adequate bandwidth
- Consider regional TURN servers closer to users

### High Latency

- Use TURN servers in same region as users
- Check server load and bandwidth
- Consider multiple regional servers
- Optimize Yjs document size

## Additional Resources

- [Coturn Documentation](https://github.com/coturn/coturn)
- [WebRTC Troubleshooting](https://webrtc.org/getting-started/testing)
- [Yjs Documentation](https://docs.yjs.dev/)
- [y-webrtc GitHub](https://github.com/yjs/y-webrtc)