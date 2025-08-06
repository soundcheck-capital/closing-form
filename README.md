# Closing Form

A modern React application for collecting and managing closing applications. This application allows users to submit detailed information about their company, finances, and due diligence documents.

## 🚀 Features

### 📋 Multi-Step Form
- **Personal Information** : Applicant contact details and information
- **Company Information** : Company and business activity details
- **Financial Information** : Financial data and projections
- **Legal Information** : Documents and compliance
- **Due Diligence Documents** : File upload and management
- **Summary** : Complete overview before submission

### 🔐 Security
- Password protection
- User authentication
- Real-time data validation
- Automatic data backup

### 📁 File Management
- Multiple file upload
- Support for various formats (PDF, Excel, images)
- Google Drive integration
- Make.com webhook for automated processing

### 🎨 User Interface
- Modern and responsive design
- Intuitive navigation with sidebar
- Custom components
- Real-time visual validation

## 🛠 Technologies Used

- **Frontend** : React 19, TypeScript
- **State Management** : Redux Toolkit
- **Routing** : React Router DOM
- **Styling** : Tailwind CSS, Material Tailwind
- **Maps** : Google Maps API
- **Upload** : Google Drive integration + Make.com webhook
- **Tests** : Jest, React Testing Library

## 📦 Installation

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn

### Installing Dependencies
```bash
# Clone the repository
git clone <repository-url>
cd closing-form

# Install dependencies
npm install
```

### Environment Configuration
```bash
# Copy the example file
cp env.example .env

# Configure environment variables
REACT_APP_WEBHOOK_URL=https://hook.us1.make.com/your-webhook-id
REACT_APP_WEBHOOK_URL_FILES=https://hook.us1.make.com/your-files-webhook-id
REACT_APP_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
REACT_APP_FORM_PASSWORD=
HUBSPOT_COMPANY_ID=
HUBSPOT_DEAL_ID=
HUBSPOT_CONTACT_ID=
```

## 🚀 Getting Started

### Development Mode
```bash
# Start the development server
npm start
```
The application will be available at [http://localhost:3001](http://localhost:3001)

### Testing
```bash
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch
```

### Production Build
```bash
# Build the application
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## 🌐 Deployment

The application is configured to be deployed on Netlify. The configuration includes:

### Netlify Configuration
- **Build command**: `npm run build`
- **Publish directory**: `build`
- **Node version**: 18
- **SPA routing**: Configured with `_redirects` and `netlify.toml`

### GitHub Pages (Alternative)
For GitHub Pages deployment, see [DEPLOYMENT.md](./DEPLOYMENT.md) for details.

## 🔧 Configuration

### Make.com Webhooks
The application uses two separate Make.com webhooks for optimized processing:

1. **Form Data Webhook** (`REACT_APP_WEBHOOK_URL`): Receives form data without files
2. **Files Webhook** (`REACT_APP_WEBHOOK_URL_FILES`): Receives individual files with metadata

**Features:**
- **File size limit**: 100MB per file
- **Separated processing**: Form data and files are sent to different endpoints
- **Individual file uploads**: Each file is uploaded separately to prevent timeouts
- **Progress tracking**: Real-time upload progress display
- **Error handling**: Continues processing even if some files fail

See [WEBHOOK_INTEGRATION.md](./WEBHOOK_INTEGRATION.md) for detailed configuration.

### Google Maps API
- Create a Google Cloud project
- Enable Google Maps JavaScript API
- Configure the API key in environment variables

### Google Drive (Optional)
- Configure Google Drive credentials
- Enable Google Drive API
- Configure appropriate permissions

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── customComponents/ # Reusable custom components
│   └── ...              # Form steps
├── contexts/            # React contexts (validation, files)
├── hooks/               # Custom hooks
├── services/            # External services (Google Drive)
├── store/               # Redux configuration
│   ├── auth/           # Authentication management
│   └── form/           # Form management
└── utils/              # Utilities and helpers
```

## 🔄 Data Flow

1. **Input** : User fills out the multi-step form
2. **Validation** : Real-time data validation
3. **Save** : Automatic data backup
4. **Form Data Submission** : Form data sent to primary webhook (without files)
5. **File Uploads** : Individual files uploaded to separate webhook with progress tracking
6. **Confirmation** : Success page and notification

## 🧪 Testing

```bash
# Unit tests
npm test

# Tests with coverage
npm test -- --coverage

# Specific tests
npm test -- --testNamePattern="PersonalInfoStep"
```

## 🤝 Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is private and proprietary.

## 📞 Support

For any questions or issues :
- Create an issue on GitHub
- Contact the development team
