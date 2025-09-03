import React from 'react';

const Test = () => {
  console.log('Test component rendering');
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0' }}>
      <h1 style={{ color: '#FF4F2E' }}>CourseMax Test</h1>
      <p>Si vous voyez ce message, React fonctionne correctement.</p>
    </div>
  );
};

export default Test;