import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: "red" }}>
          <h1>Something went wrong.</h1>
          <pre>{this.state.error?.toString()}</pre>
          <pre>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// Monkey patch fetch to universally inject User/Organization identity headers
const originalFetch = window.fetch;
window.fetch = async function (...args) {
  let [resource, config] = args;
  
  let url = '';
  if (typeof resource === 'string') {
    url = resource;
  } else if (resource instanceof URL) {
    url = resource.toString();
  } else if (resource && typeof resource === 'object' && 'url' in resource) {
    url = (resource as any).url || '';
  }

  if (url.startsWith('/api/') || url.includes('/api/')) {
    config = config || {};
    const headersObj = config.headers || {};
    
    // Normalize keys to find case-insensitive matches
    const hasOrgId = Object.keys(headersObj).some(k => k.toLowerCase() === 'x-organization-id');
    const hasUserId = Object.keys(headersObj).some(k => k.toLowerCase() === 'x-user-id');
    const hasUserRole = Object.keys(headersObj).some(k => k.toLowerCase() === 'x-user-role');

    config.headers = {
      ...headersObj,
    };

    if (!hasUserId) {
      config.headers['X-User-Id'] = sessionStorage.getItem('userId') || '';
    }
    if (!hasUserRole) {
      config.headers['X-User-Role'] = sessionStorage.getItem('userRole') || '';
    }
    if (!hasOrgId) {
      config.headers['X-Organization-Id'] = sessionStorage.getItem('organizationId') || 'null';
    }
  }
  
  return originalFetch(resource, config);
};

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
