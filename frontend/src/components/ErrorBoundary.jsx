import { Component } from 'react';

// A blank page is the worst possible failure mode — the person has no idea
// what happened or what to do. This catches any rendering error anywhere
// below it in the tree and shows a recoverable message with a reload button
// instead of silently unmounting the whole app.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Left visible on purpose: this is the first place to look if the site
    // ever goes blank again — the real error and component stack land here.
    console.error('[ErrorBoundary] Caught an error that would otherwise have blanked the page:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen grid place-items-center px-4 text-center bg-rice-50 dark:bg-leaf-900">
          <div>
            <h1 className="font-display font-bold text-2xl text-leaf-500 dark:text-turmeric-100">
              Something went wrong
            </h1>
            <p className="mt-3 text-sm text-ink-500 dark:text-rice-200/70 max-w-sm">
              Please try reloading the page. If this keeps happening, let the store owner know.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 rounded-full bg-leaf-500 hover:bg-leaf-400 text-white font-semibold px-6 py-3 transition-colors"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
