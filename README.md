# AiFi - Tokenized AI Agent Platform

A decentralized platform built on Solana that empowers users to create, customize, deploy, and monetize personalized AI agents with unique personalities. Built with Next.js, React, and integrated with leading AI models (Claude, GPT-4, Gemini).

![AiFi - Tokenized AI Agent Platform](./public/og-image.png)

## 🚀 Overview

AiFi is a Web3-enabled platform that bridges artificial intelligence with blockchain technology. Users can:

- **Create Custom AI Agents**: Build AI agents with unique personalities and behaviors
- **Deploy on Solana**: Leverage the Solana blockchain for efficient, low-cost operations
- **Tokenize & Monetize**: Create tokens for your agents and earn through revenue sharing
- **Interact & Trade**: Chat with agents, trade agent tokens, and access exclusive features
- **Share & Discover**: Explore a marketplace of community-created agents

## ✨ Key Features

### AI Agent Creation & Management
- **AI Studio**: Intuitive interface for designing custom AI agents
- **Multi-Model Support**: Integration with Claude, GPT-4, and Gemini
- **Prompt Engineering**: Enhance and optimize prompts before deployment
- **Configuration Management**: Control agent behavior, personality, and parameters
- **Version Control**: Track and manage different versions of your agents

### Blockchain Integration
- **Solana Wallet Support**: Connect via Phantom, Solflare, Genesis wallets
- **Token Creation**: Mint tokens for your AI agents (Pump.fun, Raydium, Meteora integration)
- **Revenue Sharing**: Earn through token trades and platform interactions
- **Transaction Tracking**: View wallet balance, transaction history, and rewards
- **Smart Contracts**: Secure, transparent on-chain operations

### Marketplace & Discovery
- **Agent Explorer**: Browse and discover community-created AI agents
- **Agent Profiles**: View agent details, creator info, and interaction metrics
- **Public Agents**: Share your agents publicly or keep them private
- **Token Marketplace**: Trade agent tokens on integrated DEXs

### User Dashboard
- **Profile Management**: Customize avatar, username, and bio
- **Agent Analytics**: Track usage, performance, and earnings
- **Token Distribution**: Monitor holdings and manage rewards
- **Settings & Preferences**: Personalize your experience

### Chat & Interaction
- **Real-time Chat**: Engage with AI agents in real-time
- **Conversation History**: Save and reference past interactions
- **Message Enhancement**: Automatic prompt optimization
- **Multi-Agent Support**: Interact with different agents seamlessly

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14.2 with React 19
- **Styling**: Tailwind CSS with custom components
- **UI Components**: Radix UI library (50+ pre-built components)
- **State Management**: React Hooks
- **Forms**: React Hook Form with Zod validation
- **Charts & Visualization**: Recharts

### Backend
- **Runtime**: Node.js with Next.js API routes
- **Database**: Neon (PostgreSQL serverless)
- **File Storage**: Vercel Blob
- **Analytics**: Vercel Analytics

### AI & LLMs
- **AI SDK**: Vercel AI SDK (5.0.57)
  - Anthropic Claude
  - OpenAI GPT-4
  - Google Gemini
- **Model Integration**: Multi-provider LLM support with unified API

### Blockchain
- **Solana**: Web3.js integration
- **Wallet Adapters**: Support for multiple Solana wallets
  - Phantom
  - Solflare
  - Genesis
  - And more...
- **DEX Integration**:
  - Pump.fun (token launching)
  - Raydium (liquidity pools)
  - Meteora (concentrated liquidity)
- **Blockchain Explorer**: Solscan proxy integration

### Additional Libraries
- **Icons**: Lucide React, React Icons
- **Dates**: date-fns
- **Utilities**: clsx, class-variance-authority
- **Toast Notifications**: Sonner
- **UI Animations**: Tailwind CSS Animate

## 📁 Project Structure

```
ai-fi/
├── app/
│   ├── api/                          # API routes
│   │   ├── ai-configurations/        # AI agent endpoints
│   │   ├── chat/                     # Chat functionality
│   │   ├── tokens/                   # Token management
│   │   ├── users/                    # User management
│   │   ├── rewards/                  # Rewards system
│   │   ├── distributions/            # Token distributions
│   │   ├── upload/                   # File uploads
│   │   ├── proxy/                    # External API proxies
│   │   ├── enhance-prompt/           # Prompt optimization
│   │   └── ...more endpoints
│   ├── page.tsx                      # Main page
│   ├── layout.tsx                    # Root layout with metadata
│   ├── globals.css                   # Global styles
│   └── actions.ts                    # Server actions
├── components/
│   ├── ui/                           # Radix UI components
│   ├── dashboard.tsx                 # Main dashboard component
│   ├── scrolling-ai-agents.tsx       # Agent carousel
│   ├── token-creation-form.tsx       # Token creation UI
│   ├── image-upload.tsx              # Image upload handler
│   ├── view-toggle.tsx               # View switcher
│   └── theme-provider.tsx            # Theme configuration
├── hooks/
│   ├── use-toast.ts                  # Toast notifications
│   └── use-mobile.tsx                # Mobile detection
├── lib/
│   ├── utils.ts                      # Utility functions
│   ├── revshare.ts                   # Revenue sharing logic
│   ├── pumpfun.ts                    # Pump.fun integration
│   ├── raydium.ts                    # Raydium integration
├── public/                           # Static assets
│   ├── images/                       # Images and design assets
│   └── logos/                        # Partner logos
├── scripts/                          # Database migration scripts
│   ├── 001_create_users_table.sql
│   ├── 002_create_ai_configurations_table.sql
│   ├── 005_create_tokens_table.sql
│   └── ...
├── styles/                           # CSS files
├── types/                            # TypeScript types
├── dashboard.tsx                     # Main dashboard (large component)
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.mjs
└── postcss.config.mjs
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or pnpm 8+
- A Solana wallet (Phantom, Solflare, or Genesis)
- Environment variables configured

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-username/ai-fi.git
cd ai-fi
```

