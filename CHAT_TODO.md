# Real-Time Chat Implementation — Step by Step

Branch: `feature/realtime-chat`

## Current State
- Messages work via REST API (send, fetch conversations, fetch chat history)
- Model: `Message` (sender, recipient, text, story, read, timestamps)
- Frontend: Redux slice with `fetchConversations`, `fetchMessages`, `sendMessage`
- No real-time — user must refresh to see new messages

---

## BACKEND (SnapSphere-Backend)

### Step 1: Install Socket.IO
```bash
npm install socket.io
```

### Step 2: Create Socket Manager (`socket/socketManager.js`)
- Create `socket/` folder
- Create `socketManager.js` that exports `initSocket(server)` and `getIO()`
- Track online users in a `Map<userId, socketId>`
- Handle events:
  - `connection` → add user to online map, broadcast online list
  - `disconnect` → remove user, broadcast updated online list

### Step 3: Modify `server.js` — Use HTTP Server
- Replace `app.listen()` with `http.createServer(app)` + `server.listen()`
- Call `initSocket(server)` after creating HTTP server
- CORS config for Socket.IO must match Express CORS (use FRONTEND_URL)

### Step 4: Create Socket Event Handlers (`socket/chatHandler.js`)
Handle these events inside the socket connection:
- **`sendMessage`** `{ recipientId, text }`
  - Save message to DB (reuse existing Message model)
  - Emit `newMessage` to recipient's socket (if online)
  - Emit `messageSent` back to sender (with saved message data + id)
- **`typing`** `{ recipientId }`
  - Emit `userTyping` to recipient's socket
- **`stopTyping`** `{ recipientId }`
  - Emit `userStopTyping` to recipient's socket
- **`markRead`** `{ senderId }`
  - Update all unread messages from that sender as read in DB
  - Emit `messagesRead` to the sender's socket

### Step 5: Create Online Status Handler (`socket/onlineHandler.js`)
- On connect: add to onlineUsers map, emit `userOnline` to all
- On disconnect: remove from map, emit `userOffline` to all
- Provide helper: `getOnlineUsers()` → returns array of online user IDs

### Step 6: Add Real-Time Notifications (Optional but nice)
- When a new like/comment/follow happens in existing controllers:
  - Import `getIO()` and `onlineUsers`
  - Emit `newNotification` to the target user's socket if online

---

## FRONTEND (SnapSphere)

### Step 7: Install Socket.IO Client
```bash
npm install socket.io-client
```

### Step 8: Create Socket Service (`src/lib/socket.ts`)
```
- connectSocket(userId) → creates socket connection to VITE_SOCKET_URL
- disconnectSocket() → cleanly disconnects
- getSocket() → returns the socket instance
- Auto-reconnect is built into Socket.IO client
```

### Step 9: Connect Socket on Login/App Load
- In `App.tsx` or `AppRoutes.tsx`:
  - When user is authenticated, call `connectSocket(user.id)`
  - When user logs out, call `disconnectSocket()`
  - Clean up on unmount

### Step 10: Update `messageSlice.ts` — Add Real-Time Reducers
Add these new reducers (not async thunks — these are triggered by socket events):
- `receiveMessage(state, action)` → push message to currentChat if chat is open with that user, also update conversations list
- `updateTypingStatus(state, action)` → set typing indicator for a user
- `updateOnlineUsers(state, action)` → store list of online user IDs
- `markMessagesAsRead(state, action)` → update read status in currentChat

### Step 11: Create Socket Listener Hook (`src/hooks/useSocketListeners.ts`)
- Listen for socket events and dispatch Redux actions:
  - `newMessage` → dispatch `receiveMessage`
  - `userTyping` → dispatch `updateTypingStatus({ userId, typing: true })`
  - `userStopTyping` → dispatch `updateTypingStatus({ userId, typing: false })`
  - `onlineUsers` → dispatch `updateOnlineUsers`
  - `messagesRead` → dispatch `markMessagesAsRead`
  - `newNotification` → dispatch notification action + show toast
- Use this hook in the main App/layout component

### Step 12: Update `ChatPage.tsx` — Real-Time Messaging
- **Send via socket** instead of REST API:
  - `getSocket().emit("sendMessage", { recipientId, text })`
  - Remove the REST `sendMessage` thunk call
- **Typing indicator**:
  - On input change → emit `typing` event (debounced)
  - On stop typing → emit `stopTyping` event
  - Show "typing..." UI when `typingUsers[partnerId]` is true
- **Auto-scroll** on new message received
- **Mark as read** → emit `markRead` when chat is opened

### Step 13: Update `MessagesPage.tsx` — Live Conversation List
- Show online status dot (green) next to users who are online
- Update last message in real-time when `receiveMessage` fires
- Update unread count badge in real-time

