# Hume AI Integration Setup

## Required Environment Variables

To use the Hume AI voice chat functionality, you need to add the following environment variables to your Vercel project:

1. **HUME_API_KEY** - Your Hume AI API key
2. **HUME_SECRET_KEY** - Your Hume AI secret key
3. **NEXT_PUBLIC_HUME_CONFIG_ID** - Your Hume AI EVI configuration ID (optional)

## How to get your keys:

1. Visit [Hume AI Platform](https://platform.hume.ai/settings/keys)
2. Log in to your account
3. Navigate to the API keys page
4. Generate your API key and Secret key
5. For the Config ID, go to the EVI section and create or copy an existing configuration ID

## How to add to Vercel:

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add `HUME_API_KEY`, `HUME_SECRET_KEY`, and optionally `NEXT_PUBLIC_HUME_CONFIG_ID` with their respective values
4. Make sure to add them for all environments (Production, Preview, Development)

## Usage:

Once the environment variables are set up, the voice chat will be available when you:
1. Go to the `/chat` page
2. Click on "Voice Mode" in the top left
3. Select "Standard" from the dropdown
4. The voice chat interface will open and connect to Hume AI's EVI (Empathic Voice Interface)

The voice chat provides real-time speech-to-speech conversation with AI using Hume's empathic voice technology.