2. **Install dependencies**
```bash
npm install
# or
pnpm install
```

3. **Set up environment variables**
Create a `.env.local` file in the root directory:
```env
# Database
DATABASE_URL=your_neon_postgres_url

# AI Model APIs
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_GENERATIVE_AI_KEY=your_google_key

# Storage
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token

# Blockchain
SOLANA_RPC_ENDPOINT=https://api.mainnet-beta.solana.com

# Analytics (optional)
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_analytics_id
```

4. **Run database migrations**
```bash
# Review and execute SQL scripts from /scripts directory
# Using your Neon dashboard or psql CLI:
psql $DATABASE_URL < scripts/001_create_users_table.sql
psql $DATABASE_URL < scripts/002_create_ai_configurations_table.sql
# ... etc for other migration scripts
```

5. **Start the development server**
```bash
npm run dev
# or
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

## 📝 Usage Guide

### Creating an AI Agent

1. **Connect Wallet**: Click wallet icon and select your Solana wallet
2. **Navigate to AI Studio**: Select "Create" or "AI Studio"
3. **Configure Agent**:
   - Set agent name and description
   - Choose AI model (Claude, GPT-4, Gemini)
   - Write system prompt defining personality
   - Adjust parameters and settings
4. **Test & Deploy**: Test your agent, then publish to the platform
5. **Monetize**: Create a token for your agent (optional)

### Interacting with Agents

1. **Browse Agents**: Go to "Explore" section
2. **Select an Agent**: Click on an agent card
3. **Chat**: Send messages and interact with the agent
4. **Share**: Share agent links or purchase tokens

### Managing Tokens

1. **Create Token**: In agent settings, mint a token
2. **View Holdings**: Check wallet and holdings in dashboard
3. **Trade**: Trade tokens on integrated DEXs
4. **Earn Rewards**: Receive revenue shares from agent interactions

## 🔌 API Endpoints

### AI Configurations
- `POST /api/ai-configurations` - Create new AI agent
- `GET /api/ai-configurations` - List all agents
- `GET /api/ai-configurations/[id]` - Get agent details
- `PUT /api/ai-configurations/[id]` - Update agent
- `DELETE /api/ai-configurations/[id]` - Delete agent
- `GET /api/ai-configurations/user/[walletAddress]` - Get user's agents
- `GET /api/ai-configurations/by-name/[slug]` - Get agent by name

### Chat
- `POST /api/chat` - Send message to AI agent

### Tokens
- `POST /api/tokens` - Create token for agent
- `GET /api/tokens` - List tokens
- `GET /api/tokens/[id]` - Get token details

### Users
- `POST /api/users` - Create user profile
- `GET /api/users` - Get user details
- `PUT /api/users/update` - Update profile
- `POST /api/users/check-username` - Validate username

### Additional
- `POST /api/upload` - Upload files
- `POST /api/enhance-prompt` - Enhance prompt with AI
- `GET /api/rewards` - Get user rewards
- `GET /api/distributions` - Get token distributions

## 🎨 UI Components

The project includes comprehensive pre-built Radix UI components:

- **Forms**: Input, Label, Field, Textarea, Checkbox, Radio, Select
- **Data Display**: Table, Card, Avatar, Badge, Progress, Skeleton
- **Feedback**: Alert, Toast, Dialog, Sheet, Popover, Dropdown
- **Navigation**: Tabs, NavigationMenu, Breadcrumb, Pagination
- **Input**: Slider, Toggle, Switch, InputOTP
- **Utilities**: Separator, Tooltip, ScrollArea, Resizable

## 🌙 Theming

The application supports light and dark modes with Next.js Themes:

- Theme provider configured in `components/theme-provider.tsx`
- Tailwind CSS dark mode support
- Automatic system preference detection

## 📦 Building for Production

```bash
npm run build
npm run start
```

The application will be optimized and ready for deployment:
- Static optimization of Next.js pages
- Code splitting and lazy loading
- Asset compression and caching

## 🔐 Security Considerations

- Environment variables for sensitive keys
- Wallet signature verification for user authentication
- SQL injection prevention through parameterized queries
- CORS and CSP headers configuration
- Input validation with Zod schema

## 🌐 Deployment

### Vercel (Recommended)
```bash
vercel
```

### Docker
```bash
docker build -t ai-fi .
docker run -p 3000:3000 ai-fi
```

### Other Platforms
- Railway
- Render
- AWS Lambda + API Gateway
- Google Cloud Run

## 📈 Performance Optimization

- Next.js Image optimization
- Automatic code splitting
- CSS and JS minification
- Server-side rendering and static generation
- API route optimization
- Database connection pooling

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Vercel** for Next.js and deployment infrastructure
- **Radix UI** for accessible component primitives
- **Solana** for blockchain integration
- **Anthropic, OpenAI, Google** for AI model access
- **Pump.fun, Raydium, Meteora** for DEX integrations

## 📞 Support & Contact

- **Website**: https://genesisai.app / https://aifi.app
- **Twitter**: @TryGenesisAI
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Custom model fine-tuning
- [ ] Agent marketplace with ratings
- [ ] Advanced revenue sharing models
- [ ] Multi-chain support
- [ ] AI agent guilds and communities
- [ ] Governance and DAO features

---

**Built with ❤️ using Next.js, Solana, and cutting-edge AI**