### Step 14: Update `BottomNav.tsx` / `Navbar.tsx` — Live Unread Badge
- Unread message count should update in real-time via Redux
- When `receiveMessage` fires and chat is NOT open → increment unread

---

## FILE CHANGES SUMMARY

### New Files (Backend)
| File | Purpose |
|------|---------|
| `socket/socketManager.js` | Init Socket.IO, manage online users |
| `socket/chatHandler.js` | Handle sendMessage, typing, markRead events |

### Modified Files (Backend)
| File | Change |
|------|--------|
| `package.json` | Add `socket.io` dependency |
| `server.js` | Use http.createServer, init socket |

### New Files (Frontend)
| File | Purpose |
|------|---------|
| `src/lib/socket.ts` | Socket connection manager |
| `src/hooks/useSocketListeners.ts` | Global socket event listeners |

### Modified Files (Frontend)
| File | Change |
|------|--------|
| `package.json` | Add `socket.io-client` dependency |
| `src/features/message/messageSlice.ts` | Add real-time reducers |
| `src/pages/ChatPage.tsx` | Send via socket, typing indicator, live messages |
| `src/pages/MessagesPage.tsx` | Online status, live last message |
| `src/App.tsx` or `src/routes/AppRoutes.tsx` | Connect socket on auth |

---

## TESTING CHECKLIST
- [ ] Open two browsers with different accounts
- [ ] Send message from A → appears instantly on B
- [ ] Typing indicator shows when A types
- [ ] Online status shows green dot for logged-in users
- [ ] Unread badge updates in real-time
- [ ] Messages marked as read when chat is opened
- [ ] Reconnects automatically after network drop
- [ ] Works on mobile browsers
- [ ] No duplicate messages on reconnect
- [ ] Existing REST endpoints still work as fallback

---

---

## PHASE 1: Backend Socket Server Setup

### Task 1: Install Socket.IO
- [ ] Run `npm install socket.io` in `SnapSphere-Backend/`

### Task 2: Create `socket/socketManager.js`
- [ ] Create folder `socket/`
- [ ] Create file `socket/socketManager.js`
- [ ] Create `onlineUsers` Map to track `userId → socketId`
- [ ] Export `initSocket(server)` function that:
  - Creates new `Server(server, { cors: { origin: process.env.FRONTEND_URL, credentials: true } })`
  - On `"connection"` event: reads `socket.handshake.query.userId`, adds to `onlineUsers` map, emits `"onlineUsers"` list to all
  - On `"disconnect"` event: removes from `onlineUsers` map, emits `"onlineUsers"` list to all
  - Calls `chatHandler(io, socket)` for chat events (create in Task 3)
- [ ] Export `getIO()` function that returns the `io` instance
- [ ] Export `getOnlineUsers()` function that returns the `onlineUsers` Map

### Task 3: Create `socket/chatHandler.js`
- [ ] Create file `socket/chatHandler.js`
- [ ] Export function `chatHandler(io, socket)` that registers these events:
- [ ] **`"sendMessage"`** handler `({ recipientId, text })`:
  - Get `userId` from `socket.handshake.query.userId`
  - Validate recipientId and text exist
  - Create message in DB: `Message.create({ sender: userId, recipient: recipientId, text })`
  - Format the saved message: `{ id, senderId, text, storyImage: null, read: false, createdAt }`
  - Emit `"messageSent"` back to sender socket with formatted message
  - If recipient is online (check `onlineUsers.get(recipientId)`), emit `"newMessage"` to their socket
- [ ] **`"typing"`** handler `({ recipientId })`:
  - Get sender's userId
  - If recipient online, emit `"userTyping"` with `{ userId }` to their socket
- [ ] **`"stopTyping"`** handler `({ recipientId })`:
  - If recipient online, emit `"userStopTyping"` with `{ userId }` to their socket
- [ ] **`"markRead"`** handler `({ senderId })`:
  - Get current userId
  - Run `Message.updateMany({ sender: senderId, recipient: userId, read: false }, { read: true })`
  - If sender online, emit `"messagesRead"` with `{ readBy: userId }` to their socket

### Task 4: Modify `server.js`
- [ ] Add imports at top:
  ```js
  const http = require("http");
  const { initSocket } = require("./socket/socketManager");
  ```
- [ ] After `const app = express();` add:
  ```js
  const server = http.createServer(app);
  ```
- [ ] Before `server.listen()`, add:
  ```js
  initSocket(server);
  ```
- [ ] Change `app.listen(PORT, ...)` to `server.listen(PORT, ...)`

### Task 5: Test Backend Socket
- [ ] Start the backend server locally
- [ ] Open browser console and test connection:
  ```js
  const socket = io("http://localhost:3000", { query: { userId: "testuser123" } });
  socket.on("connect", () => console.log("Connected!", socket.id));
  socket.on("onlineUsers", (users) => console.log("Online:", users));
  ```
