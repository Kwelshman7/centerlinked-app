import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type Props = { children: ReactNode };
type State = { error: Error | null };

/** Prevent a render exception from presenting users with an uninformative blank page. */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Deliberately log only the error metadata; request/session data must not be logged here.
    console.error("[app-render-error]", {
      name: error.name,
      message: error.message,
      componentStack: info.componentStack,
    });
  }

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
          <Button type="button" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </div>
      </main>
    );
  }
}
