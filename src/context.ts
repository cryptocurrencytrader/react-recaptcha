import React from "react";

import createConsumerHOC from "@bitcointrade/react-helpers/createConsumerHOC";

export enum Status {
  Uninitialized = 1,
  Loading,
  Error,
  Loaded,
}

export interface ProviderValue {
  defaultLanguage: string | undefined;
  status: Status;
}

const { Consumer, Provider } = React.createContext<ProviderValue>({
  defaultLanguage: undefined,
  status: Status.Loading,
});

export { Provider };
export const consumerHOC = createConsumerHOC<ProviderValue>(Consumer, "ReCaptcha");
