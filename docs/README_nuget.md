# Back Chat

Chat for the Umbraco backoffice. Talk to other backoffice users in a global channel, or on the document you are editing.

## Installation

Install into an Umbraco 17 site:

```
dotnet add package Umbraco.Community.BackChat
```

Back Chat adds a chat button to the backoffice header, and a Chat tab to each document. Messages are stored in the site's database, in a `BackChatMessages` table created on first start.

## Notes

- A document's chat is only visible to users who can browse that document.
- On a load-balanced backoffice, history is shared through the database, but live messages only reach users connected to the same server unless SignalR has a backplane configured.
