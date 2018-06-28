import { stringify as queryStringify } from "query-string";
import React from "react";

import { Provider, ProviderValue, Status } from "../context";

export interface ReCaptchaProviderProps {
  defaultLanguage?: string;
}

interface State {
  providerValue: ProviderValue;
}

class ReCaptchaProvider extends React.Component<ReCaptchaProviderProps, State> {
  private loadCallbackGlobalName: string = `__${Math.random().toString(36).substr(2)}`;

  public state: State = {
    providerValue: {
      defaultLanguage: this.props.defaultLanguage,
      status: Status.Uninitialized,
    },
  };

  public componentDidMount() {
    const { defaultLanguage = "en" } = this.props;
    const script = document.createElement("script");

    // @ts-ignore
    window[this.loadCallbackGlobalName] = this.loadHandler;

    const params = queryStringify({
      hl: defaultLanguage,
      onload: this.loadCallbackGlobalName,
      render: "explicit",
    });

    Object.assign<HTMLScriptElement, Partial<HTMLScriptElement>>(script, {
      async: true,
      onerror: this.errorHandler,
      src: `https://www.google.com/recaptcha/api.js?${params}`,
    });

    document.head.appendChild(script);

    this.setState({
      providerValue: {
        ...this.state.providerValue,
        status: Status.Loading,
      },
    });
  }

  private loadHandler = () => {
    this.setState({
      providerValue: {
        ...this.state.providerValue,
        status: Status.Loaded,
      },
    });
  }

  private errorHandler = (): void => {
    this.setState({
      providerValue: {
        ...this.state.providerValue,
        status: Status.Error,
      },
    });
  }

  public render() {
    return (
      <Provider value={this.state.providerValue}>
        {this.props.children}
      </Provider>
    );
  }
}

export default ReCaptchaProvider as React.ComponentClass<ReCaptchaProviderProps>;