- [ ] Verify no errors in server console
- [ ] Commit and push to `feature/realtime-chat` branch

---

## PHASE 2: Frontend Socket Client Setup

### Task 6: Install Socket.IO Client
- [ ] Run `npm install socket.io-client` in `SnapSphere/`

### Task 7: Create `src/lib/socket.ts`
- [ ] Create file with:
  - `let socket: Socket | null = null`
  - `connectSocket(userId: string)` → creates `io(VITE_SOCKET_URL, { query: { userId }, withCredentials: true })`, stores in `socket`
  - `disconnectSocket()` → calls `socket.disconnect()`, sets `socket = null`
  - `getSocket()` → returns `socket`

### Task 8: Connect Socket on Auth
- [ ] In `AppRoutes.tsx` (or `App.tsx`):
  - Import `connectSocket` and `disconnectSocket`
  - Add `useEffect` that watches `isAuthenticated` and `user.id`
  - When authenticated → call `connectSocket(user.id)`
  - When logged out → call `disconnectSocket()`
  - Cleanup on unmount → `disconnectSocket()`

---

## PHASE 3: Wire Up Redux + Listeners

### Task 9: Update `messageSlice.ts`
- [ ] Add to state: `onlineUsers: string[]` (default `[]`), `typingUsers: Record<string, boolean>` (default `{}`)
- [ ] Add reducer: `receiveMessage` — push message to `currentChat.messages` if chat open with that sender, update `conversations` list's lastMessage, increment `totalUnread` if chat not open
- [ ] Add reducer: `messageSentViaSocket` — push message to `currentChat.messages`
- [ ] Add reducer: `updateTypingStatus` — set `typingUsers[userId] = typing`
- [ ] Add reducer: `updateOnlineUsers` — set `onlineUsers` array
- [ ] Add reducer: `markMessagesAsRead` — update `read: true` on messages in currentChat
- [ ] Export all new actions

### Task 10: Create `src/hooks/useSocketListeners.ts`
- [ ] Import `getSocket` and all Redux actions
- [ ] In a `useEffect`, get socket and register listeners:
  - `"newMessage"` → dispatch `receiveMessage(message)`
  - `"messageSent"` → dispatch `messageSentViaSocket(message)`
  - `"userTyping"` → dispatch `updateTypingStatus({ userId, typing: true })`
  - `"userStopTyping"` → dispatch `updateTypingStatus({ userId, typing: false })`
  - `"onlineUsers"` → dispatch `updateOnlineUsers(userIds)`
  - `"messagesRead"` → dispatch `markMessagesAsRead(data)`
- [ ] Return cleanup that removes all listeners
- [ ] Use this hook in `AppRoutes.tsx` (call it once when authenticated)

---

## PHASE 4: Update UI Components

### Task 11: Update `ChatPage.tsx`
- [ ] Import `getSocket`
- [ ] **Send via socket**: Replace `dispatch(sendMessage(...))` with `getSocket()?.emit("sendMessage", { recipientId, text })`
- [ ] **Typing indicator**:
  - On input `onChange` → emit `"typing"` (debounce 500ms)
  - On blur or empty input → emit `"stopTyping"`
  - Read `typingUsers[partnerId]` from Redux, show "typing..." text below header
- [ ] **Mark read**: On mount, emit `"markRead"` with `{ senderId: userId }`
- [ ] Auto-scroll still works (already have `bottomRef`)

### Task 12: Update `MessagesPage.tsx`
- [ ] Read `onlineUsers` from Redux
- [ ] Show green dot on avatar if `onlineUsers.includes(conv.user.id)`
- [ ] Conversations update automatically via `receiveMessage` reducer

### Task 13: Update `Navbar.tsx` / `BottomNav.tsx`
- [ ] Unread badge already reads from Redux `totalUnread`
- [ ] Verify it updates when `receiveMessage` increments `totalUnread`
- [ ] No code change needed if reducer handles it correctly

---

## PHASE 5: Optional Enhancements

### Task 14: Real-Time Notifications
- [ ] In backend controllers (like, comment, follow), import `getIO()` and `getOnlineUsers()`
- [ ] After creating a notification in DB, emit `"newNotification"` to target user's socket
- [ ] In frontend `useSocketListeners`, listen for `"newNotification"` → dispatch to notification slice + show toast

### Task 15: Final Testing
- [ ] Open two browsers (or incognito) with different accounts
- [ ] Send message from A → appears instantly on B (no refresh)
- [ ] Typing indicator shows when A types in chat with B
- [ ] Green dot shows next to online users in messages list
- [ ] Unread badge updates live in navbar
- [ ] Close tab → user goes offline → green dot disappears
- [ ] Refresh page → socket reconnects automatically
- [ ] Test on mobile browser
- [ ] Commit, push, create PR to merge `feature/realtime-chat` → `main`
