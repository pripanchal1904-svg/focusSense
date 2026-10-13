import React from 'react';
import { ClinicalProtocolId } from '../types';

interface ClinicalGroundingSuiteProps {
  onSelectProtocol: (protoId: ClinicalProtocolId) => void;
}

const PROTOCOLS: {
  id: ClinicalProtocolId;
  code: string;
  category: string;
  title: string;
  desc: string;
}[] = [
  {
    id: 'boxBreathing',
    code: '01',
    category: 'AUTONOMIC',
    title: 'Box Breathing',
    desc: '4-4-4-4 Square pacing',
  },
  {
    id: 'sensoryGrounding',
    code: '02',
    category: 'COGNITIVE',
    title: '5-4-3-2-1 Sensory',
    desc: 'Anchoring sequence',
  },
  {
    id: 'ocularReset',
    code: '03',
    category: 'OCULAR',
    title: '20-20-20 Reset',
    desc: 'Ciliary muscle relief',
  },
  {
    id: 'vagusNerve',
    code: '04',
    category: 'VAGAL',
    title: 'Physiological Sigh',
    desc: 'Two inhales + long exhale',
  },
  {
    id: 'postureHydration',
    code: '05',
    category: 'SOMATIC',
    title: 'Somatic Reset',
    desc: 'Spine decompression',
  },
];

export const ClinicalGroundingSuite: React.FC<ClinicalGroundingSuiteProps> = ({
  onSelectProtocol,
}) => {
  return (
    <div className="metric-card rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs uppercase font-mono tracking-wider text-gray-500">
            Clinical Grounding Suite
          </div>
          <h2 className="text-sm font-semibold text-gray-900">
            Rapid Physiological Interventions
          </h2>
        </div>
        <span className="text-xs text-gray-500">5 Evidence-Based Protocols</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-xs mt-3">
        {PROTOCOLS.map((proto) => (
          <button
            key={proto.id}
            type="button"
            onClick={() => onSelectProtocol(proto.id)}
            className="p-3 text-left border border-[#E5E7EB] rounded hover:border-[#0F766E] hover:bg-[#0F766E]/5 transition group cursor-pointer"
          >
            <div className="font-mono text-[10px] text-[#0F766E] font-semibold">
              {proto.code} • {proto.category}
            </div>
            <div className="font-medium text-gray-800 mt-1 group-hover:text-[#0F766E] transition-colors">
              {proto.title}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">{proto.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
