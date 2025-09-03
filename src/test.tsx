import React from 'react';
import { Header } from "@/components/header";

const Test = () => {
  console.log('Test component rendering with Header');
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary mb-4">Test du Header</h1>
          <p className="text-muted-foreground">Si vous voyez le header ci-dessus, il fonctionne correctement.</p>
        </div>
      </main>
    </div>
  );
};

export default Test;