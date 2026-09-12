import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { reportError } from "@/lib/monitoring";

type Props = { children: ReactNode };
type State = { error: Error | null };

/** Prevent a render exception from presenting users with an uninformative blank page. */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidMount() {
    const hot = import.meta.hot;
    if (!hot) return;
    hot.on("vite:afterUpdate", this.clearError);
  }

  componentWillUnmount() {
    import.meta.hot?.off("vite:afterUpdate", this.clearError);
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Deliberately log only the error metadata; request/session data must not be logged here.
    console.error("[app-render-error]", {
      name: error.name,
      message: error.message,
      componentStack: info.componentStack,
    });
    // The console line above is invisible in production — report it as well.
    reportError(error, { componentStack: info.componentStack });
  }

  clearError = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;

    const diagnostic = import.meta.env.DEV ? this.state.error.message : null;
    return (
      <main className="min-h-screen grid place-items-center bg-background px-6 text-center">
        <div className="max-w-md space-y-4">
          <h1 className="font-heading text-2xl font-bold">Unable to load this page</h1>
          <p className="text-sm text-muted-foreground">
            The application encountered an unexpected rendering error. Please reload the page.
          </p>
          {diagnostic ? (
            <pre className="overflow-auto rounded-md bg-muted p-3 text-left text-xs text-destructive">
              {diagnostic}
            </pre>
          ) : null}
          <Button
            type="button"
            onClick={() => {
              this.clearError();
              window.location.reload();
            }}
          >
            Reload
          </Button>
        </div>
      </main>
    );
  }
}
