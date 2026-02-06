import React from 'react';
import { ButtonGroup, ToggleButton } from 'react-bootstrap';
import { NETWORKS, NetworkType } from '../config/networks';

interface NetworkSelectorProps {
  selectedNetwork: NetworkType;
  onChange: (network: NetworkType) => void;
}

const NetworkSelector: React.FC<NetworkSelectorProps> = ({ selectedNetwork, onChange }) => {
  return (
    <div className="mb-4">
      <label className="form-label fw-bold">Select Network:</label>
      <ButtonGroup className="w-100">
        {(Object.keys(NETWORKS) as NetworkType[]).map((key) => (
          <ToggleButton
            key={key}
            id={`toggle-${key}`}
            type="radio"
            variant={selectedNetwork === key ? 'primary' : 'outline-primary'}
            name="networkToggle"
            value={key}
            checked={selectedNetwork === key}
            onChange={() => onChange(key)}
          >
            {NETWORKS[key].name}
          </ToggleButton>
        ))}
      </ButtonGroup>
    </div>
  );
};

export default NetworkSelector;
