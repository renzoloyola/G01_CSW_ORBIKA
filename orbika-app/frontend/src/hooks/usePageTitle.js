import { useEffect } from "react";

export function usePageTitle(title) {
  useEffect(() => {
    const prev = document.title;
    if (title) {
      document.title = `${title} — ÓrbiKa`;
    }
    return () => {
      document.title = prev;
    };
  }, [title]);
}

export default usePageTitle;
