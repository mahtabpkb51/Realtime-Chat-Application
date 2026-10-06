# Realtime Chat Application

A modern real-time chat application built using React.js, Node.js, Express.js, Socket.IO, and MongoDB.

## Features

- Real-time messaging
- Multiple chat rooms
- Online users
- Join and leave notifications
- Typing indicator
- Message timestamps
- Read receipts
- Reply to messages
- Edit messages
- Delete messages for yourself
- Delete messages for everyone
- Message reactions
- Pin and unpin messages
- Message search
- Image sharing
- File sharing
- Voice message recording
- Avatar selection
- Dark and light theme
- MongoDB message persistence
- Input validation
- Server-side validation
- Message sanitization
- File type validation
- File size validation
- Audio validation

## Tech Stack

### Frontend

- React.js
- Socket.IO Client
- CSS
- Emoji Picker

### Backend

- Node.js
- Express.js
- Socket.IO
- MongoDB
- Mongoose

## Project Structure

```text
Realtime-Chat-Application/
│
├── client/
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── Chat/
│       │   ├── InfoBar/
│       │   ├── Input/
│       │   ├── Join/
│       │   ├── Messages/
│       │   └── TextContainer/
│       ├── icons/
│       ├── App.js
│       └── index.js
│
├── server/
│   ├── models/
│   │   └── Message.js
│   ├── index.js
│   ├── router.js
│   ├── users.js
│   └── Procfile
│
├── .gitignore
├── package.json
└── README.md
```

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/mahtabpkb51/Realtime-Chat-Application.git
```

### 2. Navigate to the Project

```bash
cd Realtime-Chat-Application
```

### 3. Install Backend Dependencies

```bash
cd server
npm install
```

### 4. Install Frontend Dependencies

```bash
cd ../client
npm install
```

## Environment Variables

Create a `.env` file inside the `server` directory:

```env
MONGODB_URI=your_mongodb_connection_string
```

Never commit or expose your `.env` file.

## Running the Application

### Start the Backend

```bash
cd server
node index.js
```

The backend runs on:

```text
http://localhost:5000
```

### Start the Frontend

Open another terminal:

```bash
cd client
npm start
```

The frontend runs on:

```text
http://localhost:3000
```

## Security and Validation

The application includes:

- Username validation
- Room name validation
- Message validation
- Message length validation
- File type validation
- File size validation
- Audio validation
- Server-side validation
- Message sanitization
- Environment variable protection

## Database

MongoDB is used to store chat messages and message-related data.

Mongoose is used to manage the MongoDB connection and message schema.

## Deployment

The backend is deployed using Render.

## Future Improvements

- User authentication
- Private messaging
- User profiles
- Push notifications
- Message pagination
- Cloud-based file storage
- Improved media management

## Author

**MD MAHTAB ALAM**

GitHub:  
https://github.com/mahtabpkb51
