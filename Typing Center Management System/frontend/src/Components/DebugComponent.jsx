import React, { useEffect } from 'react';

const DebugComponent = () => {
  useEffect(() => {
    console.log('=== DEBUG COMPONENT RENDERED ===');
    console.log('Window location:', window.location.pathname);
    console.log('=== END DEBUG ===');
  }, []);

  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
      <h1 className="text-xl font-bold text-red-700 mb-2">DEBUG VIEW</h1>
      <p className="text-red-600">This is a debug component to check rendering.</p>
      <p className="text-red-600 mt-2">Current URL: {window.location.pathname}</p>
    </div>
  );
};

export default DebugComponent;