import * as React from "react";
import {
  List,
  ListItem,
  Typography,
  ListItemText,
  ListItemIcon
} from "@material-ui/core";
import { User } from "utils/WebRTCClient";
import { getColor } from "utils";

export function MessageList({
  messages,
  names
}: {
  names: Record<User["id"], string>;
  messages: {
    source: User;
    content: string;
  }[];
}) {
  const lastListItemRef = React.useRef<HTMLLIElement>(null);
  const lastMessage = messages[messages.length - 1];
  React.useEffect(() => {
    if (lastListItemRef.current) {
      lastListItemRef.current.scrollIntoView();
    }
  }, [lastMessage]);
  return (
    <List style={{ width: "100%" }} dense>
      {messages.map(({ source: { id }, content }, index) => (
        <ListItem
          ref={index === messages.length - 1 ? lastListItemRef : undefined}
          key={index}
        >
          <ListItemIcon>
            <Typography style={{ color: getColor(id) }} variant="body1">
              {names[id]}
            </Typography>
          </ListItemIcon>
          <ListItemText primary={content} />
        </ListItem>
      ))}
    </List>
  );
}
