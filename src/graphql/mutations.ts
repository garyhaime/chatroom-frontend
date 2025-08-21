/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const sendMessage =
  /* GraphQL */ `mutation SendMessage($chatroomId: ID!, $text: String!, $senderId: String!) {
  sendMessage(chatroomId: $chatroomId, text: $text, senderId: $senderId) {
    id
    chatroomId
    text
    senderId
    createdAt
    __typename
  }
}
` as GeneratedMutation<
    APITypes.SendMessageMutationVariables,
    APITypes.SendMessageMutation
  >;
export const joinWaitingRoom = /* GraphQL */ `
  mutation JoinWaitingRoom($userId: ID!) {
    joinWaitingRoom(userId: $userId) {
      userId
      chatroomId
      status
    }
  }
`;

export const leaveWaitingRoom = /* GraphQL */ `
  mutation LeaveWaitingRoom($userId: ID!) {
    leaveWaitingRoom(userId: $userId) {
      success
    }
  }
`;

// Add to your graphql/queries.ts:
export const getWaitingStatus = /* GraphQL */ `
  query GetWaitingStatus($userId: ID!) {
    getWaitingStatus(userId: $userId) {
      status
      chatroomId
      waitTime
    }
  }
`;

// Add to your graphql/subscriptions.ts:
export const onMatchFound = /* GraphQL */ `
  subscription OnMatchFound($userId: ID!) {
    onMatchFound(userId: $userId) {
      chatroomId
      matchedUserId
    }
  }
`;
