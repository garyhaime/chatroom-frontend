/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onNewMessage = /* GraphQL */ `subscription OnNewMessage($chatroomId: ID!) {
  onNewMessage(chatroomId: $chatroomId) {
    id
    chatroomId
    text
    senderId
    createdAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnNewMessageSubscriptionVariables,
  APITypes.OnNewMessageSubscription
>;
