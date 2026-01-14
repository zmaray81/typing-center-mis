import React from 'react';
import { getUser } from '@/services/authApi';
import {
  Search,
  Shield,
  Building,
  FileText,
  Globe,
  CreditCard,
  Landmark,
  ExternalLink,
  Plus,
  Check,
  AlertCircle
} from 'lucide-react';

const UsefulLinksComponent = () => {
  const user = getUser();
  const links = [
    {
      name: 'MOHRE Inquiry',
      url: 'https://inquiry.mohre.gov.ae/',
      description: 'MOHRE Official Inquiry Portal',
      icon: <Search className="w-6 h-6" />,
      category: 'MOHRE'
    },
    {
      name: 'MOHRE Tasheel',
      url: 'https://eservices.mohre.gov.ae/tasheelweb/account/login',
      description: 'MOHRE Tasheel Services Login',
      icon: <Shield className="w-6 h-6" />,
      category: 'MOHRE'
    },
    {
      name: 'Dubai Invest',
      url: 'https://app.invest.dubai.ae/',
      description: 'Dubai Investment Portal',
      icon: <Building className="w-6 h-6" />,
      category: 'Invest'
    },
    {
      name: 'ICP Smart Services',
      url: 'https://smartservices.icp.gov.ae/echannels/web/client/default.html#/login',
      description: 'ICP eChannels Login Portal',
      icon: <FileText className="w-6 h-6" />,
      category: 'ICP'
    },
    {
      name: 'Dubai INS',
      url: 'https://dubins-wpp.ae/en',
      description: 'Dubai Insurance Portal',
      icon: <CreditCard className="w-6 h-6" />,
      category: 'Insurance'
    },
    {
      name: 'Dubai DED GST',
      url: 'https://eservices.dubaided.gov.ae/pages/anon/gsthme.aspx?dedqs=PM671p6QBb0lV1okx2JABgxoLLKXOgPx',
      description: 'Dubai DED GST Services',
      icon: <Landmark className="w-6 h-6" />,
      category: 'DED'
    },
    {
      name: 'GDRFA Smart Services',
      url: 'https://smart.gdrfad.gov.ae/HomePage.aspx?GdfraLocale=en-US',
      description: 'GDRFA Smart Services Portal',
      icon: <Globe className="w-6 h-6" />,
      category: 'GDRFA'
    },
    {
      name: 'MOI eServices',
      url: 'https://portal.moi.gov.ae/eservices/Default.aspx',
      description: 'Ministry of Interior eServices',
      icon: <Shield className="w-6 h-6" />,
      category: 'MOI'
    },
    {
      name: 'GDRFA Fines Inquiry',
      url: 'https://gdrfad.gov.ae/en/fines-inquiry-service',
      description: 'Check GDRFA Fines Online',
      icon: <CreditCard className="w-6 h-6" />,
      category: 'GDRFA'
    }
  ];

  // Get unique categories
  const categories = [...new Set(links.map(link => link.category))];

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
          Useful Government Links
        </h1>
        <p className="text-slate-600 text-sm md:text-base">
          Quick access to Dubai official portals for visas, company formation, and business services
        </p>
      </div>

      {/* Category Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button className="px-3 py-1.5 text-sm font-medium rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
          All Links ({links.length})
        </button>
        {categories.map(category => (
          <button
            key={category}
            className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:text-amber-600 hover:border-amber-300"
          >
            {category}
          </button>
        ))}
      </div>

      {/* Links Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {links.map((link, index) => (
          <div
            key={index}
            className="group bg-white rounded-lg border border-slate-200 hover:border-amber-300 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
          >
            <div className="p-5">
              {/* Link Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50">
                  <div className="text-amber-600">
                    {link.icon}
                  </div>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                  {link.category}
                </span>
              </div>
              
              {/* Link Content */}
              <h3 className="font-semibold text-slate-800 mb-2 group-hover:text-amber-700 line-clamp-1">
                {link.name}
              </h3>
              
              <p className="text-sm text-slate-600 mb-4 line-clamp-2 h-10">
                {link.description}
              </p>
              
              {/* Action Button */}
              <div className="flex items-center justify-between">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm font-medium text-amber-600 hover:text-amber-700"
                  onClick={(e) => e.stopPropagation()}
                >
                  Visit Portal
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
                <span className="text-xs text-slate-400">
                  Click to open
                </span>
              </div>
            </div>
            
            {/* URL Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
              <div className="text-xs text-slate-500 truncate font-mono">
                {link.url.replace('https://', '')}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Link Button */}
            {/* Add New Link Form (Admin Only) */}
      {user && (
        <div className="mt-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
          <h2 className="text-lg font-semibold text-amber-800 mb-4">Add New Link (Admin)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-amber-700 mb-1">Link Name</label>
              <input
                type="text"
                placeholder="e.g., Dubai Chamber"
                className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-700 mb-1">URL</label>
              <input
                type="text"
                placeholder="https://example.com"
                className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-amber-700 mb-1">Description</label>
              <textarea
                placeholder="Brief description of the link"
                className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                rows="2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-700 mb-1">Category</label>
              <select className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
                <option value="MOHRE">MOHRE</option>
                <option value="GDRFA">GDRFA</option>
                <option value="DED">DED</option>
                <option value="ICP">ICP</option>
                <option value="MOI">MOI</option>
                <option value="Invest">Invest</option>
                <option value="Insurance">Insurance</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                className="px-4 py-2 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors"
                onClick={() => {
                  alert('For now, links are hardcoded. In a real app, this would save to database.');
                  alert('To add permanent links, edit the links array in UsefulLinksComponent.jsx file.');
                }}
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Add Link
              </button>
            </div>
          </div>
          <p className="text-sm text-amber-600 mt-4">
            💡 <strong>Note:</strong> For this version, links are hardcoded. To add permanent links, edit the <code>links</code> array in the component file.
          </p>
        </div>
      )}

      {/* Important Information Box */}
      <div className="mt-8 md:mt-12 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200 p-5">
        <div className="flex items-start mb-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mr-2 mt-0.5" />
          <h2 className="text-lg font-semibold text-amber-800">
            Important Information
          </h2>
        </div>
        <ul className="space-y-2 text-amber-700">
          <li className="flex items-start">
            <Check className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm">All links are official government portals (secure HTTPS)</span>
          </li>
          <li className="flex items-start">
            <Check className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm">Links open in new tab for your convenience</span>
          </li>
          <li className="flex items-start">
            <Check className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm">Bookmark this page for quick access to all portals</span>
          </li>
          <li className="flex items-start">
            <AlertCircle className="w-4 h-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm font-medium">Always verify the URL is correct before entering sensitive information</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default UsefulLinksComponent;