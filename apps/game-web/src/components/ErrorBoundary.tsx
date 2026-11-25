import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('界面渲染异常', error, info);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="app">
        <div className="shell shell--narrow">
          <section className="panel error-panel" role="alert">
            <h2>界面出现异常</h2>
            <p className="hint hint--warn">若对局已开始，进度已保存在本地，重新加载后可继续上局。</p>
            <pre className="error-detail">{error.message}</pre>
            <div className="result-actions">
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => window.location.reload()}
              >
                重新加载
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }
}
