import React from 'react';

const PartyDetails = ({ party }) => {
  return (
    <div className="border rounded-lg p-4 mb-4">
      <h3 className="font-semibold text-lg">{party.role}</h3>
      <p><strong>Name:</strong> {party.name || 'N/A'}</p>
      <p><strong>Type:</strong> {party.type || 'N/A'}</p>
      <p><strong>Email:</strong> {party.email || 'N/A'}</p>
      <p><strong>Phone:</strong> {party.phone || 'N/A'}</p>
    </div>
  );
};

export default PartyDetails;
