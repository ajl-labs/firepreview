import "./App.css";
import { RouterProvider } from "react-router";
import { router } from "./pages/router";
import { useEffect } from "react";
import { useDatabaseStore } from "./store/database";

const App = () => {
  const hydrate = useDatabaseStore((s) => s.hydrate);
  useEffect(() => {
    hydrate();
    // 1. Define the media query matcher
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    // 2. Define a function to apply or remove the 'dark' class
    const handleThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    // 3. Run the check immediately on boot
    handleThemeChange(mediaQuery);

    // 4. Listen for real-time OS system theme changes
    mediaQuery.addEventListener("change", handleThemeChange);

    // Cleanup listener on unmount
    return () => mediaQuery.removeEventListener("change", handleThemeChange);
  }, []);

  return <RouterProvider router={router} useTransitions />;
};

export default App;

//TODO: checkout this article for more info.
// https://medium.com/@tomronw/mapping-success-building-a-simple-tracking-desktop-app-with-go-react-and-wails-ac83dbcbccca
