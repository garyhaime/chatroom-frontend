/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type Message = {
  __typename: "Message";
  id: string;
  chatroomId: string;
  text: string;
  senderId: string;
  createdAt?: string | null;
};

export type WaitingRoomStatus = {
  __typename: "WaitingRoomStatus";
  userId: string;
  status: string;
  chatroomId?: string | null;
  waitTime?: number | null;
};

export type Match = {
  __typename: "Match";
  chatroomId: string;
  matchedUserId: string;
};

export type JoinWaitingRoomMutationVariables = {
  userId: string;
};

export type JoinWaitingRoomMutation = {
  joinWaitingRoom?: {
    __typename: "WaitingRoomStatus";
    userId: string;
    status: string;
    chatroomId?: string | null;
    waitTime?: number | null;
  } | null;
};

export type LeaveWaitingRoomMutationVariables = {
  userId: string;
};

export type LeaveWaitingRoomMutation = {
  leaveWaitingRoom?: {
    __typename: "boolean";
    success: boolean;
  } | null;
};

export type SendMessageMutationVariables = {
  chatroomId: string;
  text: string;
  senderId: string;
};

export type SendMessageMutation = {
  sendMessage?: {
    __typename: "Message";
    id: string;
    chatroomId: string;
    text: string;
    senderId: string;
    createdAt?: string | null;
  } | null;
};

export type GetMessagesQueryVariables = {
  chatroomId: string;
};

export type GetMessagesQuery = {
  getMessages?: Array<{
    __typename: "Message";
    id: string;
    chatroomId: string;
    text: string;
    senderId: string;
    createdAt?: string | null;
  } | null> | null;
};

export type GetWaitingStatusQueryVariables = {
  userId: string;
};

export type GetWaitingStatusQuery = {
  getWaitingStatus?: {
    __typename: "WaitingRoomStatus";
    userId: string;
    status: string;
    chatroomId?: string | null;
    waitTime?: number | null;
  } | null;
};

export type OnNewMessageSubscriptionVariables = {
  chatroomId: string;
};

export type OnNewMessageSubscription = {
  onNewMessage?: {
    __typename: "Message";
    id: string;
    chatroomId: string;
    text: string;
    senderId: string;
    createdAt?: string | null;
  } | null;
};

export type OnMatchFoundSubscriptionVariables = {
  userId: string;
};

export type OnMatchFoundSubscription = {
  onMatchFound?: {
    __typename: "Match";
    chatroomId: string;
    matchedUserId: string;
  } | null;
};
