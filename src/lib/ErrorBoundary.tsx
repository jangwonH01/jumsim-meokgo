/**
 * 최상위 ErrorBoundary — 렌더 트리에서 터진 예외를 잡아서
 * "앱 실행도중 문제가 발생했습니다" 같은 무정보 크래시 다이얼로그
 * 대신 사용자가 실제 에러 메시지를 볼 수 있도록 합니다.
 *
 * 디버깅용으로 에러 스택까지 화면에 보이게 함 (출시 후엔 숨겨도 됨).
 */

import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  componentStack: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, componentStack: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.setState({ componentStack: info.componentStack ?? null });
    console.error('[jumsim-mukgo] error boundary caught:', error, info.componentStack);
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        style={{
          minHeight: '100dvh',
          padding: 24,
          backgroundColor: '#fff',
          color: '#191F28',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          overflow: 'auto',
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 12 }}>😥</div>
        <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
          앗, 잠시 문제가 생겼어요
        </h1>
        <p style={{ fontSize: 14, color: '#6B7684', lineHeight: 1.5, marginBottom: 16 }}>
          개발 중 발견된 오류예요. 아래 내용을 캡처해서 개발자에게 전달해 주세요.
        </p>
        <button
          type="button"
          onClick={this.handleReload}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3182F6',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 24,
            cursor: 'pointer',
          }}
        >
          다시 시도
        </button>
        <div
          style={{
            padding: 12,
            backgroundColor: '#F7F8FA',
            borderRadius: 8,
            fontSize: 12,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            color: '#333D4B',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            lineHeight: 1.5,
          }}
        >
          <strong>{this.state.error.name}:</strong> {this.state.error.message}
          {'\n\n'}
          {this.state.error.stack}
          {this.state.componentStack ? '\n\n--- component stack ---' + this.state.componentStack : ''}
        </div>
      </div>
    );
  }
}
