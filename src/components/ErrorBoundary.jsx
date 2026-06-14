import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ error, info });
    // Also log to console so dev server shows it
    console.error('Uncaught error in React tree:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{padding:30}}>
        <h2 style={{color:'#ff6b6b'}}>Uygulamada beklenmedik bir hata oluştu.</h2>
        <p style={{color:'#f1f5f9'}}>Hata: <strong style={{color:'#ffd6d6'}}>{this.state.error?.message}</strong></p>
        <details style={{whiteSpace:'pre-wrap',background:'#071021',padding:12,borderRadius:8,marginTop:12}}>
          {this.state.info?.componentStack || this.state.error?.stack}
        </details>
        <div style={{marginTop:12}}>
          <button onClick={() => window.location.reload()} className="green-button">Sayfayı Yeniden Yükle</button>
        </div>
      </div>
    );
  }
}
