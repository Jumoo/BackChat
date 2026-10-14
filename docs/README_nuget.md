# Back Chat

Chat for the Umbraco backoffice. Talk to other backoffice users in a global channel, or on the document you are editing.

## Installation

Install into an Umbraco 17 site:

```
dotnet add package Umbraco.Community.BackChat
```

Back Chat adds a chat button to the backoffice header, and a Chat tab to each document.

## Notes

Messages are kept in memory for now, so they are lost when the site restarts and are not shared between load-balanced nodes.
