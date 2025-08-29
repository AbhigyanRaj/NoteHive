# Debug Real-Time Sync Between Tabs

## Issue
Notes not syncing between tabs with same user login - changes in Tab A don't appear in Tab B without manual refresh.

## Fixes Applied

### 1. **Socket Connection Settings**
- Changed `forceNew: false` to allow multiple connections from same user
- Each tab gets its own socket connection

### 2. **Enhanced Dashboard Event Handling**
- Added duplicate prevention for note creation
- Enhanced note change handler with better logging
- Added selected note updates for real-time editing

### 3. **Improved NoteEditor Real-Time Updates**
- Added debouncing (300ms) to prevent excessive updates
- Enhanced change detection to avoid infinite loops
- Added detailed console logging for debugging

### 4. **Backend Broadcasting**
- Uses `io.emit()` to broadcast to ALL connected users
- Note creation/deletion/updates sent globally
- Multiple tabs from same user receive updates

## How to Test

1. **Open two browser tabs**
2. **Login with same account in both tabs**
3. **In Tab A**: Create a new note
   - Should appear instantly in Tab B
4. **In Tab A**: Edit the note content
   - Changes should appear in Tab B after 300ms debounce
5. **In Tab B**: Make changes to same note
   - Should sync back to Tab A

## Debug Console Messages
Look for these in browser console:
- `📤 Sending title update:` - When sending changes
- `📥 Received note change:` - When receiving changes
- `📝 Updating title/content from:` - When applying changes
- `🔌 Connected to collaboration server` - Connection status

## Expected Behavior
✅ Real-time sync like Google Docs
✅ Changes appear within 300ms
✅ No manual refresh needed
✅ Works across multiple tabs/windows
