import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface RouterContextType {
  path: string;
  navigate: (options: { to: string }) => void;
  params: Record<string, string>;
}

const RouterContext = createContext<RouterContextType>({
  path: '/',
  navigate: () => {},
  params: {}
});

function getPathFromLocation(): string {
  // Support both hash and pathname
  const hash = window.location.hash.replace(/^#/, '');
  if (hash) {
    return hash.startsWith('/') ? hash : '/' + hash;
  }
  return window.location.pathname || '/';
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState<string>(getPathFromLocation());

  useEffect(() => {
    const handlePopState = () => {
      setPath(getPathFromLocation());
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const navigate = ({ to }: { to: string }) => {
    window.location.hash = to;
    setPath(to);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Extract params
  const params: Record<string, string> = {};
  if (path.startsWith('/dashboard/player/')) {
    params.playerId = path.replace('/dashboard/player/', '');
  }

  return (
    <RouterContext.Provider value={{ path, navigate, params }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useNavigate() {
  const { navigate } = useContext(RouterContext);
  return navigate;
}

export function useParams(_options?: { from?: string }) {
  const { params } = useContext(RouterContext);
  return params;
}

export function useLocation() {
  const { path } = useContext(RouterContext);
  return { pathname: path };
}

export function Link({
  to,
  children,
  className,
  title,
  onClick,
  ...rest
}: {
  to: string;
  children: ReactNode;
  className?: string;
  title?: string;
  onClick?: (e: React.MouseEvent) => void;
  [key: string]: any;
}) {
  const { navigate } = useContext(RouterContext);

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) onClick(e);
    if (!e.defaultPrevented) {
      e.preventDefault();
      navigate({ to });
    }
  };

  return (
    <a href={`#${to}`} onClick={handleClick} className={className} title={title} {...rest}>
      {children}
    </a>
  );
}
