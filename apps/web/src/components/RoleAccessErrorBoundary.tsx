import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AccessDenied } from './AccessDenied';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class RoleAccessErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if it's an access-related error
    if (error.message?.toLowerCase().includes('access') ||
        error.message?.toLowerCase().includes('permission') ||
        error.message?.toLowerCase().includes('unauthorized')) {
      return { hasError: true, error };
    }
    // Re-throw non-access errors
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Role access error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <AccessDenied message={this.state.error?.message} />;
    }

    return this.props.children;
  }
}
