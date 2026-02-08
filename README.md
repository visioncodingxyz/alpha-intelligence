# Alpha Intelligence

An advanced AI platform for creators, artists, and innovators. Generate stunning AI images, engage with intelligent chatbots, create NFTs, and interact with cutting-edge AI technology on the Solana blockchain.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Powered by Solana](https://img.shields.io/badge/Powered%20by-Solana-14F195?style=for-the-badge&logo=solana)](https://solana.com)

## Overview

Alpha Intelligence is a comprehensive AI-powered platform that combines image generation, conversational AI, voice chat, and blockchain integration. Built on Next.js and Solana, it offers users the ability to generate AI-created content, manage digital assets, and participate in a rewarding ecosystem.

## Key Features

### 🎨 AI Image Generation
- Advanced AI image generation with customizable styles
- Prompt enhancement powered by AI
- Gallery system with voting and curation
- NSFW content detection and filtering
- Download and share generated images

### 💬 AI Chat & Conversation
- Real-time chat with AI assistants powered by Groq and OpenRouter
- Multi-model support (Claude, GPT, and more)
- Chat history and context management
- Smart prompt enhancement

### 🎤 Voice Chat
- Real-time voice conversation with AI using Hume AI's Empathic Voice Interface (EVI)
- Speech-to-speech interaction
- Natural language understanding

### 🎥 Video Generation
- AI-powered video creation from text prompts
- Integration with advanced video models

### 🎬 NFT Minting
- Mint AI-generated content as NFTs on Solana
- Integration with Solana blockchain
- NFT metadata management

### 💎 Credit System
- Token-based credit system for generating content
- Purchase credits with Solana
- Token burn mechanism
- Revenue sharing for content creators

### 🪙 Token Integration
- Solana wallet integration
- Token swaps via Jupiter API
- Support for custom token launches
- Token purchase tracking and analytics

### 🏪 Community Gallery
- Browse community-created AI art
- Vote on favorite creations
- Top photos marquee
- Community engagement tracking

### 📊 Admin Dashboard
- Content moderation tools
- User management
- Analytics and metrics
- Token burn tracking

## Tech Stack

### Frontend
- **Framework**: Next.js 16 with TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4, CSS-in-JS animations
- **Components**: Radix UI component system
- **3D Graphics**: Three.js, React Three Fiber
- **Forms**: React Hook Form, Zod validation
- **Icons**: Lucide React
- **Themes**: next-themes for dark mode support

### Backend & API
- **Runtime**: Node.js with Next.js API routes
- **AI Integration**: 
  - Groq API for fast LLM inference
  - OpenRouter for multiple AI models
  - Hume AI for voice chat (EVI - Empathic Voice Interface)
- **Image/Video Generation**: Custom integration endpoints
- **API Client**: Vercel AI SDK

### Blockchain & Web3
- **Chain**: Solana
- **Wallet**: Solana Wallet Adapter (React, UI, wallets)
- **Token Standards**: SPL Token protocol
- **DEX Integration**: Jupiter API for token swaps
- **Smart Contract**: Solana Program Library

### Database
- **Primary**: PostgreSQL via Neon (serverless)
- **ORM**: Raw SQL queries with Vercel Postgres
- **Key Tables**: Users, Gallery, Token Purchases, NFTs, Token Burns

### Storage & IPFS
- **File Storage**: Vercel Blob
- **Pinata**: IPFS integration for NFT metadata

### Monitoring & Analytics
- **Analytics**: Vercel Analytics
- **Performance**: Vercel Speed Insights

### Development Tools
- **Package Manager**: pnpm
- **Linting**: ESLint with modern config
- **Build Tool**: Next.js built-in bundler
- **Version Control**: Git

## Installation

### Prerequisites
- Node.js 18+ (LTS recommended)
- pnpm 8+ or npm 9+
- Git
- Solana CLI (optional, for local development)

### Setup Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd alpha-intelligence
```

2. **Install dependencies**
```bash
pnpm install
# or
npm install
```

3. **Configure environment variables**

Create a `.env.local` file in the root directory with the following variables:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/dbname

# Solana
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# AI Services
GROQ_API_KEY=your_groq_api_key
OPENROUTER_API_KEY=your_openrouter_api_key

# Voice Chat (Hume AI)
HUME_API_KEY=your_hume_api_key
HUME_SECRET_KEY=your_hume_secret_key
NEXT_PUBLIC_HUME_CONFIG_ID=your_hume_config_id (optional)

# Image Generation & Storage
PINATA_API_KEY=your_pinata_api_key
PINATA_API_SECRET=your_pinata_api_secret
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token

# Token Swap
JUPITER_API_URL=https://quote-api.jup.ag/v6

# Admin Panel
ADMIN_PASSWORD=secure_admin_password

# Optional: Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_analytics_id
```

4. **Setup Database**

Run the SQL migration scripts:
```bash
# Create users table
psql -f scripts/001-create-users-table.sql

# Create gallery tables
psql -f scripts/000-create-gallery-tables.sql

# Create token purchases table
psql -f scripts/002-create-token-purchases-table.sql

# Create NFTs table
psql -f scripts/create-nfts-table.sql

# Create token burns table
psql -f scripts/create-token-burns-table.sql

# Fix credit columns
psql -f scripts/002_fix_credit_columns_bigint.sql

# Add NSFW column
psql -f scripts/add-nsfw-column.sql
```

5. **Run development server**
```bash
pnpm dev
# or
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
alpha-intelligence/
├── app/                          # Next.js app directory
│   ├── api/                     # API routes
│   │   ├── chat/               # Chat endpoint
│   │   ├── generate-image/      # Image generation
│   │   ├── generate-video/      # Video generation
│   │   ├── generate-nft-image/  # NFT image generation
│   │   ├── mint-nft/           # NFT minting
│   │   ├── gallery/            # Gallery operations
│   │   ├── tokens/             # Token management
│   │   ├── token-purchase/     # Purchase tracking
│   │   ├── token-burn/         # Token burn mechanism
│   │   ├── voice-chat/         # Voice chat (Hume AI)
│   │   ├── admin/              # Admin operations
│   │   └── ...                 # Other endpoints
│   ├── create/                 # Image/video creation page
│   ├── chat/                   # Chat interface
│   ├── voice-chat/             # Voice chat page
│   ├── gallery/                # Community gallery
│   ├── mint-nft/               # NFT minting interface
│   ├── rewards/                # Rewards dashboard
│   ├── admin/                  # Admin panel
│   ├── docs/                   # Documentation
│   ├── whitepaper/             # Project whitepaper
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page
├── components/
│   ├── ui/                     # Radix UI components
│   ├── gl/                     # Three.js/WebGL components
│   ├── header.tsx              # Navigation header
│   ├── hero.tsx                # Hero section
│   ├── credit-system.tsx       # Credit display & management
│   ├── wallet-connect-button.tsx # Solana wallet connection
│   ├── gallery.tsx             # Gallery components
│   ├── token-burn.tsx          # Token burn interface
│   └── ...                     # Other components
├── hooks/
│   ├── use-toast.ts            # Toast notifications
│   └── use-mobile.tsx          # Mobile detection
├── lib/
│   ├── database.ts             # Database utilities
│   ├── credit-system.ts        # Credit logic
│   ├── ai-content-moderator.ts # Content moderation
│   ├── nsfw-detector.ts        # NSFW detection
│   ├── jupiter-api.ts          # Jupiter DEX integration
│   ├── token-swap.ts           # Token swap logic
│   ├── token-burn-tracking.ts  # Token burn tracking
│   ├── token-purchase-tracking.ts # Purchase tracking
│   ├── chat-utils.ts           # Chat utilities
│   ├── user-management.ts      # User operations
│   ├── revshare.ts             # Revenue sharing
│   ├── pinata.ts               # IPFS/Pinata integration
│   └── utils.ts                # General utilities
├── public/                     # Static assets
│   ├── images/                # Image assets
│   └── fonts/                 # Custom fonts
├── styles/
│   └── globals.css            # Global styles
├── scripts/                    # Database migration scripts
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
├── tailwind.config.ts         # Tailwind CSS config
├── next.config.ts             # Next.js config
└── README.md                  # This file
```

## Environment Variables Guide

### Database
- `DATABASE_URL`: PostgreSQL connection string (from Neon)

### Blockchain
- `NEXT_PUBLIC_SOLANA_NETWORK`: Network to use (devnet, testnet, mainnet-beta)
- `NEXT_PUBLIC_SOLANA_RPC_URL`: Solana RPC endpoint

### AI & LLM Services
- `GROQ_API_KEY`: API key from Groq (for fast inference)
- `OPENROUTER_API_KEY`: API key from OpenRouter (multi-model support)

### Voice Chat Integration
- `HUME_API_KEY`: Hume AI API key
- `HUME_SECRET_KEY`: Hume AI secret key
- `NEXT_PUBLIC_HUME_CONFIG_ID`: Hume EVI configuration ID (optional)

See `HUME_SETUP.md` for detailed Hume AI configuration instructions.

### Storage & IPFS
- `PINATA_API_KEY`: Pinata API key
- `PINATA_API_SECRET`: Pinata API secret
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob token

### DEX Integration
- `JUPITER_API_URL`: Jupiter API endpoint

### Admin
- `ADMIN_PASSWORD`: Secure password for admin panel

## API Endpoints

### Image & Content Generation
- `POST /api/generate-image` - Generate AI images
- `POST /api/enhance-prompt` - Enhance prompts with AI
- `POST /api/generate-video` - Generate videos
- `POST /api/generate-token-image` - Generate token images
- `POST /api/generate-nft-image` - Generate NFT artwork

### Chat & Conversation
- `POST /api/chat` - Send chat messages
- `POST /api/voice-chat` - Voice chat interface

### Gallery Management
- `POST /api/gallery/save` - Save gallery item
- `GET /api/gallery/list` - List gallery items
- `GET /api/gallery/top-photos` - Get trending items
- `POST /api/gallery/vote` - Vote on items
- `GET /api/gallery/vote-status` - Check vote status
- `DELETE /api/gallery/delete` - Delete gallery item

### Token Operations
- `POST /api/tokens` - Get token information
- `POST /api/token-purchase` - Record purchase
- `POST /api/save-token` - Save token details
- `POST /api/launch-token` - Launch new token
- `POST /api/upload-token-image` - Upload token image
- `POST /api/generate-token-details` - Generate token metadata

### NFT Operations
- `POST /api/mint-nft` - Mint NFT
- `GET /api/check-mint-status` - Check mint status
- `POST /api/download-image` - Download generated image

### Token Economics
- `POST /api/token-burn` - Record token burn
- `POST /api/revshare` - Calculate revenue sharing

### User Management
- `GET /api/user` - Get user profile
- `POST /api/admin/auth` - Admin authentication

### Admin Tools
- `POST /api/admin/toggle-nsfw` - Toggle NSFW status
- `DELETE /api/admin/delete-image` - Delete image
- `POST /api/hume-token` - Get Hume token

## Database Schema

### Key Tables

**users**
- id (UUID)
- wallet_address (TEXT)
- credits (BIGINT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

**gallery**
- id (UUID)
- user_id (UUID)
- image_url (TEXT)
- prompt (TEXT)
- votes (BIGINT)
- is_nsfw (BOOLEAN)
- content_type (TEXT)
- created_at (TIMESTAMP)

**token_purchases**
- id (UUID)
- user_id (UUID)
- token_address (TEXT)
- amount (DECIMAL)
- tx_hash (TEXT)
- created_at (TIMESTAMP)

**nfts**
- id (UUID)
- user_id (UUID)
- mint_address (TEXT)
- metadata_uri (TEXT)
- created_at (TIMESTAMP)

**token_burns**
- id (UUID)
- user_id (UUID)
- amount (DECIMAL)
- tx_hash (TEXT)
- created_at (TIMESTAMP)

## Build & Deployment

### Build for Production
```bash
pnpm build
# or
npm run build
```

### Start Production Server
```bash
pnpm start
# or
npm start
```

### Deploy to Vercel
1. Push code to GitHub
2. Import repository in Vercel dashboard
3. Add environment variables in project settings
4. Vercel will automatically deploy on push

```bash
# Or deploy from CLI
npm i -g vercel
vercel
```

## Development

### Run Dev Server
```bash
pnpm dev
```

### Lint Code
```bash
pnpm lint
```

### Format Code
```bash
pnpm format  # If configured
```

## Configuration Files

### Next.js Config (`next.config.ts`)
- Image optimization
- Webpack configuration
- Environment setup

### Tailwind Config (`tailwind.config.ts`)
- Custom colors and theming
- Animation configurations
- Plugin setup

### TypeScript Config (`tsconfig.json`)
- Strict mode enabled
- Module resolution settings
- Path aliases (@/)

### PostCSS Config (`postcss.config.mjs`)
- Tailwind CSS integration
- Autoprefixer support

## Security Considerations

1. **Admin Panel**: Password protected with secure authentication
2. **NSFW Detection**: Multiple layers of content filtering
3. **Wallet Verification**: Signed transactions for all blockchain operations
4. **API Keys**: Never commit `.env.local` to version control
5. **CORS**: Configured for specific origins
6. **Rate Limiting**: Implement on API routes in production
7. **Input Validation**: Zod schemas for all user inputs

## Performance Optimization

- Server-side rendering for static content
- Image optimization with Next.js Image component
- Code splitting and lazy loading
- Caching strategies for API responses
- WebGL optimization for 3D visualizations
- Database query optimization with indexes

## Troubleshooting

### Common Issues

**Issue**: Solana wallet not connecting
- Solution: Ensure wallet extension is installed and network matches configuration

**Issue**: Image generation timeout
- Solution: Check API key quotas and rate limits with provider

**Issue**: Database connection errors
- Solution: Verify `DATABASE_URL` and network connectivity to Neon

**Issue**: Hume voice chat not working
- Solution: Verify `HUME_API_KEY` and `HUME_SECRET_KEY` are set correctly

**Issue**: Token swap failing
- Solution: Check Jupiter API status and liquidity for token pair

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is proprietary. Unauthorized copying or distribution is prohibited.

## Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Contact: support@alphaintelligence.ai
- Documentation: https://alphaintelligence.ai/docs

## Acknowledgments

- Built with [Next.js](https://nextjs.org)
- UI Components from [Radix UI](https://radix-ui.com)
- Styling with [Tailwind CSS](https://tailwindcss.com)
- 3D Graphics with [Three.js](https://threejs.org)
- Blockchain: [Solana](https://solana.com)
- AI Models: [Groq](https://groq.com), [OpenRouter](https://openrouter.ai)
- Voice AI: [Hume AI](https://hume.ai)
- DEX: [Jupiter](https://jup.ag)

---

**Alpha Intelligence** - Powered by advanced AI and blockchain technology
