import { useState } from 'react';
import SearchRealm from './search/SearchRealm';
import { OfflineBanner, ToastHost } from './state/services';

export type Realm = 'search' | 'engine';

export default function App() {
  const [realm, setRealm] = useState<Realm>('search');

  return (
    <div>
      <nav className="nav">
        <span className="grad-text" style={{ fontWeight: 700, letterSpacing: 4, fontSize: 15 }}>
          DISTIROLIS
        </span>
        <div className="nav-pills">
          <button
            className={`nav-pill ${realm === 'search' ? 'active' : ''}`}
            onClick={() => setRealm('search')}
          >
            ⌕ Search
          </button>
          <button
            className={`nav-pill ${realm === 'engine' ? 'active' : ''}`}
            onClick={() => setRealm('engine')}
          >
            ⚙ Engine Room
          </button>
        </div>
        <span style={{ width: 120 }} />
      </nav>
      <OfflineBanner />
      {realm === 'search' ? <SearchRealm /> : <div data-testid="engine-realm" />}
      <ToastHost />
    </div>
  );
}
