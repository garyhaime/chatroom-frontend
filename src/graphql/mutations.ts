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
  mutation JoinWaitingRoom {
    joinWaitingRoom {
      userId
      chatroomId
      status
    }
  }
`;

export const leaveWaitingRoom = /* GraphQL */ `
  mutation LeaveWaitingRoom {
    leaveWaitingRoom {
      success
    }
  }
`;

export const createMatch = /* GraphQL */ `
  mutation CreateMatch($userId: ID!, $chatroomId: ID!) {
    createMatch(userId: $userId, chatroomId: $chatroomId) {
      chatroomId
      matchedUserId
      __typename
    }
  }
`;
