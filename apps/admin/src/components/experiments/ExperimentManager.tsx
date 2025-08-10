"use client";

import { useState, useEffect } from "react";
import { Button, Card, cn } from "@minimall/ui";
import { 
  FlaskConical, 
  Plus, 
  Play, 
  Pause, 
  BarChart3,
  Calendar,
  Target,
  TrendingUp,
  Users,
  Award
} from "lucide-react";
import { ExperimentConfig, LayoutConfig } from "@minimall/core";

interface ExperimentManagerProps {
  configId: string;
  availableBlocks: Array<{ id: string; name: string; layout: LayoutConfig }>;
  onCreateExperiment?: (experiment: Partial<ExperimentConfig>) => void;
  className?: string;
}

interface ExperimentWithResults extends ExperimentConfig {
  results?: {
    totalExposures: number;
    controlExposures: number;
    variantExposures: number;
    controlConversions: number;
    variantConversions: number;
    controlRevenue: number;
    variantRevenue: number;
    confidenceLevel: number;
    winner: 'control' | 'variant' | 'inconclusive';
  };
}

// Mock data for demonstration - in real app, this would come from API
const MOCK_EXPERIMENTS: ExperimentWithResults[] = [
  {
    key: 'grid-size-test-1',
    name: 'Grid Size Optimization',
    description: 'Testing 2x2 vs 3x3 grid layout for product discovery',
    targets: [{ blockId: 'block_abc123', variantPercent: 50 }],
    trafficSplit: 50,
    status: 'running',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    results: {
      totalExposures: 2847,
      controlExposures: 1423,
      variantExposures: 1424,
      controlConversions: 89,
      variantConversions: 127,
      controlRevenue: 4250.00,
      variantRevenue: 6780.50,
      confidenceLevel: 94.2,
      winner: 'variant',
    },
  },
  {
    key: 'spacing-test-1',
    name: 'Spacing & Padding Test',
    description: 'Testing different spacing configurations for mobile',
    targets: [{ blockId: 'block_def456', variantPercent: 30 }],
    trafficSplit: 30,
    status: 'paused',
    startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    results: {
      totalExposures: 892,
      controlExposures: 624,
      variantExposures: 268,
      controlConversions: 23,
      variantConversions: 12,
      controlRevenue: 1150.00,
      variantRevenue: 620.00,
      confidenceLevel: 12.8,
      winner: 'inconclusive',
    },
  },
  {
    key: 'preset-comparison',
    name: 'Grid vs Masonry Layout',
    description: 'Comparing grid and masonry layouts for engagement',
    targets: [{ blockId: 'block_ghi789', variantPercent: 50 }],
    trafficSplit: 50,
    status: 'completed',
    startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    results: {
      totalExposures: 5643,
      controlExposures: 2821,
      variantExposures: 2822,
      controlConversions: 156,
      variantConversions: 142,
      controlRevenue: 8920.00,
      variantRevenue: 7650.00,
      confidenceLevel: 78.5,
      winner: 'control',
    },
  },
];

