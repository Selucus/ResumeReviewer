import React, { useState } from 'react';

interface Props {
  onSubmit: (jobDescription: string) => void;
}

export const JobDescriptionInput: React.FC<Props> = ({ onSubmit }) => {
  const [jobDescription, setJobDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(jobDescription);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700">
          Job Description (Optional)
        </label>
        <textarea
          id="jobDescription"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          rows={5}
          placeholder="Paste the job description here..."
        />
      </div>
      <button
        type="submit"
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
      >
        Analyze with Job Description
      </button>
    </form>
  );
}; 