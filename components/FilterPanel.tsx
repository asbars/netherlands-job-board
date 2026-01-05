'use client';

import { FilterState } from '@/types/job';

interface FilterPanelProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

export default function FilterPanel({ filters, onFilterChange }: FilterPanelProps) {
  const handleInputChange = (field: keyof FilterState, value: string | boolean | null) => {
    onFilterChange({
      ...filters,
      [field]: value,
    });
  };

  const clearFilters = () => {
    onFilterChange({
      title: '',
      organization: '',
      location: '',
      job_type: '',
      experience_level: '',
      remote_allowed: null,
      description: '',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6 h-fit">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        <button
          onClick={clearFilters}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Clear all
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1.5">
            Job Title
          </label>
          <input
            type="text"
            id="title"
            value={filters.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="e.g. Software Engineer"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow text-sm"
          />
        </div>

        <div>
          <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-1.5">
            Company
          </label>
          <input
            type="text"
            id="organization"
            value={filters.organization}
            onChange={(e) => handleInputChange('organization', e.target.value)}
            placeholder="Company name..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow text-sm"
          />
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1.5">
            Location
          </label>
          <input
            type="text"
            id="location"
            value={filters.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            placeholder="Amsterdam, Rotterdam..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow text-sm"
          />
        </div>

        <div>
          <label htmlFor="job_type" className="block text-sm font-medium text-gray-700 mb-1.5">
            Job Type
          </label>
          <select
            id="job_type"
            value={filters.job_type}
            onChange={(e) => handleInputChange('job_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow text-sm"
          >
            <option value="">All Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
          </select>
        </div>

        <div>
          <label htmlFor="experience_level" className="block text-sm font-medium text-gray-700 mb-1.5">
            Experience Level
          </label>
          <select
            id="experience_level"
            value={filters.experience_level}
            onChange={(e) => handleInputChange('experience_level', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow text-sm"
          >
            <option value="">All Levels</option>
            <option value="Entry">Entry Level</option>
            <option value="Mid">Mid Level</option>
            <option value="Senior">Senior</option>
            <option value="Lead">Lead/Principal</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Remote Work
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="remote"
                checked={filters.remote_allowed === null}
                onChange={() => handleInputChange('remote_allowed', null)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">All jobs</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="remote"
                checked={filters.remote_allowed === true}
                onChange={() => handleInputChange('remote_allowed', true)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Remote only</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="remote"
                checked={filters.remote_allowed === false}
                onChange={() => handleInputChange('remote_allowed', false)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">On-site only</span>
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
            Keywords in Description
          </label>
          <input
            type="text"
            id="description"
            value={filters.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="React, Python, etc..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow text-sm"
          />
        </div>
      </div>
    </div>
  );
}