export function ExperimentManager({ 
  configId, 
  availableBlocks, 
  onCreateExperiment,
  className 
}: ExperimentManagerProps) {
  const [experiments, setExperiments] = useState<ExperimentWithResults[]>(MOCK_EXPERIMENTS);
  const [activeTab, setActiveTab] = useState<'running' | 'completed' | 'draft'>('running');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const filteredExperiments = experiments.filter(exp => {
    if (activeTab === 'running') return exp.status === 'running' || exp.status === 'paused';
    if (activeTab === 'completed') return exp.status === 'completed';
    return exp.status === 'draft';
  });

  const handleToggleExperiment = (experimentKey: string) => {
    setExperiments(prev => prev.map(exp => {
      if (exp.key === experimentKey) {
        return {
          ...exp,
          status: exp.status === 'running' ? 'paused' : 'running'
        };
      }
      return exp;
    }));
  };

  const getStatusBadge = (status: ExperimentConfig['status']) => {
    const variants = {
      running: { variant: "default" as const, label: "Running", icon: Play },
      paused: { variant: "secondary" as const, label: "Paused", icon: Pause },
      completed: { variant: "outline" as const, label: "Completed", icon: Award },
      draft: { variant: "secondary" as const, label: "Draft", icon: FlaskConical },
    };
    
    const config = variants[status];
    const Icon = config.icon;
    
    const baseClasses = "inline-flex items-center gap-1 px-2 py-1 text-xs rounded";
    const variantClasses = {
      default: "bg-blue-100 text-blue-700",
      secondary: "bg-gray-100 text-gray-600",
      outline: "bg-white border border-gray-300 text-gray-700"
    };
    
    return (
      <span className={`${baseClasses} ${variantClasses[config.variant]}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const getWinnerBadge = (winner: string) => {
    if (winner === 'control') {
      return <span className="px-2 py-1 text-xs rounded bg-white border border-gray-300 text-gray-700">Control Wins</span>;
    }
    if (winner === 'variant') {
      return <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">Variant Wins</span>;
    }
    return <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600">Inconclusive</span>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const calculateConversionRate = (conversions: number, exposures: number) => {
    return exposures > 0 ? (conversions / exposures * 100).toFixed(1) : '0.0';
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FlaskConical className="w-6 h-6" />
            A/B Experiments
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Test layout variations to optimize performance
          </p>
        </div>
        
        <Button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Experiment
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Play className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {experiments.filter(e => e.status === 'running').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Award className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {experiments.filter(e => e.status === 'completed').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Exposures</p>
              <p className="text-2xl font-bold text-gray-900">
                {experiments.reduce((sum, e) => sum + (e.results?.totalExposures || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Revenue Tested</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(experiments.reduce((sum, e) => 
                  sum + (e.results?.controlRevenue || 0) + (e.results?.variantRevenue || 0), 0
                ))}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'running', label: 'Active Experiments', count: experiments.filter(e => e.status === 'running' || e.status === 'paused').length },
          { id: 'completed', label: 'Completed', count: experiments.filter(e => e.status === 'completed').length },
          { id: 'draft', label: 'Drafts', count: experiments.filter(e => e.status === 'draft').length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              activeTab === tab.id
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Experiments List */}
      <div className="space-y-4">
        {filteredExperiments.map((experiment) => (
          <Card key={experiment.key} className="p-6">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {experiment.name}
                    </h3>
                    {getStatusBadge(experiment.status)}
                    {experiment.results?.winner && experiment.results.winner !== 'inconclusive' && (
                      getWinnerBadge(experiment.results.winner)
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{experiment.description}</p>
                  
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      {experiment.trafficSplit}% traffic
                    </span>
                    {experiment.startDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Started {new Date(experiment.startDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {experiment.status === 'running' || experiment.status === 'paused' ? (
                    <Button
                      onClick={() => handleToggleExperiment(experiment.key)}
                      variant="outline"
                      size="sm"
                    >
                      {experiment.status === 'running' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      {experiment.status === 'running' ? 'Pause' : 'Resume'}
                    </Button>
                  ) : null}
                  
                  <Button variant="outline" size="sm">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Results
                  </Button>
                </div>
              </div>

              {/* Results */}
              {experiment.results && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {experiment.results.totalExposures.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">Total Exposures</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-lg font-semibold text-gray-700">Control</p>
                      <p className="text-sm text-gray-600">
                        {calculateConversionRate(experiment.results.controlConversions, experiment.results.controlExposures)}% conversion
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(experiment.results.controlRevenue)}
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-lg font-semibold text-blue-600">Variant</p>
                      <p className="text-sm text-gray-600">
                        {calculateConversionRate(experiment.results.variantConversions, experiment.results.variantExposures)}% conversion
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(experiment.results.variantRevenue)}
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600">
                        +{(((experiment.results.variantRevenue / experiment.results.controlRevenue) - 1) * 100).toFixed(1)}%
                      </p>
                      <p className="text-sm text-gray-600">Revenue Lift</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">
                        {experiment.results.confidenceLevel.toFixed(1)}%
                      </p>
                      <p className="text-sm text-gray-600">Confidence</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {filteredExperiments.length === 0 && (
        <Card className="p-12 text-center">
          <FlaskConical className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No {activeTab} experiments
          </h3>
          <p className="text-gray-600 mb-6">
            {activeTab === 'running' 
              ? "Start testing layout variations to optimize your conversion rates."
              : activeTab === 'completed'
              ? "Completed experiments will appear here with their final results."
              : "Draft experiments are saved here before you're ready to launch them."
            }
          </p>
          {activeTab === 'running' && (
            <Button onClick={() => setShowCreateForm(true)}>
              Create Your First Experiment
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}