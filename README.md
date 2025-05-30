# Ballouq Project Manager

A React Native project management application built with Expo SDK 52, focusing on Agile-style project management with features like task tracking, file attachments, and team collaboration.

## Features

- Project and team creation
- Task management with Kanban-style board
- File attachments (documents, images)
- Sprint timeline tracking
- Audio/video notes for tasks
- Push notifications
- Real-time updates with Firebase

## Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI
- Expo Go app on your mobile device
- Firebase account

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ballouq-project
```

2. Install dependencies:
```bash
npm install
```

3. Configure Firebase:
   - Create a new Firebase project
   - Enable Authentication, Firestore, and Storage
   - Update the Firebase configuration in `src/services/firebase.js`

4. Start the development server:
```bash
npx expo start
```

5. Run on your device:
   - Install Expo Go on your mobile device
   - Scan the QR code from the terminal or Expo Dev Tools

## Project Structure

```
src/
  ├── components/     # Reusable UI components
  ├── screens/        # Screen components
  ├── services/       # Firebase and other services
  ├── context/        # React Context providers
  ├── hooks/          # Custom React hooks
  ├── utils/          # Utility functions
  ├── constants/      # Constants and configuration
  └── assets/         # Images, fonts, etc.
```

## Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS simulator
- `npm run web` - Run in web browser

## Dependencies

- @react-navigation/native
- @react-navigation/native-stack
- @react-navigation/bottom-tabs
- firebase
- react-native-draggable-flatlist
- expo-document-picker
- expo-image-picker
- expo-media-library
- expo-notifications
- react-native-reanimated
- react-native-gesture-handler

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@ballouq.com or create an issue in the repository. 