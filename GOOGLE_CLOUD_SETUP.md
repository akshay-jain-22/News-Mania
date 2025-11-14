# Google Cloud Integration Setup

This guide explains how to set up Google Cloud services for Newsurf's AI features.

## Services Used

1. **Google Gemini AI** - For summarization, fact-checking, chat responses, and personalization
2. **Google Cloud Speech-to-Text** - For voice input transcription
3. **Google Cloud Text-to-Speech** - For voice output (responses)

## Environment Variables Required

Add these to your `.env.local` file or Vercel environment variables:

### 1. Google Generative AI API Key

\`\`\`env
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here
\`\`\`

Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### 2. Google Cloud Service Account Credentials

\`\`\`env
GOOGLE_CLOUD_CREDENTIALS={"type":"service_account","project_id":"your-project-id",...}
\`\`\`

This should be the entire JSON service account key file, minified into a single line.

#### How to Get Service Account Credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Enable the following APIs:
   - Cloud Text-to-Speech API
   - Cloud Speech-to-Text API
   - Generative Language API (Gemini)
4. Go to **IAM & Admin** → **Service Accounts**
5. Click **Create Service Account**
6. Give it a name (e.g., "voice-assistant-sa")
7. Grant these roles:
   - Cloud Speech Administrator
   - Cloud Text-to-Speech Admin
8. Click **Keys** → **Add Key** → **Create New Key** → **JSON**
9. Download the JSON file
10. Minify it to a single line (remove all newlines)
11. Add it to your environment variable

**Security Note:** Never commit service account credentials to Git. Always use environment variables.

### 1. Google Cloud Service Account (Required for STT/TTS)

\`\`\`bash
GOOGLE_CLOUD_SERVICE_ACCOUNT='{"type":"service_account","project_id":"voiceassistantapp-477819","private_key_id":"49da5a5ab0660aa5c55023a84a50cd71eb23b38b","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDkw8bVAWmDAXZU\n...","client_email":"voice-assistant-sa@voiceassistantapp-477819.iam.gserviceaccount.com",...}'
\`\`\`

**Your credentials are already configured!** The service account for project `voiceassistantapp-477819` has been provided. Just add it to your environment variables.

## Configuration Format

The service account JSON should look like this (minified):

\`\`\`json
{"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...@....iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"...","universe_domain":"googleapis.com"}
\`\`\`

## Features Enabled

Once configured, the following features will use Google Cloud services:

### AI Features (Gemini)
- ✅ Article summarization
- ✅ Fact-checking and credibility assessment
- ✅ Personalized news recommendations
- ✅ Voice assistant chat responses
- ✅ News context understanding

### Voice Features (Speech-to-Text & Text-to-Speech)
- ✅ High-quality voice recognition (replaces Web Speech API)
- ✅ Natural-sounding voice responses
- ✅ Multiple voice options
- ✅ Better accuracy in noisy environments

## Fallback Behavior

The system is designed with graceful fallbacks:

1. **Gemini AI**: Falls back to Groq → OpenAI → text extraction
2. **Speech-to-Text**: Falls back to browser Web Speech API
3. **Text-to-Speech**: Falls back to browser SpeechSynthesis API

This ensures the app continues working even if Google Cloud credentials are not configured.

## Cost Considerations

- **Gemini AI**: Free tier with generous limits
- **Speech-to-Text**: First 60 minutes/month free, then $0.006/15 seconds
- **Text-to-Speech**: First 1M characters/month free (WaveNet voices)

Monitor usage in [Google Cloud Console](https://console.cloud.google.com/billing)

## Testing

After setting up credentials, test the integration:

1. Open the Newsurf voice assistant
2. Try speaking or typing a question
3. Check the browser console for "[Google Cloud]" log messages
4. Verify AI responses are coming from Gemini

## Troubleshooting

### "Gemini API key not configured"
- Check that `GOOGLE_GENERATIVE_AI_API_KEY` is set correctly
- Verify the API key is active in Google AI Studio

### "Google Cloud credentials not configured"
- Check that `GOOGLE_CLOUD_CREDENTIALS` is set as a valid JSON string
- Ensure there are no line breaks in the environment variable
- Verify the service account has the correct permissions

### "Failed to get access token"
- Check that the service account key is valid
- Verify the required APIs are enabled in Google Cloud Console
- Ensure the service account has the necessary IAM roles

### Voice features not working
- Check browser console for detailed error messages
- Verify the Speech-to-Text and Text-to-Speech APIs are enabled
- Test with the fallback Web Speech API first

## Support

For issues specific to:
- **Gemini API**: [Google AI Studio Help](https://aistudio.google.com/)
- **Cloud APIs**: [Google Cloud Support](https://cloud.google.com/support)
- **Newsurf Integration**: Check browser console logs with "[Google Cloud]" prefix
