import React from "react";

export const SimpleFooter = () => {
  return (
    <footer className="bg-card border-t py-8 mt-auto">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} CourseMax. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
};