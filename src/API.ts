/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type Message = {
  __typename: "Message",
  id: string,
  chatroomId: string,
  text: string,
  senderId: string,
  createdAt?: string | null,
};

export type SendMessageMutationVariables = {
  chatroomId: string,
  text: string,
  senderId: string,
};

export type SendMessageMutation = {
  // Sends a new message to a chatroom
  sendMessage?:  {
    __typename: "Message",
    id: string,
    chatroomId: string,
    text: string,
    senderId: string,
    createdAt?: string | null,
  } | null,
};

export type GetMessagesQueryVariables = {
  chatroomId: string,
};

export type GetMessagesQuery = {
  // Gets all messages for a specific chatroom
  getMessages?:  Array< {
    __typename: "Message",
    id: string,
    chatroomId: string,
    text: string,
    senderId: string,
    createdAt?: string | null,
  } | null > | null,
};

export type OnNewMessageSubscriptionVariables = {
  chatroomId: string,
};

export type OnNewMessageSubscription = {
  // Subscribes to new messages in a specific chatroom
  onNewMessage?:  {
    __typename: "Message",
    id: string,
    chatroomId: string,
    text: string,
    senderId: string,
    createdAt?: string | null,
  } | null,
};
