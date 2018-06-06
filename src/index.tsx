import React from "react";
import { createPortal } from "react-dom";
import { Omit } from "type-zoo";

import { consumerHOC, ProviderValue, Status } from "./context";

export type RenameProp<T, A extends keyof T, B extends string> = Record<B, Pick<T, A>[A]>;

export type ReCaptchaProps = (
  Omit<ReCaptchaV2.Parameters, "error-callback" | "expired-callback" | "callback" | "isolated"> &
  Partial<(
    RenameProp<ReCaptchaV2.Parameters, "callback", "onSuccess"> &
    RenameProp<ReCaptchaV2.Parameters, "error-callback", "onError"> &
    RenameProp<ReCaptchaV2.Parameters, "expired-callback", "onExpired">
  )> & {
    hl?: string;
  }
);

const renamedParametersMap: Array<[keyof ReCaptchaProps, keyof ReCaptchaV2.Parameters]> = [
  ["onError", "error-callback"],
  ["onExpired", "expired-callback"],
  ["onSuccess", "callback"],
];

export type ReCaptchaAPI = (
  Record<Exclude<keyof ReCaptchaV2.ReCaptcha, "getResponse" | "render">, () => void> & {
    ready: boolean,
    getResponse(): ReturnType<Pick<ReCaptchaV2.ReCaptcha, "getResponse">["getResponse"]>,
  }
);

export type ReCaptchaComponentClass<T extends ReCaptchaProps = ReCaptchaProps> = React.ComponentClass<T> & {
  new (...args: any[]): React.Component<T> & ReCaptchaAPI;
};

type InnerProps = ReCaptchaProps & Record<"context", ProviderValue>;

class ReCaptcha extends React.PureComponent<InnerProps> {
  private containerRef: React.RefObject<HTMLDivElement> = React.createRef();

  private widgetId: number | undefined;

  private widget = document.createElement("div");

  private portalRoot: HTMLDivElement = document.createElement("div");

  // @ts-ignore
  public ready: boolean;

  constructor(...args: any[]) {
    // @ts-ignore
    super(...args);

    Object.defineProperty(this, "ready", {
      configurable: true,
      enumerable: true,
      get: () => this.props.context.status === Status.Loaded,
    });
  }

  public componentDidMount() {
    if (this.props.size === "invisible") {
      document.body.appendChild(this.portalRoot);
    }

    if (this.props.context.status === Status.Loaded) {
      this.renderCaptcha();
    }
  }

  public componentDidUpdate(prevProps: InnerProps) {
    if (this.props.context.status !== Status.Loaded) {
      return;
    }

    if (this.props.size !== prevProps.size) {
      if (this.props.size === "invisible") {
        document.body.appendChild(this.portalRoot);
      } else if (prevProps.size === "invisible") {
        document.body.removeChild(this.portalRoot);
      }
    }

    this.renderCaptcha();
  }

  public componentWillUnmount() {
    if (document.body.contains(this.portalRoot)) {
      document.body.removeChild(this.portalRoot);
    }
  }

  public execute: ReCaptchaAPI["execute"] = () => grecaptcha.execute(this.widgetId);

  public getResponse: ReCaptchaAPI["getResponse"] = () => grecaptcha.getResponse(this.widgetId);

  public reset: ReCaptchaAPI["reset"] = () => grecaptcha.reset(this.widgetId);

  private renderCaptcha = (): void => {
    const container = this.containerRef.current!;
    const parameters = { ...this.props };

    delete parameters.children;

    if (container.contains(this.widget)) {
      container.removeChild(this.widget);
    }

    this.widget = document.createElement("div");
    container.appendChild(this.widget);

    renamedParametersMap.forEach(([a, b]) => {
      (parameters as any)[b] = parameters[a];
      delete parameters[a];
    });

    this.widgetId = grecaptcha.render(this.widget, parameters as ReCaptchaV2.Parameters, true);
  }

  public render() {
    const widget = <div ref={this.containerRef}/>;

    return this.props.size === "invisible"
      ? createPortal(widget, this.portalRoot)
      : widget;
  }
}

const ReCaptchaWithConsumer = consumerHOC()(
  ({ forwardRef, ...props }: InnerProps & { forwardRef?: React.Ref<ReCaptcha> }) => (
    <ReCaptcha {...props} ref={forwardRef}/>
  ),
);

const ReCaptchaWithRefForwarding = React.forwardRef<ReCaptcha, InnerProps>((props, ref) => (
  <ReCaptchaWithConsumer {...props} forwardRef={ref}/>
));

export default ReCaptchaWithRefForwarding as any as ReCaptchaComponentClass;
