export const AppFooter = () => {
  return (
    <footer className="bg-card border-t mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} CourseMax. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
};