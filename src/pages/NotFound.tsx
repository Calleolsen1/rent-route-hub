import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
 const location = useLocation();

 useEffect(() => {
 console.error("404 Error: User attempted to access non-existent route:", location.pathname);
 }, [location.pathname]);

 return (
 <div className="flex min-h-[70vh] items-center justify-center bg-background px-4">
 <div className="sb-container text-center">
 <h1 className="font-display mb-3 text-7xl md:text-8xl text-primary">404</h1>
 <p className="mb-8 text-lg text-muted-foreground">Oops! Page not found</p>
 <a href="/" className="sb-btn-primary">
 Return to Home
 </a>
 </div>
 </div>
 );
};

export default NotFound;
