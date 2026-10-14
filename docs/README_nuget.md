# Back Chat

Talk about and look after content in the Umbraco backoffice: chat, direct and group conversations, tasks and review dates on documents, and a dashboard of what needs you.

## Installation

Install into an Umbraco 17 site:

```
dotnet add package Umbraco.Community.BackChat
```

BackChat creates its tables on first start.

## What it does

- **Chat.** A global conversation, a chat on each document (on its Chat tab), and direct conversations with up to four other people. Users allowed to message groups can talk to a whole user group.
- **Unread badges.** The header chat button and each document's Chat tab show how many messages you haven't read. A document's chat counts for you once you've posted or been mentioned in it.
- **@mentions.** Type `@` to mention a person or, with permission, a user group. Mentioned people get a toast and a stronger badge.
- **Messages that need confirming.** Ask everyone, a group or the people in a conversation to confirm they've read a message. Important ones hold the screen until confirmed. The sender sees who has confirmed and can remind the rest.
- **Content activity.** Saves, publishes, moves and the rest post a quiet line in the document's chat. Repeated saves collapse into one line.
- **Tasks.** A to-do list beside each document's chat. Assign tasks and give them due dates.
- **Review dates.** Give a document a date to be reviewed by, or set rules per content type in Settings > Review rules. The last editor is reminded once when a page falls due.
- **Comms dashboard.** In the Content section: what's waiting for your confirmation, your open tasks, pages due for review and unread mentions.

## Permissions

BackChat adds its own permissions to the user group editor, under the BackChat heading. Administrators get them all on install; other groups get none.

- Send important messages (and ask for confirmation)
- Message user groups
- Mention user groups
- Pin notes
- Manage review rules
- See everything on the comms dashboard

Plain chat, mentioning a person, and tasks on documents you can update don't need one.

## Settings

All optional, in `appsettings.json`:

```json
"BackChat": {
  "Activity": {
    "Enabled": true,
    "Events": [ "Saved", "Published", "Unpublished", "Moved", "Copied", "RolledBack", "Trashed", "Restored", "TaskAssigned", "TaskCompleted", "Reviewed", "ReviewDue" ],
    "CollapseMinutes": 30
  },
  "Reviews": {
    "ReminderGroup": "admin",
    "ReminderPeriod": "01:00:00"
  }
}
```

- `Activity:Events` picks which events post a line in the document's chat.
- `Reviews:ReminderGroup` is the user group reminded about a review when the page's last editor can't be found.

## Notes

- A document's chat, tasks and review are only visible to users who can browse that document. Changing tasks and reviews needs update permission.
- On a load-balanced backoffice, history is shared through the database, but live messages only reach users connected to the same server unless SignalR has a backplane configured. Review reminders run on one server only.
